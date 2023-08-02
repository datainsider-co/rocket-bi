package co.datainsider.datacook.service.scheduler

import com.twitter.concurrent.AsyncMutex
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike, futurePool}
import datainsider.client.domain.scheduler.Ids.JobId
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.exception.{BadRequestError, InternalError}
import datainsider.client.util.{TimeUtils, ZConfig}
import co.datainsider.datacook.domain.Ids.OrganizationId
import co.datainsider.datacook.domain._
import co.datainsider.datacook.service.{HistoryETLService, ETLService}
import education.x.commons.KVS

import java.util.concurrent.{BlockingQueue, LinkedBlockingQueue}
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global

class ScheduleServiceImpl(
                           jobService: ETLService,
                           historyService: HistoryETLService,
                           val sleepIntervalInMs: Int = ZConfig.getInt("data_cook.sleep_interval_ms", 15000),
                           val maxQueueSize: Int = ZConfig.getInt("data_cook.job_queue_size", 8),
                           runningJobMap: KVS[JobId, Boolean]
) extends ScheduleService
    with Logging {

  private val jobMutex = new AsyncMutex()
  private val jobQueue: BlockingQueue[JobInfo[EtlJob]] = new LinkedBlockingQueue[JobInfo[EtlJob]](maxQueueSize)
  var jobProgress: mutable.Map[JobId, EtlJobProgress] =
    new mutable.HashMap[JobId, EtlJobProgress] // in mem tracker, for debug purpose

  override def getNextJob: Future[Option[JobInfo[EtlJob]]] = {
    jobMutex.acquireAndRun {
      if (jobQueue.size() > 0) {
        val jobInfo = jobQueue.take()
        Future.value(Some(jobInfo))
      } else
        Future.None
    }
  }

  override def reportJob(progress: EtlJobProgress): Future[Boolean] = {
    for {
      _ <- updateJob(progress)
      _ <- updateHistory(progress)
    } yield true
  }

  private def updateJob(progress: EtlJobProgress): Future[Unit] = {
    updateJobProgresses(progress)
    val result: Future[Unit] = for {
      job <- jobService.getJob(progress.organizationId, progress.jobId)
      newJob = updateInfoJob(job, progress)
      result <-
        if (job.status != newJob.status) {
          jobService.update(newJob).unit
        } else {
          Future.Done
        }
    } yield result
    result.rescue {
      case ex: Throwable => {
        error(s"error when update job from job progress $progress", ex)
        Future.Unit
      }
    }.unit
  }

  private def updateJobProgresses(progress: EtlJobProgress): Unit = {
    jobProgress.put(progress.jobId, progress)
    jobProgress = jobProgress.filter {
      case (id, progress) => {
        // keep jobProgress in mem 5m
        progress.startTime > System.currentTimeMillis() - 300000
      }
    }
  }

  private def updateInfoJob(oldJob: EtlJob, progress: EtlJobProgress): EtlJob = {
    val nextExecuteTime = TimeUtils.calculateNextRunTime(oldJob.scheduleTime, Some(System.currentTimeMillis()))
    oldJob.copy(
      nextExecuteTime = nextExecuteTime,
      lastExecuteTime = Some(progress.startTime),
      status = progress.status,
      config = progress.config.getOrElse(oldJob.config),
      updatedTime = Some(System.currentTimeMillis())
    )
  }

  private def updateHistory(progress: EtlJobProgress): Future[Unit] = {
    for {
      history <- historyService.get(progress.organizationId, progress.historyId)
      result <-
        historyService
          .update(
            progress.organizationId,
            history.copy(
              updatedTime = System.currentTimeMillis(),
              totalExecutionTime = progress.totalExecutionTime,
              status = progress.status,
              message = progress.message,
              operatorError = progress.operatorError,
              tableSchemas = Option(progress.tableSchemas)
            )
          )
          .unit
    } yield result
  }

  override def getJobProgresses: Future[mutable.Map[JobId, EtlJobProgress]] = Future(jobProgress)

  private def prepareJobToBeSynced(job: EtlJob): Future[Option[JobInfo[EtlJob]]] = {
    val result: Future[Some[JobInfo[EtlJob]]] = for {
      history <- historyService.createHistory(job.organizationId, job.id, job.ownerId, ETLStatus.Queued)
      updatedJob <- jobService.update(job.copy(lastHistoryId = Some(history.id), status = ETLStatus.Queued))
    } yield Some(JobInfo(history.id, updatedJob))
    result.rescue {
      case ex: Throwable =>
        error(s"exception when get next job ${ex.getMessage}", ex)
        Future.None
    }
  }

  private def getJobToBeSynced(): Future[Option[JobInfo[EtlJob]]] = {
    for {
      job <- jobService.getNextJob
      jobInfo: Option[JobInfo[EtlJob]] <- job match {
        case Some(job) => prepareJobToBeSynced(job)
        case None      => Future.None
      }
    } yield jobInfo
  }

  override def queueJobs(): Unit = {
    val pullJobThread = new Thread(() => {
      while (true) {
        try {
          getJobToBeSynced().syncGet() match {
            case Some(jobInfo) => {
              jobQueue.add(jobInfo)
            }
            case None => Thread.sleep(sleepIntervalInMs)
          }
        } catch {
          case ex: Throwable => {
            error(s"queue job failure: ${ex.getMessage}", ex)
            Thread.sleep(sleepIntervalInMs)
          }
        }
      }
    })
    pullJobThread.start()
  }

  override def forceRun(orgId: OrganizationId, jobId: JobId, atTime: Long): Future[Unit] = {
    jobService.getJob(orgId, jobId).flatMap {
      case job: EtlJob if (job.status == ETLStatus.Queued) =>
        Future.exception(BadRequestError("job is already queued"))
      case job: EtlJob if (job.status == ETLStatus.Running) =>
        Future.exception(BadRequestError("job is already running"))
      case job: EtlJob => {
        val newJob: EtlJob = job.copy(status = ETLStatus.Init, nextExecuteTime = atTime)
        jobService.update(newJob).unit
      }
    }
  }

  override def killJob(orgId: OrganizationId, jobId: JobId): Future[Boolean] = {
    jobService.getJob(orgId, jobId).flatMap {
      case job: EtlJob =>
        job.status match {
          case ETLStatus.Queued                         => removeJobFromQueue(orgId, job)
          case ETLStatus.Running | ETLStatus.Syncing => killRunningJob(orgId, job)
          case _                                           => Future.False
        }
      case _ => Future.exception(BadRequestError(s"Not found job id ${jobId}"))
    }
  }

  private def removeJobFromQueue(orgId: OrganizationId, job: EtlJob): Future[Boolean] = {
    val isRemoved: Boolean = jobQueue.removeIf(_.job.id.equals(job.id))
    if (isRemoved) {
      val nextExecuteTime: Long = if (job.scheduleTime.isInstanceOf[ScheduleOnce]) {
        Long.MaxValue
      } else {
        TimeUtils.calculateNextRunTime(job.scheduleTime, Some(System.currentTimeMillis()))
      }
      jobService.update(job.copy(status = ETLStatus.Terminated, nextExecuteTime = nextExecuteTime)).map {
        case newJob => true
        case _      => false
      }
    } else {
      Future.False
    }
  }

  private def killRunningJob(orgId: OrganizationId, job: EtlJob): Future[Boolean] = {
    runningJobMap.add(job.id, false).asTwitter
  }

}
