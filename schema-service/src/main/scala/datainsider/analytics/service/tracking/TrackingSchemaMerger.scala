package datainsider.analytics.service.tracking

import com.twitter.inject.Logging
import com.twitter.util.{Future, Return}
import datainsider.analytics.misc.ColumnDetector
import datainsider.analytics.service.TrackingSchemaService
import datainsider.ingestion.domain._
import datainsider.ingestion.repository.SchemaRepository
import datainsider.ingestion.util.Implicits.ImplicitString
import datainsider.profiler.Profiler

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

trait TrackingSchemaMerger {
  @deprecated("old tracking mechanism")
  def mergeProfileSchema(organizationId: Long, properties: Map[String, Any]): Future[TableSchema]

  @deprecated("old tracking mechanism")
  def mergeEventSchema(organizationId: Long, properties: Map[String, Any]): Future[TableSchema]

  def mergeEventDetailSchema(organizationId: Long, event: String, properties: Map[String, Any]): Future[TableSchema]
}

case class TrackingSchemaMergerImpl @Inject() (
    schemaRepository: SchemaRepository,
    trackingSchemaService: TrackingSchemaService
) extends TrackingSchemaMerger
    with Logging {
  override def mergeProfileSchema(organizationId: Long, properties: Map[String, Any]): Future[TableSchema] = {
    val columns = ColumnDetector.detectColumns(properties)
    trackingSchemaService.getUserProfileSchema(organizationId).transform {
      case Return(schema) => updateNewColumns(organizationId, columns, schema)
      case _              => trackingSchemaService.createTrackingProfileTbl(organizationId, columns)
    }
  }

  override def mergeEventSchema(organizationId: Long, properties: Map[String, Any]): Future[TableSchema] = {
    ???
  }

  override def mergeEventDetailSchema(
      orgId: Long,
      eventName: String,
      properties: Map[String, Any]
  ): Future[TableSchema] =
    Profiler(s"[Tracking] ${this.getClass.getName}::mergeEventDetailSchema") {
      val tblName = eventName.toSnakeCase
      val columns = ColumnDetector.detectColumns(properties)
      for {
        tblSchema <- trackingSchemaService.getTrackingDb(orgId).map(_.findTableAsOption(tblName)) flatMap {
          case Some(tblSchema) => updateNewColumns(orgId, columns, tblSchema)
          case _               => createTableSchema(orgId, tblName, properties)
        }
      } yield {
        // only return actual columns, use for detecting fields in event tracking request
        tblSchema.copy(columns = tblSchema.columns.filterNot(_.isMaterialized()))
      }
    }

  private def createTableSchema(orgId: Long, event: String, properties: Map[String, Any]): Future[TableSchema] =
    Profiler(s"[Tracking] ${this.getClass.getName}::createTableSchema") {
      val columns = ColumnDetector.detectColumns(properties)
      trackingSchemaService.createEventDetailTbl(
        orgId,
        event,
        columns
      )

    }

  private def updateNewColumns(
      organizationId: Long,
      columns: Seq[Column],
      oldSchema: TableSchema
  ): Future[TableSchema] =
    Profiler(s"[Tracking] ${this.getClass.getName}::updateNewColumns") {
      val dbName = oldSchema.dbName

      val newColumns = columns.removeColumns(oldSchema.columns)
      val changedNestedColumns = oldSchema.getNestedColumnChanged(columns)
      val updatedColumns = newColumns ++ changedNestedColumns

      if (updatedColumns.isEmpty) {
        Future.value(oldSchema)
      } else {
        schemaRepository
          .mergeColumns(organizationId, dbName, oldSchema.name, updatedColumns)
          .map(_ => oldSchema.copyAsMergeMultipleColumns(updatedColumns))
      }
    }
}
