package co.datainsider.jobworker.domain.job

import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleTime}
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.{Job, JobType, SyncMode}
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode

case class CoinMarketCapJob(
    orgId: Long,
    jobId: Int = 0,
    displayName: String,
    jobType: JobType = JobType.CoinMarketCap,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    nextRunTime: Long = System.currentTimeMillis(),
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    apiKey: String
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
