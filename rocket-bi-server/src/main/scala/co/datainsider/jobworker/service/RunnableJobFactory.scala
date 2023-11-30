package co.datainsider.jobworker.service

import co.datainsider.bi.domain.{ClickhouseConnection, Connection}
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.job._
import co.datainsider.jobworker.domain.response.SyncInfo
import co.datainsider.jobworker.domain.source._
import co.datainsider.jobworker.exception.CreateWorkerException
import co.datainsider.jobworker.service.hubspot.HubspotWorker
import co.datainsider.jobworker.service.jobprogress.{DefaultProgressFactory, JobProgressFactory, JobProgressFactoryResolver}
import co.datainsider.jobworker.service.worker._
import co.datainsider.jobworker.service.worker2.{JobWorker2, JobWorkerProgress}
import co.datainsider.schema.client.SchemaClientService
import com.amazonaws.services.s3.AmazonS3
import com.google.inject.name.Named
import com.google.inject.name.Names.named
import com.twitter.inject.Injector
import com.twitter.util.logging.Logging
import com.twitter.util.{Future, Return}
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import education.x.commons.KVS

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * nhiem cua WorkerFactory la tao ra cac worker dua tren sync info
  */
trait RunnableJobFactory {
  @throws[CreateWorkerException]("throw when create worker failed")
  def create(syncInfo: SyncInfo, reportProgress: (JobProgress) => Future[Unit]): Runnable
}

