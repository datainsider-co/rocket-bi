package co.datainsider.jobworker.domain

import DataDestination.DataDestination
import Ids.SourceId
import JobStatus.JobStatus
import JobType.JobType
import SyncMode.SyncMode

case class JdbcJob(
    orgId: Long = -1,
    jobId: Int,
    jobType: JobType = JobType.Jdbc,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String = "",
    destTableName: String = "",
    destinations: Seq[DataDestination],
    databaseName: String,
    tableName: String,
    incrementalColumn: Option[String],
    lastSyncedValue: String,
    maxFetchSize: Int,
    query: Option[String]
) extends Job {

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
