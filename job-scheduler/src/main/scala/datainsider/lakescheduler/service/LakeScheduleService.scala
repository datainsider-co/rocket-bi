package datainsider.lakescheduler.service

import com.twitter.concurrent.AsyncMutex
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.exception.BadRequestError
import datainsider.client.service.LakeClientService
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import datainsider.jobscheduler.util.ZConfig
import datainsider.lakescheduler.domain.{ClickhouseResultOutput, HadoopResultOutput, LakeJobHistory, LakeJobProgress}
import datainsider.lakescheduler.domain.job.{JavaJob, LakeJob, LakeJobStatus, SqlJob}
import datainsider.lakescheduler.domain.response.LakeRunInfo
import datainsider.lakescheduler.repository.{LakeHistoryRepository, LakeJobRepository}

import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.{BlockingQueue, LinkedBlockingQueue}
import javax.inject.Inject
import scala.collection.mutable

trait LakeScheduleService {

  def getNextJob: Future[Option[LakeRunInfo]]

  def reportJob(jobProgress: LakeJobProgress): Future[Boolean]

  def getJobProgresses: Future[mutable.Map[JobId, LakeJobProgress]]

  def forceRun(orgId: Long, jobId: JobId, atTime: Long): Future[Boolean]

  def killJob(orgId: Long, jobId: JobId): Future[Boolean]

  def start(): Future[Boolean]

  def stop(): Future[Boolean]

  def startQueue(): Unit
}

