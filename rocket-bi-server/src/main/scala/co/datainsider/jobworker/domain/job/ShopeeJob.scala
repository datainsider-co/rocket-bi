package co.datainsider.jobworker.domain.job

import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode
import ShopeeSupportedTable.ShopeeSupportedTable
import co.datainsider.jobworker.domain.{Job, JobType, RangeValue, SyncMode}

case class ShopeeJob(
    orgId: Long = -1,
    jobId: Int,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    tableName: ShopeeSupportedTable,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    shopId: String,
    // must be seconds
    timeRange: RangeValue[Long],
    incrementalColumn: Option[String],
    lastSyncedValue: Option[String],
) extends Job {

  override def jobType: JobType = JobType.Shopee

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

object ShopeeSupportedTable extends Enumeration {
  type ShopeeSupportedTable = String
  val Order = "order"
  val Product = "product"
  val Category = "category"
  val ShopPerformance = "shop_performance"
}
