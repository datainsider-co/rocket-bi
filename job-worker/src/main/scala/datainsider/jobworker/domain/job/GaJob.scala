package datainsider.jobworker.domain.job

import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SourceId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain.JobType.JobType
import datainsider.jobworker.domain.SyncMode.SyncMode
import datainsider.jobworker.domain.{Job, JobType, SyncMode}

case class GaJob(
    orgId: Long = -1,
    jobId: Int,
    jobType: JobType = JobType.Ga,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    viewId: String,
    dateRanges: Array[GaDateRange],
    metrics: Array[GaMetric],
    dimensions: Array[GaDimension],
    sorts: Seq[String] = Seq(),
    accessToken: String,
    refreshToken: String
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

case class GaDateRange(startDate: String, endDate: String) // YYYY-MM-DD
case class GaDimension(name: String, histogramBuckets: Array[Long])
case class GaMetric(expression: String, alias: String, dataType: String)
