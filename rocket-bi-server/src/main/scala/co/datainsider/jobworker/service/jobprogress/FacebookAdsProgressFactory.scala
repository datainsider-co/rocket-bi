package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.{FacebookAdsProgress, JobProgress}
import co.datainsider.jobworker.domain.job.FacebookAdsJob
import co.datainsider.jobworker.service.worker2.JobWorkerProgress
import co.datainsider.jobworker.domain.Ids.SyncId

/**
 * created 2023-03-02 2:12 PM
 *
 * @author tvc12 - Thien Vi
 */
class FacebookAdsProgressFactory extends JobProgressFactory[FacebookAdsJob] {
  override def create(syncId: SyncId, job: FacebookAdsJob, jobProgress: JobWorkerProgress): JobProgress = {
    FacebookAdsProgress(
      orgId = job.orgId,
      syncId = syncId,
      jobId = job.jobId,
      updatedTime = System.currentTimeMillis(),
      jobStatus = jobProgress.status,
      totalSyncRecord = jobProgress.totalSyncedRows.get(),
      totalExecutionTime = System.currentTimeMillis() - jobProgress.startTime,
      message = Some(jobProgress.messages.mkString("\n")),
    )
  }
}
