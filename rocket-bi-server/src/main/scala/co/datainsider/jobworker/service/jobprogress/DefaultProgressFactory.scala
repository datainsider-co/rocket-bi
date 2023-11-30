package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.{Job, JobProgress, JobProgressImpl}
import co.datainsider.jobworker.domain.job.GoogleSearchConsoleJob
import co.datainsider.jobworker.service.worker2.JobWorkerProgress

/**
 * created 2023-09-06 3:06 PM
 *
 * @author tvc12 - Thien Vi
 */
class DefaultProgressFactory extends JobProgressFactory[Job] {
  override def create(syncId: SyncId, job: Job, jobProgress: JobWorkerProgress): JobProgress = {
    JobProgressImpl(
      orgId = job.orgId,
      syncId = syncId,
      jobId = job.jobId,
      updatedTime = System.currentTimeMillis(),
      jobStatus = jobProgress.status,
      totalSyncRecord = jobProgress.totalSyncedRows.get(),
      totalExecutionTime = System.currentTimeMillis() - jobProgress.startTime,
      message = Some(jobProgress.messages.mkString("\n")),
      lastSyncedValue = if (jobProgress.lastSyncedValue.isEmpty) None else Some(jobProgress.lastSyncedValue)
    )
  }
}
