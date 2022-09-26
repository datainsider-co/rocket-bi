package datainsider.analytics.repository

import com.twitter.inject.Logging
import datainsider.analytics.domain._
import datainsider.client.util.JdbcClient
import datainsider.ingestion.util.TimeUtils

import java.sql.Date

@deprecated("no longer used")
trait ReportDataRepository {

  def clearUserCollection(organizationId: Long, category: String, time: Long): Unit

  def writeUserCollection(
      organizationId: Long,
      category: String,
      userWithActionMetrics: Seq[UserActionMetricData],
      time: Long
  ): Int

  def deleteActiveUserResult(organizationId: Long, category: String, time: Long): Boolean

  def saveActiveUserResult(organizationId: Long, category: String, metrics: ActiveUserMetric, time: Long): Boolean

}

case class ClickHouseReportDataRepository(
    config: AnalyticsConfig,
    client: JdbcClient
) extends ReportDataRepository
    with Logging {

  override def deleteActiveUserResult(organizationId: Long, category: String, time: Long): Boolean = {
    val (dbName, tblName) = (config.getReportDbName(organizationId), config.reportActiveUserMetricTbl)
    val query = s"""
                    |ALTER TABLE $dbName.$tblName
                    |DELETE WHERE ${ActiveUserFields.CATEGORY} = ? AND ${ActiveUserFields.DATE} = ?
                    |""".stripMargin

    client.execute(query, category, new Date(time))
  }

  override def saveActiveUserResult(
      organizationId: Long,
      category: String,
      metrics: ActiveUserMetric,
      time: Long
  ): Boolean = {
    val record = Seq(
      new Date(time),
      category,
      metrics.a1,
      metrics.totalA1,
      metrics.a7,
      metrics.totalA7,
      metrics.a14,
      metrics.totalA14,
      metrics.a30,
      metrics.totalA30,
      metrics.an,
      metrics.a0,
      time,
      System.currentTimeMillis()
    )
    client.executeUpdate(buildInsertQuery(organizationId), record: _*) > 0
  }

  private def buildInsertQuery(organizationId: Long): String = {

    val (dbName, tblName) = (config.getReportDbName(organizationId), config.reportActiveUserMetricTbl)
    val columns = Seq(
      UserCollectionFields.DATE,
      ActiveUserFields.CATEGORY,
      ActiveUserFields.A1,
      ActiveUserFields.TOTAL_A1,
      ActiveUserFields.A7,
      ActiveUserFields.TOTAL_A7,
      ActiveUserFields.A14,
      ActiveUserFields.TOTAL_A14,
      ActiveUserFields.A30,
      ActiveUserFields.TOTAL_A30,
      ActiveUserFields.An,
      ActiveUserFields.A0,
      ActiveUserFields.TIME_MS,
      ActiveUserFields.INSERTED_TIME
    )

    s"""
       |INSERT INTO $dbName.$tblName(${columns.mkString(", ")})
       |VALUES(${columns.map(_ => "?").mkString(", ")})
       |""".stripMargin
  }

  override def clearUserCollection(organizationId: Long, category: String, time: Long): Unit = {
    val (dbName, tblName) = (config.getReportDbName(organizationId), config.reportUserCollectionTbl)
    val query =
      s"""ALTER TABLE $dbName.$tblName DROP PARTITION ('$category',${TimeUtils.format(time, "yyyyMMdd")})""".stripMargin

    client.execute(query)
  }

  override def writeUserCollection(
      organizationId: Long,
      category: String,
      metrics: Seq[UserActionMetricData],
      time: Long
  ): Int = {
    val (dbName, tblName) = (config.getReportDbName(organizationId), config.reportUserCollectionTbl)
    val columnNames = Seq(
      UserCollectionFields.DATE,
      UserCollectionFields.CATEGORY,
      UserCollectionFields.USER_ID,
      UserCollectionFields.TOTAL_ACTION,
      UserCollectionFields.TIME_MS,
      UserCollectionFields.INSERTED_TIME
    )
    val records = metrics.map(metric =>
      Seq(
        new Date(time),
        category,
        metric.userId,
        metric.totalAction,
        time,
        System.currentTimeMillis()
      )
    )

    val query = s"""
             |INSERT INTO $dbName.$tblName(${columnNames.mkString(", ")})
             |VALUES(${columnNames.map(_ => "?").mkString(", ")})
             |""".stripMargin
    client.executeBatchUpdate(query, records)
  }
}
