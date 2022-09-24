package datainsider.analytics.service

import com.twitter.util.Future
import datainsider.analytics.domain.AnalyticsConfig
import datainsider.analytics.repository.ReportSchemaRepository
import datainsider.ingestion.domain._

import javax.inject.Inject

/**
  * @author andy
  * @since 7/9/20
  */

@deprecated("no longer used")
trait ReportSchemaService {

  /**
    * Init database and tables used for report
    * @param organizationId
    * @return
    */
  def initialize(organizationId: Long): Future[Boolean]

  def createReportDatabaseIfRequired(organizationId: Long): Future[Unit]

  def createReportUserCollectionTbl(organizationId: Long): Future[TableSchema]

  def createReportActiveUserMetricTbl(organizationId: Long): Future[TableSchema]

  def getReportDb(organizationId: Long): Future[DatabaseSchema]

}

@deprecated("no longer used")
case class ReportSchemaServiceImpl @Inject() (
    config: AnalyticsConfig,
    reportSchemaRepository: ReportSchemaRepository
) extends ReportSchemaService {

  override def initialize(organizationId: Long): Future[Boolean] = {
    for {
      _ <- createReportDatabaseIfRequired(organizationId)
      _ <- createReportActiveUserMetricTbl(organizationId)
      _ <- createReportUserCollectionTbl(organizationId)
    } yield true
  }

  override def createReportDatabaseIfRequired(organizationId: Long): Future[Unit] = {
    reportSchemaRepository.existsDatabase(organizationId).flatMap {
      case false => reportSchemaRepository.createDatabase(organizationId)
      case true  => Future.Unit
    }
  }

  override def createReportUserCollectionTbl(organizationId: Long): Future[TableSchema] = {
    reportSchemaRepository.createUserCollectionTable(organizationId)
  }

  override def createReportActiveUserMetricTbl(organizationId: Long): Future[TableSchema] = {
    reportSchemaRepository.createReportActiveUserMetricTbl(organizationId)
  }

  override def getReportDb(organizationId: Long): Future[DatabaseSchema] = {

    reportSchemaRepository.getDatabase(organizationId)
  }

}
