package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.job.{GoogleSearchConsoleJob, PalexyJob}
import co.datainsider.jobworker.domain.{GoogleJobProgress, JobProgress}
import co.datainsider.jobworker.service.worker2.JobWorkerProgress

/**
 * created 2023-09-06 3:06 PM
 *
 * @author tvc12 - Thien Vi
 */
class GoogleSearchConsoleProgressFactory extends JobProgressFactory[GoogleSearchConsoleJob] {
  override def create(syncId: SyncId, job: GoogleSearchConsoleJob, jobProgress: JobWorkerProgress): JobProgress = {
    GoogleJobProgress(
      orgId = job.orgId,
      syncId = syncId,
      jobId = job.jobId,
      updatedTime = System.currentTimeMillis(),
      jobStatus = jobProgress.status,
      totalSyncRecord = jobProgress.totalSyncedRows.get(),
      totalExecutionTime = System.currentTimeMillis() - jobProgress.startTime,
      message = Some(jobProgress.messages.mkString("\n")),
      lastSyncedValue = jobProgress.lastSyncedValue
    )
  }
}