class LakeScheduleServiceImpl @Inject() (
    lakeJobRepository: LakeJobRepository,
    lakeHistoryRepository: LakeHistoryRepository,
    lakeClientService: LakeClientService
) extends LakeScheduleService
    with Logging {

  val sleepIntervalInMs: Int = ZConfig.getInt("sleep_interval_ms", 15000)
  val maxQueueSize: Int = ZConfig.getInt("job_queue_size", 8)
  val jobProgress: mutable.Map[JobId, LakeJobProgress] = mutable.Map.empty
  val isRunning: AtomicBoolean = new AtomicBoolean(false)
  val nConsumers: Int = ZConfig.getInt("num_job_worker", 4)

  private val jobMutex = new AsyncMutex()
  private val jobQueue: BlockingQueue[LakeRunInfo] = new LinkedBlockingQueue[LakeRunInfo](maxQueueSize)

  override def getNextJob: Future[Option[LakeRunInfo]] = {
    jobMutex.acquireAndRun {
      if (jobQueue.size() > 0) {
        val runInfo = jobQueue.take()
        Future.value(Some(runInfo))
      } else
        Future.None
    }
  }

  override def reportJob(jobProgress: LakeJobProgress): Future[Boolean] = {
    for {
      updatedJob <- updateJob(jobProgress)
      updatedHistory <- updateHistory(jobProgress)
    } yield updatedJob && updatedHistory
  }

  private def updateJob(progress: LakeJobProgress): Future[Boolean] = {
    try {
      for {
        jobOpt <- lakeJobRepository.get(progress.orgId, progress.jobId)
        updated <- lakeJobRepository.update(progress.orgId, toUpdatedJob(jobOpt.get, progress))
      } yield updated
    } catch {
      case e: Throwable =>
        error(s"error when update job from job progress $progress", e)
        throw new Exception(s"error when update job from job progress $progress", e)
    }
  }

  private def toUpdatedJob(job: LakeJob, progress: LakeJobProgress): LakeJob = {
    jobProgress.put(job.jobId, progress)
    val nextRunTime: Long =
      if (job.scheduleTime.isInstanceOf[ScheduleOnce])
        job.nextRunTime + 9999999999999L
      else
        TimeUtils.calculateNextRunTime(job.scheduleTime, lastScheduleTime = Some(job.lastRunTime))
    job
      .copyJobStatus(progress)
      .customCopy(nextRunTime = nextRunTime, yarnAppId = progress.progressData.getOrElse("yarn_app_id", "").toString)
  }

  private def updateHistory(progress: LakeJobProgress): Future[Boolean] = {
    for {
      historyOpt <- lakeHistoryRepository.get(progress.runId)
      historyInfo =
        if (
          progress.jobStatus == LakeJobStatus.Finished || progress.jobStatus == LakeJobStatus.Error || progress.jobStatus == LakeJobStatus.Killed
        ) {
          historyOpt.get.copy(
            updatedTime = progress.updatedTime,
            yarnAppId = progress.progressData.getOrElse("yarn_app_id", "").toString,
            endTime = progress.updatedTime,
            jobStatus = progress.jobStatus,
            message = progress.message.getOrElse("")
          )
        } else {
          historyOpt.get.copy(
            updatedTime = progress.updatedTime,
            yarnAppId = progress.progressData.getOrElse("yarn_app_id", "").toString,
            jobStatus = progress.jobStatus,
            message = progress.message.getOrElse("")
          )
        }
      updated <- lakeHistoryRepository.update(historyInfo)
    } yield updated
  }

  override def getJobProgresses: Future[mutable.Map[JobId, LakeJobProgress]] = Future(jobProgress)

  override def forceRun(orgId: Long, jobId: JobId, atTime: Long): Future[Boolean] = {
    lakeJobRepository.get(orgId, jobId).flatMap {
      case Some(job) =>
        if (job.currentJobStatus == LakeJobStatus.Queued) {
          throw BadRequestError("job is already queued")
        } else if (job.currentJobStatus == LakeJobStatus.Running) {
          throw BadRequestError("job is already running")
        } else {
          val newJob: LakeJob = job match {
            case jdbcJob: JavaJob =>
              jdbcJob.copy(
                currentJobStatus = LakeJobStatus.Init,
                nextRunTime = atTime
              )
            case sqlJob: SqlJob =>
              sqlJob.copy(
                currentJobStatus = LakeJobStatus.Init,
                nextRunTime = atTime
              )
            case _ => throw BadRequestError("job type not supported")
          }
          lakeJobRepository.update(job.orgId, newJob)
        }
      case None => throw BadRequestError(s"not found job with id: $jobId")
    }
  }

  private def prepareJobToRun(job: LakeJob): Future[Option[LakeRunInfo]] = {
    try {
      val lakeJobHistory: LakeJobHistory = initLakeJobHistory(job)
      for {
        runId <- lakeHistoryRepository.insert(job.orgId, lakeJobHistory)
        _ <- lakeJobRepository.update(job.orgId, job.customCopy(currentJobStatus = LakeJobStatus.Queued))
      } yield Some(LakeRunInfo(runId, job))
    } catch {
      case e: Throwable =>
        error("error when get next lake job", e)
        Future.None
    }
  }

  private def initLakeJobHistory(job: LakeJob): LakeJobHistory = {
    LakeJobHistory(
      jobId = job.jobId,
      jobName = job.name,
      yarnAppId = "",
      startTime = System.currentTimeMillis(),
      updatedTime = System.currentTimeMillis(),
      endTime = 0,
      jobStatus = LakeJobStatus.Queued,
      message = ""
    )
  }

  def queueReadyJob: Future[Option[LakeRunInfo]] = {
    lakeJobRepository.getNextJob.flatMap {
      case Some(job) => prepareJobToRun(job)
      case None      => Future.None
    }
  }

  override def startQueue(): Unit = {
    val pullJobThread = new Thread(() => {
      while (isRunning.get()) {
        try {
          queueReadyJob.sync() match {
            case Some(runInfo) =>
              jobQueue.put(runInfo)
              logger.info(s"job producer enqueue job: $runInfo")
            case None =>
              Thread.sleep(sleepIntervalInMs)
          }
        } catch {
          case e: Throwable => logger.error(s"queue job fail: ${e.getMessage}", e)
        }
      }
    })
    pullJobThread.start()
  }

  override def start(): Future[Boolean] =
    Future {
      if (!isRunning.get()) {
        isRunning.set(true)
        startQueue()
        true
      } else {
        false
      }
    }

  override def stop(): Future[Boolean] =
    Future {
      isRunning.set(false)
      clearQueue()
      true
    }

  private def clearQueue(): Boolean = {
    try {
      while (jobQueue.size() > 0) {
        val job = jobQueue.take().job
        lakeJobRepository.update(job.orgId, job.customCopy(currentJobStatus = job.lastRunStatus)).sync()
      }
      true
    } catch {
      case e: Throwable => throw new InternalError(s"Error when update job status: ${e.getMessage}")
    }
  }

  override def killJob(orgId: Long, jobId: JobId): Future[Boolean] = {
    lakeJobRepository
      .get(orgId, jobId)
      .map {
        case None => throw BadRequestError(s"Not found job with id: $jobId")
        case Some(job) =>
          info(s"killing job: $job")
          job.currentJobStatus match {
            case LakeJobStatus.Running   => lakeClientService.killApplication(job.yarnAppId)
            case LakeJobStatus.Queued    => removeJobFromQueue(orgId, job)
            case LakeJobStatus.Compiling => Future.False
            case _                       => Future.False
          }
      }
      .flatten
  }

  private def removeJobFromQueue(orgId: Long, job: LakeJob): Future[Boolean] = {
    if (jobQueue.removeIf(_.job.jobId.equals(job.jobId))) {
      val nextRunTime: Long =
        if (job.scheduleTime.isInstanceOf[ScheduleOnce]) {
          Long.MaxValue
        } else {
          TimeUtils.calculateNextRunTime(job.scheduleTime, lastScheduleTime = Some(job.nextRunTime))
        }
      lakeJobRepository.update(
        orgId,
        job.customCopy(
          currentJobStatus = job.lastRunStatus,
          nextRunTime = nextRunTime
        )
      )
    } else {
      Future.False
    }
  }
}
