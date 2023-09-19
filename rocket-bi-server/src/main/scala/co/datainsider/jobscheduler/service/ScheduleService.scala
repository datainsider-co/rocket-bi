package co.datainsider.jobscheduler.service

import co.datainsider.bi.service.ConnectionService
import co.datainsider.jobscheduler.domain.Ids.{JobId, OrgId}
import co.datainsider.jobscheduler.domain.job._
import co.datainsider.jobscheduler.domain.response.SyncInfo
import co.datainsider.jobscheduler.domain.{JobHistory, JobProgress}
import co.datainsider.jobscheduler.repository.{DataSourceRepository, JobHistoryRepository, JobRepository}
import co.datainsider.jobscheduler.util.Implicits.{FutureEnhance, RichScalaFuture}
import co.datainsider.bi.util.ZConfig
import com.twitter.concurrent.AsyncMutex
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.exception.BadRequestError
import datainsider.client.util.TimeUtils
import education.x.commons.SsdbKVS

import java.time.Duration
import java.util.concurrent.{BlockingQueue, LinkedBlockingQueue}
import javax.inject.Inject
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global
import scala.jdk.CollectionConverters.asScalaIteratorConverter

/** *
  * Schedule Job, provide available Job for worker
  * Job are divided into 2 types:
  * - Full sync job: sync from start to most up-to-date data
  * - Incremental job: sync from a defined value till most up-to-date value, save last sync value for next sync
  */
trait ScheduleService {

  def getNextJob: Future[Option[SyncInfo]]

  def handleJobReport(jobProgress: JobProgress): Future[Boolean]

  def getJobProgresses: Future[mutable.Map[JobId, JobProgress]]

  def forceSync(orgId: Long, jobId: JobId, atTime: Long): Future[Boolean]

  def multiForceSync(orgId: Long, jobIds: Seq[JobId], atTime: Long): Future[Map[Long, Boolean]]

  def start(): Unit

  def status(): Future[Seq[SyncInfo]]

  def kill(orgId: Long, jobId: JobId): Future[Boolean]
}

