package datainsider.toolscheduler.service

import com.google.inject.Inject
import com.twitter.concurrent.AsyncMutex
import com.twitter.util.Future
import datainsider.client.util.TimeUtils
import datainsider.toolscheduler.domain.{NextJobResponse, ToolJob, ToolJobHistory, ToolJobStatus}

/**
  * handle job queue and serve on-time job to workers
  */
trait ToolScheduleService {
  def next(): Future[Option[NextJobResponse]]

  def report(history: ToolJobHistory): Future[Boolean]

  def forceRun(orgId: Long, jobId: Long): Future[Boolean]

  def stop(orgId: Long, jobId: Long): Future[Boolean]
}

class ToolScheduleServiceImpl @Inject() (jobService: ToolJobService, historyService: ToolHistoryService)
    extends ToolScheduleService {

  private val jobMutex = new AsyncMutex()

  override def next(): Future[Option[NextJobResponse]] =
    jobMutex.acquireAndRun {
      jobService.getNextJob(System.currentTimeMillis()).flatMap {
        case Some(job) => prepareNextJob(job).map(nextJobResp => Some(nextJobResp))
        case None      => Future.None
      }
    }

  override def forceRun(orgId: Long, jobId: Long): Future[Boolean] = {
    for {
      job <- jobService.get(orgId, jobId)
      updateJobOk <- jobService.update(job.copy(nextRunTime = 0L))
    } yield updateJobOk
  }

  override def report(history: ToolJobHistory): Future[Boolean] = {
    for {
      updateHistoryOk <- historyService.update(history)
      job <- jobService.get(history.orgId, history.jobId)
      updateJobOk <- updateJobStatus(job, history)
    } yield updateHistoryOk && updateJobOk
  }

  override def stop(orgId: Long, jobId: Long): Future[Boolean] = ???

  private def prepareNextJob(job: ToolJob): Future[NextJobResponse] = {
    for {
      newHistory <- historyService.create(job.toNewJobHistory())
      updateJobOk <- jobService.update(job.copy(currentRunStatus = ToolJobStatus.Queued))
    } yield NextJobResponse(newHistory.runId, job)
  }

  private def updateJobStatus(job: ToolJob, history: ToolJobHistory): Future[Boolean] = {

    val newJob = history.jobStatus match {
      case ToolJobStatus.Running => job.copy(currentRunStatus = ToolJobStatus.Running)
      case ToolJobStatus.Queued  => job.copy(currentRunStatus = ToolJobStatus.Queued)
      case _ =>
        // calculate next run time from current run time and frequency
        val nextRunTime: Long = TimeUtils.calculateNextRunTime(job.scheduleTime, Some(System.currentTimeMillis()))
        job.copy(
          currentRunStatus = history.jobStatus,
          lastRunStatus = history.jobStatus,
          lastRunTime = history.endAt,
          nextRunTime = nextRunTime,
          jobData = history.jobData
        )
    }

    if (job.currentRunStatus != newJob.currentRunStatus) {
      jobService.update(newJob)
    } else Future.True
  }

}
