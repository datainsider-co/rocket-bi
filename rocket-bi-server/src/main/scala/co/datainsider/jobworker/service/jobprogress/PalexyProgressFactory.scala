package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.job.{LazadaJob, PalexyJob}
import co.datainsider.jobworker.domain.{JobProgress, LazadaJobProgress, PalexyJobProgress}
import co.datainsider.jobworker.service.worker2.JobWorkerProgress

/**
 * created 2023-03-02 2:12 PM
 *
 * @author tvc12 - Thien Vi
 */
class PalexyProgressFactory extends JobProgressFactory[PalexyJob] {
  override def create(syncId: SyncId, job: PalexyJob, jobProgress: JobWorkerProgress): JobProgress = {
    PalexyJobProgress(
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
