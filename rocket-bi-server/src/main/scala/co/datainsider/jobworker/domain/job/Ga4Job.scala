package co.datainsider.jobworker.domain.job

import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.{DummyId, SourceId}
import co.datainsider.jobworker.domain.{Job, JobType, SyncMode}
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode

/**
  * created 2022-09-12 11:35 AM
  *
  * @author tvc12 - Thien Vi
  */
case class Ga4Job(
    orgId: Long = DummyId,
    jobId: Int,
    jobType: JobType = JobType.Ga4,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    propertyId: String,
    dateRanges: Array[Ga4DateRange],
    metrics: Array[Ga4Metric],
    dimensions: Array[Ga4Dimension]
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

case class Ga4DateRange(startDate: String, endDate: String)

case class Ga4Dimension(name: String)

case class Ga4Metric(name: String, dataType: String)
