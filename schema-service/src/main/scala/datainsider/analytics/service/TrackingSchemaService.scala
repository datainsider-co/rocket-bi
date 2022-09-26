package datainsider.analytics.service

import com.twitter.util.Future
import datainsider.analytics.domain.{AnalyticsConfig, TrackingColumnConfig}
import datainsider.analytics.repository.TrackingSchemaRepository
import datainsider.analytics.service.tracking.TrackingSchemaMerger
import datainsider.ingestion.domain._
import datainsider.profiler.Profiler

import javax.inject.Inject

/**
  * @author andy
  * @since 7/9/20
  */

trait TrackingSchemaService {

  def initialize(organizationId: Long): Future[Unit]

  def createEventDetailTbl(organizationId: Long, tblName: String, columns: Seq[Column]): Future[TableSchema]

  def createTrackingProfileTbl(organizationId: Long, columns: Seq[Column]): Future[TableSchema]

  def getTrackingDb(organizationId: Long): Future[DatabaseSchema]

  def getUserProfileSchema(organizationId: Long): Future[TableSchema]

  def getEventSchema(organizationId: Long): Future[TableSchema]

  def getEventDetailSchema(organizationId: Long, event: String): Future[Option[TableSchema]]

  def multiGetEventDetailSchema(organizationId: Long, events: Seq[String]): Future[Map[String, TableSchema]]

  def mergeEventDetailSchema(organization: Long, event: String, properties: Map[String, Any]): Future[TableSchema]
}

case class TrackingSchemaServiceImpl @Inject() (
    trackingSchemaRepository: TrackingSchemaRepository,
    trackingSchemaMerger: TrackingSchemaMerger
) extends TrackingSchemaService {
  import scala.concurrent.ExecutionContext.Implicits.global
  override def initialize(organizationId: Long): Future[Unit] = {
    for {
      _ <- ensureTrackingDatabase(organizationId)
    } yield {}
  }

  private def ensureTrackingDatabase(organizationId: Long): Future[Unit] = {
    trackingSchemaRepository.existsDatabase(organizationId).flatMap {
      case false => trackingSchemaRepository.createDatabase(organizationId)
      case true  => Future.Unit
    }
  }

  override def createEventDetailTbl(
      organizationId: Long,
      event: String,
      columns: Seq[Column]
  ): Future[TableSchema] = {
    trackingSchemaRepository.createEventTable(organizationId, event, columns)
  }

  override def createTrackingProfileTbl(organizationId: Long, columns: Seq[Column]): Future[TableSchema] = {
    trackingSchemaRepository.createProfileTable(organizationId, columns)
  }

  override def getTrackingDb(organizationId: Long): Future[DatabaseSchema] =
    Profiler(s"[Tracking] ${this.getClass.getName}::TrackingSchemaService") {
      trackingSchemaRepository.getDatabase(organizationId)
    }

  override def getUserProfileSchema(organizationId: Long): Future[TableSchema] = {
    trackingSchemaRepository.getProfileTable(organizationId)
  }

  override def getEventSchema(organizationId: Long): Future[TableSchema] = {
    trackingSchemaRepository.getEventTable(organizationId)
  }

  override def getEventDetailSchema(organizationId: Long, event: String): Future[Option[TableSchema]] = {
    trackingSchemaRepository.getEventDetailTable(organizationId, event)
  }

  override def multiGetEventDetailSchema(
      organizationId: Long,
      events: Seq[String]
  ): Future[Map[String, TableSchema]] = {
    trackingSchemaRepository.multiGetEventDetailTables(organizationId, events);
  }

  override def mergeEventDetailSchema(
      organization: Long,
      event: String,
      properties: Map[String, Any]
  ): Future[TableSchema] = {
    trackingSchemaMerger.mergeEventDetailSchema(organization, event, properties)
  }
}
