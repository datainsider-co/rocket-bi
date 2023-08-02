package co.datainsider.datacook.service.worker

import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_caas.domain.Page
import co.datainsider.caas.user_profile.client.OrgClientService
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.datacook.domain.Ids.OrganizationId
import co.datainsider.datacook.pipeline.operator.OperatorService
import co.datainsider.datacook.service.ETLPreviewService
import co.datainsider.datacook.util
import co.datainsider.datacook.util.StringUtils
import co.datainsider.schema.domain.DatabaseShortInfo
import co.datainsider.schema.misc.ClickHouseUtils
import co.datainsider.schema.misc.ClickHouseUtils.PREVIEW_ETL_DATABASE_PATTERN
import co.datainsider.schema.service.SchemaService
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike

import javax.inject.{Inject, Singleton}
import scala.collection.mutable.ArrayBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 11/20/2021 - 2:12 PM
  */
@Singleton
class RemoveEtlDataWorker @Inject() (
    schemaService: SchemaService,
    previewService: ETLPreviewService,
    orgClientService: OrgClientService
) extends Runnable
    with Logging {
  private val previewPrefixDbName = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")

  private def listPreviewDbNames(): Future[Array[String]] = {
    for {
      previewData <- previewService.listEtlInPreview()
    } yield {
      previewData.map(item => OperatorService.getDbName(item.organizationId, item.etlJobId, previewPrefixDbName))
    }
  }

  override def run(): Unit = {
    logger.info(s"RemovePreviewEtlDataWorker::run:: start")
    val ignoredDbNameSet: Set[String] = listPreviewDbNames().syncGet().toSet
    listETLDatabases(
      (orgId: Long, dbNames: Seq[String]) => {
        val deleteDbNames: Seq[String] = dbNames.filterNot(dbName => ignoredDbNameSet.contains(dbName))
        deleteDbNames.foreach(dbName => {
          try {
            logger.info(s"RemoveEtlDataWorker::run:: orgId: ${orgId} - dbName: ${dbName}")
            schemaService.deleteDatabase(orgId, dbName).syncGet()
          } catch {
            case ex: Throwable => logger.error(s"RemovePreviewEtlDataWorker::run:: error: ${ex.getMessage}", ex)
          }
        })
      }
    )
    logger.info(s"RemovePreviewEtlDataWorker::run:: end")
  }

  private def listETLDatabases(fn: (Long, Seq[String]) => Unit): Unit = {
    var isRunning = true
    var offset = 0
    val batchSize = 20
    do {
      val page: Page[Organization] = orgClientService.getAllOrganizations(offset, batchSize).syncGet()
      offset += batchSize
      isRunning = offset < page.total
      page.data.foreach(organization => {
        try {
          val orgId: OrganizationId = organization.organizationId
          val dbInfoList: Seq[DatabaseShortInfo] = schemaService.getDatabases(orgId).syncGet()
          val dbNameList: Seq[String] = dbInfoList.map(dbInfo => dbInfo.name).filter(dbName => isETLDatabase(dbName))
          fn(orgId, dbNameList)
        } catch {
            case ex: Throwable => logger.error(s"RemovePreviewEtlDataWorker::listETLDatabases:: error: ${ex.getMessage}", ex)
        }
      })
    } while (isRunning)
  }

  private def isETLDatabase(dbName: String): Boolean = {
    StringUtils.test(dbName, PREVIEW_ETL_DATABASE_PATTERN)
  }
}
