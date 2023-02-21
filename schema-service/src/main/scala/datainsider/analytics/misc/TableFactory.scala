package datainsider.analytics.misc

import datainsider.analytics.domain._
import datainsider.ingestion.domain._
import datainsider.ingestion.util.Implicits.ImplicitString

import javax.inject.Inject

/**
  * @author andy
  * @since 16/11/20
  */
@deprecated("no longer used")
trait TableFactory {

  /**
    * Build table schema to create a table to store active user metrics: A1,A7,A14,A30 ....etc
    * @param organizationId
    * @return
    */
  def buildReportActiveUserMetricTbl(organizationId: Long): TableSchema

  /**
    * Build table schema to create a table to users collection report
    * @param organizationId
    * @return
    */
  def buildUserCollectionTbl(organizationId: Long): TableSchema

  /**
    * Build table schema to create a table to store event detail tracking data.
    * @param organizationId
    * @param event
    * @param columns
    * @return
    */
  def buildTrackingEventTbl(organizationId: Long, event: String, columns: Seq[Column]): TableSchema

  /**
    * Build table schema to create a table in order to store tracking profiles
    * @param organizationId
    * @param columns
    * @return
    */
  def buildTrackingProfileTbl(organizationId: Long, columns: Seq[Column]): TableSchema
}

@deprecated("no longer used")
case class TableFactoryImpl @Inject() (config: AnalyticsConfig, trackingColumnConfig: TrackingColumnConfig)
    extends TableFactory {

  def buildUserCollectionTbl(organizationId: Long): TableSchema = {
    val columns = Seq(
      DateColumn(UserCollectionFields.DATE, UserCollectionFields.DATE.asPrettyDisplayName),
      StringColumn(UserCollectionFields.CATEGORY, ActiveUserFields.CATEGORY.asPrettyDisplayName),
      StringColumn(UserCollectionFields.USER_ID, UserCollectionFields.USER_ID.asPrettyDisplayName),
      Int64Column(UserCollectionFields.TOTAL_ACTION, UserCollectionFields.TOTAL_ACTION.asPrettyDisplayName),
      Int64Column(UserCollectionFields.TIME_MS, UserCollectionFields.TIME_MS.asPrettyDisplayName),
      Int64Column(
        UserCollectionFields.INSERTED_TIME,
        UserCollectionFields.INSERTED_TIME.asPrettyDisplayName
      )
    )
    TableSchema(
      name = config.reportUserCollectionTbl,
      dbName = config.getReportDbName(organizationId),
      organizationId = organizationId,
      displayName = config.reportUserCollectionTbl.asPrettyDisplayName,
      columns = columns,
      primaryKeys = Seq(UserCollectionFields.CATEGORY, UserCollectionFields.DATE, UserCollectionFields.USER_ID),
      orderBys = Seq(UserCollectionFields.CATEGORY, UserCollectionFields.DATE, UserCollectionFields.USER_ID),
      partitionBy = Seq(UserCollectionFields.CATEGORY, s"toYYYYMMDD(${ActiveUserFields.DATE})"),
      engine = Some(s"ReplacingMergeTree(${UserCollectionFields.INSERTED_TIME})")
    )
  }

  def buildReportActiveUserMetricTbl(organizationId: Long): TableSchema = {
    val columns = Seq(
      DateColumn(UserCollectionFields.DATE, UserCollectionFields.DATE.asPrettyDisplayName),
      StringColumn(ActiveUserFields.CATEGORY, ActiveUserFields.CATEGORY.asPrettyDisplayName),
      Int64Column(ActiveUserFields.A1, ActiveUserFields.A1.asPrettyDisplayName, defaultValue = Some(0L)),
      Int64Column(
        ActiveUserFields.TOTAL_A1,
        ActiveUserFields.TOTAL_A1.asPrettyDisplayName,
        defaultValue = Some(0L)
      ),
      Int64Column(ActiveUserFields.A7, ActiveUserFields.A7.asPrettyDisplayName, defaultValue = Some(0L)),
      Int64Column(
        ActiveUserFields.TOTAL_A7,
        ActiveUserFields.TOTAL_A7.asPrettyDisplayName,
        defaultValue = Some(0L)
      ),
      Int64Column(ActiveUserFields.A14, ActiveUserFields.A14.asPrettyDisplayName, defaultValue = Some(0L)),
      Int64Column(
        ActiveUserFields.TOTAL_A14,
        ActiveUserFields.TOTAL_A14.asPrettyDisplayName,
        defaultValue = Some(0L)
      ),
      Int64Column(ActiveUserFields.A30, ActiveUserFields.A30.asPrettyDisplayName, defaultValue = Some(0L)),
      Int64Column(
        ActiveUserFields.TOTAL_A30,
        ActiveUserFields.TOTAL_A30.asPrettyDisplayName,
        defaultValue = Some(0L)
      ),
      Int64Column(ActiveUserFields.An, "New", defaultValue = Some(0L)),
      Int64Column(ActiveUserFields.A0, ActiveUserFields.A0.asPrettyDisplayName, defaultValue = Some(0L)),
      Int64Column(ActiveUserFields.TIME_MS, ActiveUserFields.TIME_MS.asPrettyDisplayName),
      Int64Column(
        ActiveUserFields.INSERTED_TIME,
        ActiveUserFields.INSERTED_TIME.asPrettyDisplayName
      )
    )
    TableSchema(
      name = config.reportActiveUserMetricTbl,
      dbName = config.getReportDbName(organizationId),
      organizationId = organizationId,
      displayName = config.reportActiveUserMetricTbl.asPrettyDisplayName,
      columns = columns,
      primaryKeys = Seq(ActiveUserFields.CATEGORY, ActiveUserFields.DATE),
      orderBys = Seq(ActiveUserFields.CATEGORY, ActiveUserFields.DATE),
      partitionBy = Seq(ActiveUserFields.CATEGORY, s"toYYYYMM(${ActiveUserFields.DATE})"),
      engine = Some(s"ReplacingMergeTree(${ActiveUserFields.INSERTED_TIME})")
    )
  }

  override def buildTrackingEventTbl(organizationId: Long, event: String, columns: Seq[Column]): TableSchema = {
    TableSchema(
      name = event,
      dbName = config.getTrackingDbName(organizationId),
      organizationId = organizationId,
      displayName = config.getEventDisplayName(event),
      columns = columns,
      partitionBy = Seq(s"tuple()")
    )

  }

  override def buildTrackingProfileTbl(organizationId: Long, columns: Seq[Column]): TableSchema = {
    val extraPropertyColumn = Seq(
      NestedColumn(
        ProfileColumnIds.PROPERTIES,
        ProfileColumnIds.PROPERTIES.asPrettyDisplayName,
        nestedColumns = columns.removeColumns(trackingColumnConfig.defaultProfileColumns)
      )
    ).filterNot(_.nestedColumns == null)
      .filterNot(_.nestedColumns.isEmpty)
    TableSchema(
      name = config.trackingProfileTbl,
      dbName = config.getTrackingDbName(organizationId),
      organizationId = organizationId,
      displayName = config.trackingProfileTbl.asPrettyDisplayName,
      columns = trackingColumnConfig.defaultProfileColumns ++ extraPropertyColumn,
      primaryKeys = Seq(ProfileColumnIds.USER_ID),
      orderBys = Seq(ProfileColumnIds.USER_ID),
      engine = Some(s"ReplacingMergeTree()")
    )

  }
}
