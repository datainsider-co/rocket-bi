package datainsider.jobworker.service

import com.google.inject.name.Names.named
import com.twitter.inject.Injector
import com.twitter.util.logging.Logging
import com.twitter.util.{Future, Return}
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import datainsider.client.service.{HadoopFileClientService, LakeClientService, SchemaClientService}
import datainsider.jobworker.domain.job.{FacebookAdsJob, Ga4Job, TikTokAdsJob}
import datainsider.jobworker.domain.response.SyncInfo
import datainsider.jobworker.domain._
import datainsider.jobworker.exception.CreateWorkerException
import datainsider.jobworker.service.worker.JobWorker
import datainsider.jobworker.service.worker2.{JobWorker2, JobWorkerProgress}
import education.x.commons.SsdbKVS

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * nhiem cua WorkerFactory la tao ra cac worker dua tren sync info
  */
trait RunnableJobFactory {
  @throws[CreateWorkerException]("neu khong the tao worker")
  def create(syncInfo: SyncInfo, reportProgress: (JobProgress) => Future[Unit]): Runnable
}

class RunnableJobFactoryImpl @Inject() (
    schemaService: SchemaClientService,
    lakeService: LakeClientService,
    destinationSource: JdbcSource,
    kvs: SsdbKVS[Long, Boolean],
    hadoopFileClientService: HadoopFileClientService,
    injector: Injector
) extends RunnableJobFactory
    with Logging {

  override def create(syncInfo: SyncInfo, reportProgress: (JobProgress) => Future[Unit]): Runnable = {
    kvs.add(syncInfo.syncId, true).asTwitter.syncGet()
    try {
      val runnable: Runnable = createRunnableJobV1(syncInfo, reportProgress)
      runnable
    } catch {
      case _: UnsupportedOperationException => {
        logger.info(s"Unsupported legacy for job type ${syncInfo.job}, using worker v2")
        val runnable: Runnable = createRunnableJobV2(syncInfo, reportProgress)
        runnable
      }
    }
  }

  private def createRunnableJobV1(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = {
    val worker: Runnable = JobWorker(
      syncInfo,
      destinationSource,
      reportProgress,
      schemaService,
      lakeService,
      kvs,
      hadoopFileClientService
    )
    worker
  }

  private def createRunnableJobV2(syncInfo: SyncInfo, reportProgress: JobProgress => Future[Unit]): Runnable = { () =>
    {
      try {
        val worker: JobWorker2 = syncInfo.job.syncMode match {
          case SyncMode.IncrementalSync => injector.instance[JobWorker2]
          case SyncMode.FullSync        => injector.instance[JobWorker2](named("FullSyncJobWorker"))
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
          kvs.remove(syncInfo.syncId).asTwitter.syncGet()
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
  private def toJobProgress(syncInfo: SyncInfo, jobProgress: JobWorkerProgress): JobProgress = {
    syncInfo.job match {
      case _: Ga4Job =>
        GA4Progress(
          orgId = syncInfo.job.orgId,
          syncId = syncInfo.syncId,
          jobId = syncInfo.job.jobId,
          updatedTime = System.currentTimeMillis(),
          jobStatus = jobProgress.status,
          totalSyncRecord = jobProgress.totalSyncedRows.get(),
          totalExecutionTime = System.currentTimeMillis() - jobProgress.startTime,
          lastSyncedValue = jobProgress.lastSyncedValue,
          message = Some(jobProgress.messages.mkString("\n"))
        )
      case _: FacebookAdsJob =>
        FacebookAdsProcess(
          orgId = syncInfo.job.orgId,
          syncId = syncInfo.syncId,
          jobId = syncInfo.job.jobId,
          updatedTime = System.currentTimeMillis(),
          jobStatus = jobProgress.status,
          totalSyncRecord = jobProgress.totalSyncedRows.get(),
          totalExecutionTime = System.currentTimeMillis() - jobProgress.startTime,
          message = Some(jobProgress.messages.mkString("\n"))
        )
      case _: TikTokAdsJob =>
        TikTokAdsProgress(
          orgId = syncInfo.job.orgId,
          syncId = syncInfo.syncId,
          jobId = syncInfo.job.jobId,
          updatedTime = System.currentTimeMillis(),
          jobStatus = jobProgress.status,
          totalSyncRecord = jobProgress.totalSyncedRows.get(),
          totalExecutionTime = System.currentTimeMillis() - jobProgress.startTime,
          message = Some(jobProgress.messages.mkString("\n"))
        )
    }

  }

  @throws[InterruptedException]("neu sync bi cancel")
  private def ensureRunning(syncId: Long): Future[Unit] = {
    kvs.get(syncId).asTwitter.transform {
      case Return(Some(true))  => Future.Done
      case Return(None)        => Future.exception(new InterruptedException(s"Sync $syncId is canceled"))
      case Return(Some(false)) => Future.exception(new InterruptedException(s"Sync $syncId is canceled"))
    }
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
