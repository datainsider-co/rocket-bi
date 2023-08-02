package co.datainsider.jobworker.service.worker

import co.datainsider.bi.domain.{ClickhouseConnection, Connection}
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.job._
import co.datainsider.jobworker.domain.source._
import co.datainsider.jobworker.util.GoogleOAuthConfig
import co.datainsider.schema.client.SchemaClientService
import com.amazonaws.services.s3.AmazonS3
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import education.x.commons.KVS

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
    jobInQueue: KVS[Long, Boolean],
    engine: Engine[Connection],
    connection: Connection
) extends WorkerDecorator[Job]
    with Logging {

  def run(job: Job, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {

    val _destDbName = job.destDatabaseName
    val _tblName = job.destTableName

    val tempTableName = s"__di_tmp_${_tblName}_${System.currentTimeMillis}"
    val oldTableName = s"__di_old_${_tblName}_${System.currentTimeMillis}"

    val finalJobProgress = job match {
      case jdbcJob: JdbcJob => {
        val worker = new JdbcWorker(
          source = dataSource.get.asInstanceOf[JdbcSource],
          schemaService = schemaService,
          jobInQueue = jobInQueue,
          engine = engine,
          connection = connection
        )
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
          source = dataSource.get.asInstanceOf[MongoSource],
          schemaService = schemaService,
          jobInQueue = jobInQueue,
          engine = engine,
          connection = connection
        )
        worker.run(mongoJob.copy(destTableName = tempTableName), syncId, onProgress)
      }
      case genericJdbcJob: GenericJdbcJob => createGenericJdbcWorker(genericJdbcJob, tempTableName, syncId, onProgress)
      case bigqueryStorageJob: BigQueryStorageJob => {
        val worker = new BigQueryStorageWorker(
          source = dataSource.get.asInstanceOf[GoogleServiceAccountSource],
          schemaService = schemaService,
          jobInQueue = jobInQueue,
          engine = engine,
          connection = connection
        )
        worker.run(bigqueryStorageJob.copy(destTableName = tempTableName, incrementalColumn = None), syncId, onProgress)
      }
      case job: CoinMarketCapJob => {
        val worker = new CoinMarketCapWorker(
          schemaService = schemaService,
          jobInQueue = jobInQueue,
          engine = engine,
          connection = connection
        )
        worker.run(job.copy(destTableName = tempTableName), syncId, onProgress)
      }
      case googleSheetJob: GoogleSheetJob => {
        val googleOAuthConfig = GoogleOAuthConfig(
          clientId = ZConfig.getString("google.gg_client_id"),
          clientSecret = ZConfig.getString("google.gg_client_secret"),
          redirectUri = ZConfig.getString("google.redirect_uri"),
          serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
        )
        val worker = new GoogleSheetWorker(
          schemaService = schemaService,
          jobInQueue = jobInQueue,
          googleOAuthConfig = googleOAuthConfig,
          engine = engine,
          connection = connection
        )
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
          jobInQueue = jobInQueue,
          s3Client = s3Client,
          batchSize = batchSize,
          engine = engine,
          connection = connection
        )
        worker.run(job.copy(destTableName = tempTableName, incrementalTime = 0L), syncId, onProgress)
      case job: ShopifyJob => {
        val retryTimeoutMs = ZConfig.getInt("shopify.retry_time_out_ms", 30000)
        val minRetryTimeDelayMs = ZConfig.getInt("shopify.min_retry_time_delay_ms", 500)
        val maxRetryTimeDelayMs = ZConfig.getInt("shopify.max_retry_time_delay_ms", 1000)
        val worker = new ShopifyWorker(
          dataSource.get.asInstanceOf[ShopifySource],
          schemaService,
          jobInQueue,
          retryTimeoutMs,
          minRetryTimeDelayMs,
          maxRetryTimeDelayMs,
          engine = engine,
          connection = connection
        )
        worker.run(job.copy(destTableName = tempTableName), syncId, onProgress)
      }
      case googleAdsJob: GoogleAdsJob =>
        val googleAdsSource = dataSource.get.asInstanceOf[GoogleAdsSource]
        val batchSize: Int = ZConfig.getInt("google_ads_api.batch_size", default = 1000)
        val worker = new GoogleAdsWorker(
            googleAdsSource,
            schemaService = schemaService,
            jobInQueue = jobInQueue,
            batchSize = batchSize,
            engine = engine,
            connection = connection
          )
        worker.run(googleAdsJob.copy(destTableName = tempTableName), syncId, onProgress)
    }

    if (finalJobProgress.jobStatus == JobStatus.Synced || finalJobProgress.jobStatus == JobStatus.Terminated) {
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

    } else if (finalJobProgress.jobStatus == JobStatus.Error) {
      // delete temporary table if error occurred
      schemaService.deleteTableSchema(job.orgId, _destDbName, tempTableName).syncGet()
    }

    finalJobProgress
  }

  def createGenericJdbcWorker(
      genericJdbcJob: GenericJdbcJob,
      tempTableName: String,
      syncId: SyncId,
      onProgress: JobProgress => Future[Unit]
  ): JobProgress = {
    if (connection.isInstanceOf[ClickhouseConnection]) {
      val worker = new GenericJdbcWorker(
        dataSource.get.asInstanceOf[JdbcSource],
        schemaService,
        jobInQueue,
        connection = connection.asInstanceOf[ClickhouseConnection],
        engine = engine.asInstanceOf[Engine[ClickhouseConnection]]
      )
      worker.run(
        genericJdbcJob.copy(
          destTableName = tempTableName,
          incrementalColumn = None
        ),
        syncId,
        onProgress
      )
    } else {
      GenericJdbcProgress(
        orgId = genericJdbcJob.orgId,
        jobId = genericJdbcJob.jobId,
        syncId = syncId,
        jobStatus = JobStatus.Error,
        message = Some(s"unsupported connection type ${connection.getClass.getSimpleName}")
      )
    }

  }

}

/**
  * sync data by continuously pull new data to current destination table
  * - get newest data from destination table
  * - execute sync
  */
class JdbcIncrementalSyncWorker(val worker: JdbcWorker) extends WorkerDecorator[JdbcJob] {
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
    // fixme: check again
    val query = s"select max($incrementalCol) from $dbName.$tblName"
    try {
//      val upperBound: String = client.executeQuery(query)(rs => if (rs.next()) rs.getString(1) else null)
//      Option(upperBound)
      ???
    } catch {
      case _: Throwable => None
    }
  }
}