class SimpleScheduleService @Inject() (
    jobRepository: JobRepository,
    sourceRepository: DataSourceRepository,
    historyRepository: JobHistoryRepository,
    ssdbKVS: SsdbKVS[Long, Boolean],
    connectionService: ConnectionService
) extends ScheduleService
    with Logging {

  val pollingIntervalMs: Int = ZConfig.getInt("jobworker.sleep_interval_ms", 1000)
  val maxQueueSize: Int = ZConfig.getInt("jobworker.job_queue_size", 8)

  private val jobMutex = new AsyncMutex()
  private val jobQueue: BlockingQueue[SyncInfo] = new LinkedBlockingQueue[SyncInfo](maxQueueSize)
  private val destTableLocks = mutable.Set.empty[(String, String)]

  override def getNextJob: Future[Option[SyncInfo]] = {
    jobMutex.acquireAndRun {
      if (jobQueue.size() > 0) {
        val syncInfo = jobQueue.take()
        Future.value(Some(syncInfo))
      } else Future.None
    }
  }

  private def buildNextSyncInfo(job: Job): Future[Option[SyncInfo]] = {
    for {
      source <- sourceRepository.get(job.orgId, job.sourceId)
      syncId <- historyRepository.insert(
        job.orgId,
        JobHistory(
          jobId = job.jobId,
          jobName = job.displayName,
          lastSyncTime = 0,
          totalSyncedTime = 0,
          syncStatus = JobStatus.Queued,
          totalRowsInserted = 0
        )
      )
      connection <- connectionService.getTunnelConnection(job.orgId)
      _ <- jobRepository.update(job.orgId, job.customCopy(currentSyncStatus = JobStatus.Queued))
    } yield Some(SyncInfo(syncId, job, source, connection))
  }

  /**
    * update job and history when receive report from worker
    * @param progress current job progress
    * @return
    */
  override def handleJobReport(progress: JobProgress): Future[Boolean] = {
    for {
      updatedJob <- updateJobStatus(progress)
      updatedHistory <- updateHistory(progress)
    } yield updatedJob && updatedHistory
  }

  private def updateJobStatus(progress: JobProgress): Future[Boolean] = {
    for {
      jobOpt <- jobRepository.get(progress.orgId, progress.jobId)
      updated <- jobRepository.update(progress.orgId, toUpdatedJob(jobOpt.get, progress))
    } yield updated
  }

  private def toUpdatedJob(job: Job, progress: JobProgress): Job = {
    updateJobProgresses(job, progress)

    if (progress.jobStatus != JobStatus.Syncing) {
      val nextRunTime: Long = TimeUtils.calculateNextRunTime(
        scheduleTime = job.scheduleTime,
        lastScheduleTime = Some(System.currentTimeMillis())
      )
      job.copyJobStatus(progress).copyRunTime(nextRunTime)
    } else {
      job.copyJobStatus(progress)
    }
  }

  private def updateHistory(progress: JobProgress): Future[Boolean] = {
    historyRepository.get(progress.syncId).flatMap {
      case Some(history) =>
        historyRepository.update(
          history.copy(
            lastSyncTime = progress.updatedTime,
            totalSyncedTime = progress.totalExecutionTime,
            syncStatus = progress.jobStatus,
            totalRowsInserted = progress.totalSyncRecord,
            message = progress.message.getOrElse("")
          )
        )
      case None => Future.True
    }
  }

  val currentJobProgresses = mutable.Map.empty[JobId, JobProgress] // in mem tracker, for debug purpose

  override def getJobProgresses: Future[mutable.Map[JobId, JobProgress]] = {
    Future(currentJobProgresses)
  }

  private def updateJobProgresses(job: Job, progress: JobProgress): Unit = {
    currentJobProgresses.put(job.jobId, progress)

    if (progress.jobStatus == JobStatus.Syncing) {
      lockDestTable(job)
    } else {
      unlockDestTable(job)
    }
  }

  override def forceSync(orgId: Long, jobId: JobId, atTime: Long): Future[Boolean] = {
    jobRepository.get(orgId, jobId).flatMap {
      case Some(job) =>
        if (job.currentSyncStatus == JobStatus.Queued) {
          throw BadRequestError("job is already queued")
        } else if (job.currentSyncStatus == JobStatus.Syncing) {
          throw BadRequestError("job is already running")
        } else {
          val newJob: Job = job match {
            case jdbcJob: JdbcJob =>
              jdbcJob.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case gaJob: GaJob =>
              gaJob.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: HubspotJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: GoogleSheetJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: MongoJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: BigQueryStorageJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: GenericJdbcJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: CoinMarketCapJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: SolanaJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: ShopifyJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: AmazonS3Job =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: GoogleAdsJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: Ga4Job =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: FacebookAdsJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: TikTokAdsJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: ShopeeJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: LazadaJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: PalexyJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case job: GoogleSearchConsoleJob =>
              job.copy(currentSyncStatus = JobStatus.Init, nextRunTime = atTime)
            case _ => throw BadRequestError("job type not supported")
          }
          jobRepository.update(job.orgId, newJob)
        }
      case None => throw BadRequestError(s"not found job with id: $jobId")
    }
  }

  def fetchNextJob(): Future[Option[SyncInfo]] = {
    jobRepository.getNextJob().flatMap {
      case Some(job) =>
        if (!isDestTableLocked(job)) {
          buildNextSyncInfo(job)
        } else {
          delayTilNextSync(job).map(_ => None)
        }
      case None => Future.None
    }
  }

  override def start(): Unit = {
    initPreviouslyQueuedJobs()

    val pollingJobThread = new Thread(
      () => {

        while (true) {
          try {
            fetchNextJob().sync() match {
              case Some(syncInfo) => jobQueue.put(syncInfo)
              case None           =>
            }
          } catch {
            case e: Throwable => logger.error(s"queue job fail: ${e.getMessage}", e)
          }

          Thread.sleep(pollingIntervalMs)
        }

      },
      "PollingJobThread"
    )

    pollingJobThread.start()
  }

  override def status(): Future[Seq[SyncInfo]] =
    Future {
      jobQueue.iterator().asScala.toSeq
    }

  override def kill(orgId: JobId, jobId: JobId): Future[Boolean] = {
    jobRepository
      .get(orgId, jobId)
      .map {
        case Some(job) =>
          unlockDestTable(job)

          job.currentSyncStatus match {
            case JobStatus.Queued  => removeFromQueue(orgId, job)
            case JobStatus.Syncing => sendKillSignal(orgId, job)
            case _                 => Future.False
          }
        case None => throw BadRequestError(s"Not found job with id: $jobId")
      }
      .flatten
  }

  private def removeFromQueue(orgId: OrgId, job: Job): Future[Boolean] = {
    val nextRunTime: Long =
      if (job.scheduleTime.isInstanceOf[ScheduleOnce]) {
        Long.MaxValue
      } else {
        TimeUtils.calculateNextRunTime(job.scheduleTime, lastScheduleTime = Some(System.currentTimeMillis()))
      }

    jobRepository
      .update(
        orgId = orgId,
        job = job.customCopy(currentSyncStatus = JobStatus.Terminated).copyRunTime(nextRunTime)
      )
      .map(updateOk => {
        if (updateOk) {
          jobQueue.removeIf(_.job.jobId.equals(job.jobId))
          true
        } else false
      })
  }

  private def sendKillSignal(orgId: OrgId, job: Job): Future[Boolean] = {
    historyRepository.getLastHistory(orgId, job.jobId).map {
      case None        => Future.False
      case Some(value) => ssdbKVS.add(value.syncId, false).asTwitterFuture
    }
  }.flatten

  private def delayTilNextSync(job: Job): Future[Boolean] = {
    jobRepository.update(
      job.orgId,
      job.copyRunTime(job.nextRunTime + Duration.ofMinutes(5).toMillis)
    )
  }

  def initPreviouslyQueuedJobs(): Unit = {
    val jobs: Seq[SyncInfo] = fetchQueuedJobs().sync()

    jobs.foreach(jobQueue.offer)

    if (jobs.size > maxQueueSize) {
      warn(
        s"number of previously queued job (${jobs.size}) exceed max queue size (${maxQueueSize}), may lead to missing data!"
      )
    }
  }

  private def fetchQueuedJobs(): Future[Seq[SyncInfo]] = {
    for {
      jobs <- jobRepository.getQueuedJobs()
      sources <- sourceRepository.multiGet(jobs.map(_.sourceId))
      histories <- historyRepository.getQueuedHistories(jobs.map(_.jobId))
      connections <- connectionService.mgetTunnelConnection(jobs.map(_.orgId))
    } yield {
      jobs.map(job =>
        SyncInfo(
          job = job,
          source = sources.get(job.sourceId),
          syncId = histories.get(job.jobId).map(_.syncId).getOrElse(0L),
          connection = connections(job.orgId)
        )
      )
    }
  }

  private def isDestTableLocked(job: Job): Boolean = {
    destTableLocks.contains(job.destDatabaseName, job.destTableName)
  }

  private def lockDestTable(job: Job): Unit = {
    destTableLocks += Tuple2(job.destDatabaseName, job.destTableName)
  }

  private def unlockDestTable(job: Job): Unit = {
    destTableLocks -= Tuple2(job.destDatabaseName, job.destTableName)
  }

  override def multiForceSync(orgId: JobId, jobIds: Seq[JobId], atTime: JobId): Future[Map[JobId, Boolean]] = {
    val forceSyncResultMap: Map[JobId, Future[Boolean]] = jobIds
      .map(jobId => {
        val isSuccess: Future[Boolean] = forceSync(orgId, jobId, atTime).rescue {
          case ex: Throwable => {
            logger.error(s"force sync job $jobId fail: ${ex.getMessage}", ex)
            Future.False
          }
        }
        jobId -> isSuccess
      })
      .toMap
    Future.collect(forceSyncResultMap)
  }
}
