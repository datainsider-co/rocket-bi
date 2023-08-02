package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.{JobProgress, ShopeeJobProgress, TikTokAdsProgress}
import co.datainsider.jobworker.domain.job.ShopeeJob
import co.datainsider.jobworker.service.worker2.JobWorkerProgress
import co.datainsider.jobworker.domain.Ids.SyncId

/**
  * created 2023-03-02 2:12 PM
  *
  * @author tvc12 - Thien Vi
  */
class ShopeeProgressFactory extends JobProgressFactory[ShopeeJob] {
  override def create(syncId: SyncId, job: ShopeeJob, jobProgress: JobWorkerProgress): JobProgress = {
    ShopeeJobProgress(
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
