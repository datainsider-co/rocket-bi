package co.datainsider.jobworker.domain.job

import co.datainsider.schema.domain.TableSchema
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.{Job, JobType, SyncMode}
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode

case class GoogleSheetJob(
    orgId: Long = -1,
    jobId: Int,
    displayName: String,
    jobType: JobType = JobType.GoogleSheets,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    spreadSheetId: String,
    sheetId: Int,
    schema: TableSchema,
    includeHeader: Boolean = false,
    accessToken: String,
    refreshToken: String
) extends Job {

  /**   *
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
      jobType = jobType,
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
