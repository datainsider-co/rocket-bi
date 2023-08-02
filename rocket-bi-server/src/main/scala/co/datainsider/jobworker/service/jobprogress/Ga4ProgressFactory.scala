package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.{GA4Progress, JobProgress}
import co.datainsider.jobworker.domain.job.Ga4Job
import co.datainsider.jobworker.service.worker2.JobWorkerProgress
import co.datainsider.jobworker.domain.Ids.SyncId

/**
 * created 2023-03-02 2:12 PM
 *
 * @author tvc12 - Thien Vi
 */
class Ga4ProgressFactory extends JobProgressFactory[Ga4Job] {
  override def create(syncId: SyncId, job: Ga4Job, jobProgress: JobWorkerProgress): JobProgress = {
    GA4Progress(
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