class RunnableJobFactoryImpl @Inject() (
    schemaService: SchemaClientService,
    @Named("job_in_queue") jobInQueue: KVS[Long, Boolean],
    jobProgressResolver: JobProgressFactoryResolver,
    engineResolver: EngineResolver,
    injector: Injector
) extends RunnableJobFactory
    with Logging {
  private val fallbackProgressFactory = new DefaultProgressFactory()

  override def create(syncInfo: SyncInfo, reportProgress: (JobProgress) => Future[Unit]): Runnable = {
    jobInQueue.add(syncInfo.syncId, true).asTwitter.syncGet()
    val engine: Engine[Connection] =
      engineResolver.resolve(syncInfo.connection.getClass).asInstanceOf[Engine[Connection]]
    syncInfo.job match {
      case _: JdbcJob            => createJdbcWorker(syncInfo, reportProgress)
      case _: GenericJdbcJob     => createGenericJdbcWorker(syncInfo, reportProgress)
      case _: BigQueryStorageJob => createBigQueryStorageWorker(syncInfo, reportProgress)
      case _: HubspotJob         => createHubspotWorker(syncInfo, reportProgress)
      case _: GoogleSheetJob     => createGoogleSheetWorker(syncInfo, reportProgress)
      case _: MongoJob           => createMongoWorker(syncInfo, reportProgress)
      case _: SolanaJob          => createSolanaWorker(syncInfo, reportProgress)
      case _: CoinMarketCapJob   => createCoinMarketCapWorker(syncInfo, reportProgress)
      case _: AmazonS3Job        => createAmazonS3Worker(syncInfo, reportProgress)
      case _: ShopifyJob         => createShopifyWorker(syncInfo, reportProgress)
      case _: GoogleAdsJob       => createGoogleAdsWorker(syncInfo, reportProgress)
      case _                     => createWorkerV2(syncInfo, reportProgress)
    }
  }

  private def createJdbcWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.source.isDefined, "source must be defined")
    require(syncInfo.job.isInstanceOf[JdbcJob], "job must be JdbcJob")
    val jdbcJob: JdbcJob = syncInfo.job.asInstanceOf[JdbcJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)

      jdbcJob.syncMode match {
        case SyncMode.FullSync => {
          val worker = new FullSyncWorker(schemaService, syncInfo.source, jobInQueue, engine, syncInfo.connection)
          val finished: JobProgress = worker.run(jdbcJob, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        }
        case SyncMode.IncrementalSync => {
          val worker = new JdbcWorker(
            source = syncInfo.source.get.asInstanceOf[JdbcSource],
            schemaService = schemaService,
            jobInQueue = jobInQueue,
            engine = engine,
            connection = syncInfo.connection
          )
          val incrementalSyncWorker = new JdbcIncrementalSyncWorker(worker)
          val finished: JobProgress = incrementalSyncWorker.run(jdbcJob, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        }
      }
    }
  }

  private def createGenericJdbcWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.source.isDefined, "source must be defined")
    require(syncInfo.job.isInstanceOf[GenericJdbcJob], "job must be GenericJdbcJob")
    val genericJdbcJob: GenericJdbcJob = syncInfo.job.asInstanceOf[GenericJdbcJob]
    () => {
      try {
        val engine: Engine[Connection] = getEngine(syncInfo.connection)
        genericJdbcJob.syncMode match {
          case SyncMode.FullSync => {
            val worker = new FullSyncWorker(schemaService, syncInfo.source, jobInQueue, engine, syncInfo.connection)
            val finished: JobProgress = worker.run(genericJdbcJob, syncInfo.syncId, reportProgress)
            reportProgress(finished)
          }
          case SyncMode.IncrementalSync => {
            require(
              syncInfo.connection.isInstanceOf[ClickhouseConnection],
              "generic jdbc incremental sync only support clickhouse connection"
            )
            val worker = new GenericJdbcWorker(
              syncInfo.source.get.asInstanceOf[JdbcSource],
              schemaService,
              jobInQueue,
              connection = syncInfo.connection.asInstanceOf[ClickhouseConnection],
              engine = engine.asInstanceOf[Engine[ClickhouseConnection]]
            )
            val finished: JobProgress = worker.run(genericJdbcJob, syncInfo.syncId, reportProgress)
            reportProgress(finished)
          }
        }
      } catch {
        case ex: Throwable => {
          logger.error(s"Run generic jdbc worker error ${ex.getMessage}", ex)
          val progress = GenericJdbcProgress(
            syncInfo.job.orgId,
            syncInfo.syncId,
            syncInfo.job.jobId,
            System.currentTimeMillis(),
            JobStatus.Error,
            message = Some(ex.getMessage)
          )
          reportProgress(progress)
        }
      }
    }
  }

  private def createBigQueryStorageWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.job.isInstanceOf[BigQueryStorageJob], "job must be BigQueryStorageJob")
    val job: BigQueryStorageJob = syncInfo.job.asInstanceOf[BigQueryStorageJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      job.syncMode match {
        case SyncMode.FullSync =>
          val worker = new FullSyncWorker(
            schemaService = schemaService,
            dataSource = syncInfo.source,
            jobInQueue = jobInQueue,
            engine = engine,
            connection = syncInfo.connection
          )
          val finished: JobProgress = worker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        case SyncMode.IncrementalSync =>
          val worker = new BigQueryStorageWorker(
            source = syncInfo.source.get.asInstanceOf[GoogleServiceAccountSource],
            schemaService = schemaService,
            jobInQueue = jobInQueue,
            engine = engine,
            connection = syncInfo.connection
          )
          val rowRestrictions = if (job.lastSyncedValue.nonEmpty) {
            s"${job.incrementalColumn.get} > ${job.lastSyncedValue}"
          } else {
            ""
          }
          val finished: JobProgress =
            worker.run(job.copy(rowRestrictions = rowRestrictions), syncInfo.syncId, reportProgress)
          reportProgress(finished)
      }
    }
  }

  private def createHubspotWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.source.isDefined, "source must be defined")
    require(syncInfo.job.isInstanceOf[HubspotJob], "job must be HubspotJob")
    val job: HubspotJob = syncInfo.job.asInstanceOf[HubspotJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      reportProgress {
        HubspotWorker(
          syncInfo.source.get.asInstanceOf[HubspotSource],
          schemaService,
          engine = engine,
          connection = syncInfo.connection
        ).run(job, syncInfo.syncId, reportProgress)
      }
    }
  }

  private def createGoogleSheetWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.job.isInstanceOf[GoogleSheetJob], "job must be GoogleSheetJob")
    val job: GoogleSheetJob = syncInfo.job.asInstanceOf[GoogleSheetJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      val worker = new FullSyncWorker(
        schemaService = schemaService,
        dataSource = syncInfo.source,
        jobInQueue = jobInQueue,
        engine = engine,
        connection = syncInfo.connection
      )
      val finished: JobProgress = worker.run(job, syncInfo.syncId, reportProgress)
      reportProgress(finished)
    }
  }

  private def createMongoWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.source.isDefined, "source must be defined")
    require(syncInfo.job.isInstanceOf[MongoJob], "job must be MongoJob")
    val job: MongoJob = syncInfo.job.asInstanceOf[MongoJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      job.syncMode match {
        case SyncMode.FullSync =>
          val worker = new FullSyncWorker(
            schemaService = schemaService,
            dataSource = syncInfo.source,
            jobInQueue = jobInQueue,
            engine = engine,
            connection = syncInfo.connection
          )
          val finished: JobProgress = worker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        case SyncMode.IncrementalSync =>
          val worker =
            new MongoWorker(
              source = syncInfo.source.get.asInstanceOf[MongoSource],
              schemaService = schemaService,
              jobInQueue = jobInQueue,
              engine = engine,
              connection = syncInfo.connection
            )
          val finished = worker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
      }
    }
  }

  private def createSolanaWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.source.isDefined, "source must be defined")
    require(syncInfo.job.isInstanceOf[SolanaJob], "job must be SolanaJob")
    val job: SolanaJob = syncInfo.job.asInstanceOf[SolanaJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      job.syncMode match {
        case SyncMode.IncrementalSync => {
          val maxQueueSize = ZConfig.getInt("solana.max_queue_size", 1000)
          val solanaWorker =
            new SolanaWorker(
              source = syncInfo.source.get.asInstanceOf[SolanaSource],
              schemaService = schemaService,
              jobInQueue = jobInQueue,
              maxBufferSize = maxQueueSize,
              engine = engine,
              connection = syncInfo.connection
            )
          val finalProgress: JobProgress = solanaWorker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finalProgress)
        }
        case SyncMode.FullSync => {
          reportProgress(
            SolanaProgress(
              orgId = job.orgId,
              syncId = syncInfo.syncId,
              jobId = job.jobId,
              updatedTime = System.currentTimeMillis(),
              jobStatus = JobStatus.Error,
              totalSyncRecord = 0L,
              totalExecutionTime = 0L,
              lastSyncedValue = "",
              message = Some("Unsupported full sync in solana job")
            )
          )
        }
      }
    }
  }

  private def createCoinMarketCapWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.job.isInstanceOf[CoinMarketCapJob], "job must be CoinMarketCapJob")
    val job: CoinMarketCapJob = syncInfo.job.asInstanceOf[CoinMarketCapJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      job.syncMode match {
        case SyncMode.FullSync => {
          val fullSyncWorker =
            new FullSyncWorker(
              schemaService = schemaService,
              dataSource = syncInfo.source,
              jobInQueue = jobInQueue,
              engine = engine,
              connection = syncInfo.connection
            )
          val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        }
        case SyncMode.IncrementalSync => {
          reportProgress(
            CoinMarketCapProgress(
              orgId = job.orgId,
              syncId = syncInfo.syncId,
              jobId = job.jobId,
              updatedTime = System.currentTimeMillis(),
              jobStatus = JobStatus.Error,
              totalSyncRecord = 0L,
              totalExecutionTime = 0L,
              message = Some("CoinMarketCap unsupported incremental sync")
            )
          )
        }
      }
    }
  }

  private def createAmazonS3Worker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.job.isInstanceOf[AmazonS3Job], "job must be AmazonS3Job")
    val job: AmazonS3Job = syncInfo.job.asInstanceOf[AmazonS3Job]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      job.syncMode match {
        case SyncMode.FullSync =>
          val fullSyncWorker =
            new FullSyncWorker(
              schemaService = schemaService,
              dataSource = syncInfo.source,
              jobInQueue = jobInQueue,
              engine = engine,
              connection = syncInfo.connection
            )
          val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        case SyncMode.IncrementalSync =>
          val batchSize: Int = ZConfig.getInt("amazon_s3_worker.sync_batch_size", default = 1000)
          val connectionTimeout: Int = ZConfig.getInt("amazon_s3_worker.connection_timeout", default = 600000)
          val timeToLive: Long = ZConfig.getLong("amazon_s3_worker.time_to_live", default = 24 * 3600 * 1000)
          val amazonS3Source = syncInfo.source.get.asInstanceOf[AmazonS3Source]
          val s3Client: AmazonS3 = AmazonS3Client(amazonS3Source, connectionTimeout, timeToLive)
          val worker = new AmazonS3WorkerV2(
            source = amazonS3Source,
            schemaService = schemaService,
            jobInQueue = jobInQueue,
            s3Client = s3Client,
            batchSize = batchSize,
            engine = engine,
            connection = syncInfo.connection
          )
          val finished = worker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
      }
    }
  }

  private def createShopifyWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.job.isInstanceOf[ShopifyJob], "job must be ShopifyJob")
    val job: ShopifyJob = syncInfo.job.asInstanceOf[ShopifyJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      job.syncMode match {
        case SyncMode.FullSync =>
          val worker =
            new FullSyncWorker(
              schemaService = schemaService,
              dataSource = syncInfo.source,
              jobInQueue = jobInQueue,
              engine = engine,
              connection = syncInfo.connection
            )
          val finished: JobProgress = worker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        case SyncMode.IncrementalSync => {
          val retryTimeoutMs = ZConfig.getInt("shopify.retry_time_out_ms", 30000)
          val minRetryTimeDelayMs = ZConfig.getInt("shopify.min_retry_time_delay_ms", 500)
          val maxRetryTimeDelayMs = ZConfig.getInt("shopify.max_retry_time_delay_ms", 1000)
          val worker = new ShopifyWorker(
            source = syncInfo.source.get.asInstanceOf[ShopifySource],
            schemaService = schemaService,
            kvs = jobInQueue,
            retryTimeoutMs = retryTimeoutMs,
            minRetryTimeDelayMs = minRetryTimeDelayMs,
            maxRetryTimeDelayMs = maxRetryTimeDelayMs,
            engine = engine,
            connection = syncInfo.connection
          )
          val finished: JobProgress = worker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        }
      }
    }
  }

  private def createGoogleAdsWorker(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    require(syncInfo.job.isInstanceOf[GoogleAdsJob], "job must be GoogleAdsJob")
    val googleAdsJob: GoogleAdsJob = syncInfo.job.asInstanceOf[GoogleAdsJob]
    () => {
      val engine: Engine[Connection] = getEngine(syncInfo.connection)
      googleAdsJob.syncMode match {
        case SyncMode.FullSync =>
          val fullSyncWorker = new FullSyncWorker(
            schemaService = schemaService,
            dataSource = syncInfo.source,
            jobInQueue = jobInQueue,
            engine = engine,
            connection = syncInfo.connection
          )
          val finished: JobProgress = fullSyncWorker.run(googleAdsJob, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        case SyncMode.IncrementalSync =>
          val batchSize: Int = ZConfig.getInt("google_ads_api.batch_size", default = 1000)
          val googleAdsSource = syncInfo.source.get.asInstanceOf[GoogleAdsSource]
          val incrementalSyncWorker = new GoogleAdsWorker(
            googleAdsSource = googleAdsSource,
            schemaService = schemaService,
            jobInQueue = jobInQueue,
            batchSize = batchSize,
            engine = engine,
            connection = syncInfo.connection
          )
          val finished = incrementalSyncWorker.run(googleAdsJob, syncInfo.syncId, reportProgress)
          reportProgress(finished)
      }
    }
  }

  private def createWorkerV2(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = { () =>
    {
      try {
        val worker: JobWorker2 = syncInfo.job.syncMode match {
          case SyncMode.IncrementalSync => injector.instance[JobWorker2]
          case SyncMode.FullSync        => injector.instance[JobWorker2](named("FullSyncJobWorker"))
          case _                        => throw new IllegalArgumentException(s"Unsupported sync mode ${syncInfo.job.syncMode}")
        }
        val finalProgress: JobWorkerProgress = worker.run(
          syncInfo,
          () => ensureRunning(syncInfo.syncId),
          (jobProgress) => reportProgress(toJobProgress(syncInfo, jobProgress))
        )
        reportProgress(toJobProgress(syncInfo, finalProgress)).syncGet()
      } catch {
        case ex: Throwable => {
          logger.error(s"Error when run worker for sync ${syncInfo.syncId}", ex)
        }
      } finally {
        try {
          jobInQueue.remove(syncInfo.syncId).asTwitter.syncGet()
        } catch {
          case ex: Throwable => {
            logger.error(s"Error when remove sync ${syncInfo.syncId} from kvs", ex)
          }
        }
      }
    }
  }

  /**
    * adapter from JobWorkerProgress to JobProgress
    */
  private def toJobProgress(syncInfo: SyncInfo, progress: JobWorkerProgress): JobProgress = {
    val factory: JobProgressFactory[Job] = jobProgressResolver.resolve(syncInfo.job).getOrElse(fallbackProgressFactory)
    val jobProgress: JobProgress = factory.create(syncInfo.syncId, syncInfo.job, progress)
    jobProgress
  }

  @throws[InterruptedException]("when sync is canceled")
  private def ensureRunning(syncId: Long): Future[Unit] = {
    jobInQueue.get(syncId).asTwitter.transform {
      case Return(Some(true))  => Future.Done
      case Return(None)        => Future.exception(new InterruptedException(s"Sync $syncId is canceled"))
      case Return(Some(false)) => Future.exception(new InterruptedException(s"Sync $syncId is canceled"))
    }
  }

  private def getEngine(connection: Connection): Engine[Connection] = {
    engineResolver.resolve(connection.getClass).asInstanceOf[Engine[Connection]]
  }
}

class MockRunnableJobFactory() extends RunnableJobFactory with Logging {
  override def create(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    new Runnable {
      override def run(): Unit = {
        logger.info("Mock worker")
      }
    }
  }
}
