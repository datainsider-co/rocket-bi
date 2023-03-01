package datainsider.data_cook.service.worker

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.{JdbcClient, ZConfig}
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.data_cook.service.PreviewEtlJobService
import datainsider.data_cook.service.table.EtlTableService.getDbName
import datainsider.ingestion.domain.Types.DBName
import datainsider.ingestion.service.SchemaService
import datainsider.ingestion.util.ClickHouseUtils
import datainsider.ingestion.util.ClickHouseUtils.PREVIEW_ETL_DATABASE_PATTERN

import javax.inject.{Inject, Named, Singleton}
import scala.collection.mutable.ArrayBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 11/20/2021 - 2:12 PM
  */
@Singleton
class RemovePreviewEtlDataWorker @Inject() (
    @Named("etl_schema_service") schemaService: SchemaService,
    previewEtlJobService: PreviewEtlJobService,
    @Named("clickhouse") clickhouse: JdbcClient
) extends Runnable with Logging {
  private val previewPrefixDbName = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")

  protected def getDatabasesInPreview(): Future[Array[DBName]] = {
    for {
      previewData <- previewEtlJobService.listEtlInPreview()
    } yield {
      previewData.map(item => getDbName(item.organizationId, item.etlJobId, previewPrefixDbName))
    }
  }

  override def run(): Unit = {
    info(s"RemovePreviewEtlDataWorker::run:: start")
    val setDbInPreview: Set[String] = getDatabasesInPreview().syncGet().toSet
    listAllPreviewEtlDatabases(1000, (dbNames: Array[String]) => {
      val dbNamesNeedRemove = dbNames.filterNot(dbName => setDbInPreview.contains(dbName))
      dbNamesNeedRemove.foreach(dbName => {
        val orgId: OrganizationId = ClickHouseUtils.getPreviewEtlOrgId(dbName)
        info(s"RemovePreviewEtlDataWorker::run:: orgId: ${orgId} - dbName: ${dbName}")
        schemaService.deleteDatabase(orgId, dbName).syncGet()
      })
    })
    info(s"RemovePreviewEtlDataWorker::run:: end")
  }

  def listAllPreviewEtlDatabases(batchSize: Int, fn: (Array[String]) => Unit): Unit = {
    val query = s"select name from system.databases where match(name, ?)"
    clickhouse.executeQuery(query, PREVIEW_ETL_DATABASE_PATTERN)(rs => {
      val dbNames = ArrayBuffer.empty[String]
      while(rs.next()) {
        val dbName = rs.getString(1)
        dbNames.append(dbName)
        if (dbNames.size >= batchSize) {
          fn(dbNames.toArray)
          dbNames.clear()
        }
      }
      if (dbNames.nonEmpty) {
        fn(dbNames.toArray)
      }
    })
  }
}
