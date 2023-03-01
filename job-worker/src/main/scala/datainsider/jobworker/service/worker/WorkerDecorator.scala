package datainsider.jobworker.service.worker

import com.amazonaws.services.s3.AmazonS3
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.service.{HadoopFileClientService, LakeClientService, SchemaClientService}
import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain._
import datainsider.jobworker.domain.job.GaJob
import datainsider.jobworker.util.ZConfig
import education.x.commons.SsdbKVS

/**
  * enhance behavior of worker:
  * add additional logic before performing worker's task
  * add additional logic after worker's tasks finished
  */
abstract class WorkerDecorator[T <: Job] extends JobWorker[T] {
  def run(job: T, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress
}

/**
  * sync data using Copy on Write like strategy:
  * - prepare a new table schema to be be synced
  * - adjust parameter so that table will be synced from begin
  * - execute sync
  * - swap name of new table schema with current job destination schema
  * - version old table schema
  */
class FullSyncWorker(
    schemaService: SchemaClientService,
    dataSource: Option[DataSource],
    lakeService: LakeClientService,
    ssdbKVS: SsdbKVS[Long, Boolean],
    hadoopFileClientService: HadoopFileClientService
) extends WorkerDecorator[Job]
    with Logging {

  def run(job: Job, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {

    val _destDbName = job.destDatabaseName
    val _tblName = job.destTableName

    val tempTableName = s"__di_tmp_${_tblName}_${System.currentTimeMillis}"
    val oldTableName = s"__di_old_${_tblName}_${System.currentTimeMillis}"

    val jobProgress = job match {
      case jdbcJob: JdbcJob => {
        val worker = new JdbcWorker(dataSource.get.asInstanceOf[JdbcSource], schemaService, ssdbKVS)
        worker.run(
          jdbcJob.copy(
            lastSyncedValue = "0", // sync from beginning // TODO: add start value to job, jobowner, createddate...
            destTableName = tempTableName,
            incrementalColumn = None
          ),
          syncId,
          onProgress
        )
      }
      case mongoJob: MongoJob => {
        val worker = new MongoWorker(
          dataSource.get.asInstanceOf[MongoSource],
          schemaService,
          ssdbKVS
        )
        worker.run(mongoJob.copy(destTableName = tempTableName), syncId, onProgress)
      }
      case genericJdbcJob: GenericJdbcJob => {
        val worker = new GenericJdbcWorker(dataSource.get.asInstanceOf[JdbcSource], schemaService, ssdbKVS)
        worker.run(
          genericJdbcJob.copy(
            destTableName = tempTableName,
            incrementalColumn = None
          ),
          syncId,
          onProgress
        )
      }
      case bigqueryStorageJob: BigQueryStorageJob => {
        val worker = new BigQueryStorageWorker(
          dataSource.get.asInstanceOf[GoogleServiceAccountSource],
          schemaService,
          ssdbKVS
        )
        worker.run(bigqueryStorageJob.copy(destTableName = tempTableName, incrementalColumn = None), syncId, onProgress)
      }
      case job: CoinMarketCapJob => {
        val worker = new CoinMarketCapWorker(
          schemaService,
          ssdbKVS
        )
        worker.run(job.copy(destTableName = tempTableName), syncId, onProgress)
      }
      case googleSheetJob: GoogleSheetJob => {
        val worker = new GoogleSheetWorker(schemaService, ssdbKVS)
        worker.run(googleSheetJob.copy(destTableName = tempTableName), syncId, onProgress)
      }
      case job: AmazonS3Job =>
        val batchSize: Int = ZConfig.getInt("amazon_s3_worker.sync_batch_size", default = 1000)
        val connectionTimeout: Int = ZConfig.getInt("amazon_s3_worker.connection_timeout", default = 600000)
        val timeToLive: Long = ZConfig.getLong("amazon_s3_worker.time_to_live", default = 24 * 3600 * 1000)
        val amazonS3Source = dataSource.get.asInstanceOf[AmazonS3Source]
        val s3Client: AmazonS3 = AmazonS3Client(amazonS3Source, connectionTimeout, timeToLive)
        val worker = new AmazonS3WorkerV2(
          source = amazonS3Source,
          schemaService = schemaService,
          ssdbKVS = ssdbKVS,
          s3Client = s3Client,
          batchSize = batchSize
        )
        worker.run(job.copy(destTableName = tempTableName, incrementalTime = 0L), syncId, onProgress)
      case job: ShopifyJob => {
        val retryTimeoutMs = ZConfig.getInt("shopify.retry_time_out_ms", 30000)
        val minRetryTimeDelayMs = ZConfig.getInt("shopify.min_retry_time_delay_ms", 500)
        val maxRetryTimeDelayMs = ZConfig.getInt("shopify.max_retry_time_delay_ms", 1000)
        val worker = new ShopifyWorker(
          dataSource.get.asInstanceOf[ShopifySource],
          schemaService,
          ssdbKVS,
          retryTimeoutMs,
          minRetryTimeDelayMs,
          maxRetryTimeDelayMs
        )
        worker.run(job.copy(destTableName = tempTableName), syncId, onProgress)
      }
      case googleAdsJob: GoogleAdsJob =>
        val googleAdsSource = dataSource.get.asInstanceOf[GoogleAdsSource]
        val batchSize: Int = ZConfig.getInt("google_ads_api.batch_size", default = 1000)
        val worker =
          new GoogleAdsWorker(googleAdsSource, schemaService = schemaService, ssdbKVS = ssdbKVS, batchSize = batchSize)
        worker.run(googleAdsJob.copy(destTableName = tempTableName), syncId, onProgress)
      case job: GaJob => {
        val connTimeoutMs = ZConfig.getInt("google.connection_timeout_ms", 300000)
        val readTimeoutMs = ZConfig.getInt("google.read_timeout_ms", 300000)
        val worker = GaWorker(schemaService, ssdbKVS, connTimeoutMs, readTimeoutMs)
        worker.run(job.copy(destTableName = tempTableName), syncId, onProgress)
      }
    }

    if (jobProgress.jobStatus == JobStatus.Synced || jobProgress.jobStatus == JobStatus.Terminated) {
      // swap names of newly synced table
      job.destinations.foreach {
        case DataDestination.Clickhouse =>
          try {
            if (schemaService.isTblExists(job.orgId, _destDbName, _tblName, Seq.empty).syncGet()) {
              schemaService.renameTableSchema(job.orgId, _destDbName, _tblName, oldTableName).syncGet()
            }

            schemaService.renameTableSchema(job.orgId, _destDbName, tempTableName, _tblName).syncGet()

            info(s"rename table for full sync job $job successfully")

          } catch {
            case e: Throwable =>
              error(s"fail to rename clickhouse table for full-sync job $job, reason: $e")
          }

        case DataDestination.Hadoop =>
          val fsPath: String = ZConfig.getString("hadoop-writer.hdfs.file_system")
          val baseDir: String = ZConfig.getString("hadoop-writer.base_dir")
          try {
            hadoopFileClientService.moveTrash(fsPath + s"$baseDir/${_destDbName}/${_tblName}").syncGet()
          } catch {
            case e: Throwable =>
              error(s"fail to move old hadoop folder for full-sync job $job, reason: $e")
          }
          try {
            hadoopFileClientService.createFolder(fsPath + s"$baseDir", _destDbName).syncGet()
            hadoopFileClientService.createFolder(fsPath + s"$baseDir/${_destDbName}/", _tblName).syncGet()
            hadoopFileClientService
              .move(
                fsPath + "/tmp" + s"$baseDir/${_destDbName}/$tempTableName",
                fsPath + s"/$baseDir/${_destDbName}",
                overwrite = true,
                _tblName
              )
              .syncGet()
          } catch {
            case e: Throwable => error(s"fail to move temp folder to synced folder, reason: $e")
          }
      }

    } else if (jobProgress.jobStatus == JobStatus.Error) {
      // delete temporary table if error occurred
      job.destinations.foreach {
        case DataDestination.Clickhouse =>
          schemaService.deleteTableSchema(job.orgId, _destDbName, tempTableName).syncGet()
        case DataDestination.Hadoop =>
      }
    }

    jobProgress
  }

}

/**
  * sync data by continuously pull new data to current destination table
  * - get newest data from destination table
  * - execute sync
  */
class JdbcIncrementalSyncWorker(source: JdbcSource, val worker: JdbcWorker) extends WorkerDecorator[JdbcJob] {
  def run(job: JdbcJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val lastSyncedValue: String = {
      getLastSyncedValue(job.destDatabaseName, job.destTableName, job.incrementalColumn.get) match {
        case Some(value) => value
        case None        => job.lastSyncedValue
      }
    }
    worker.run(job.copy(lastSyncedValue = lastSyncedValue), syncId, onProgress)
  }

  def getLastSyncedValue(dbName: String, tblName: String, incrementalCol: String): Option[String] = {
    val client: JdbcClient = NativeJdbcClient(source.jdbcUrl, source.username, source.password)
    val query = s"select max($incrementalCol) from $dbName.$tblName"
    try {
      val upperBound: String = client.executeQuery(query)(rs => if (rs.next()) rs.getString(1) else null)
      Option(upperBound)
    } catch {
      case _: Throwable => None
    }
  }
}
