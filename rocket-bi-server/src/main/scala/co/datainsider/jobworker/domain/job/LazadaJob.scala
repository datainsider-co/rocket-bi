package co.datainsider.jobworker.domain.job

import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode
import LazadaSupportedTable.LazadaSupportedTable
import co.datainsider.jobworker.domain.{Job, JobType, RangeValue, SyncMode}

case class LazadaJob(
    orgId: Long = -1,
    jobId: Int,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    tableName: LazadaSupportedTable,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    incrementalColumn: Option[String],
    lastSyncedValue: Option[String],
    timeRange: RangeValue[Long]
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

object LazadaSupportedTable extends Enumeration {
  type LazadaSupportedTable = String
  val Order = "order"
  val OrderItem = "order_item"
  val Product = "product"
  val FlexiCombo = "flexi_combo"
  val PayoutStatus = "payout_status"
  val TransactionDetail = "transaction_detail"
  val PartnerTransaction = "partner_transaction"
}
