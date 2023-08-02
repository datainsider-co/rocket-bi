package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.{JobProgress, TikTokAdsProgress}
import co.datainsider.jobworker.domain.job.TikTokAdsJob
import co.datainsider.jobworker.service.worker2.JobWorkerProgress
import co.datainsider.jobworker.domain.Ids.SyncId

/**
 * created 2023-03-02 2:12 PM
 *
 * @author tvc12 - Thien Vi
 */
class TikTokAdsProgressFactory extends JobProgressFactory[TikTokAdsJob] {
  override def create(syncId: SyncId, job: TikTokAdsJob, jobProgress: JobWorkerProgress): JobProgress = {
    TikTokAdsProgress(
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
