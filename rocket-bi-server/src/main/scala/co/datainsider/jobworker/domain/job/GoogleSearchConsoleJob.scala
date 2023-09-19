package co.datainsider.jobworker.domain.job

import co.datainsider.jobscheduler.domain.job.GoogleSearchConsoleType.GoogleSearchConsoleType
import co.datainsider.jobscheduler.domain.job.{DateRangeInfo, GoogleSearchConsoleTypeRef, SearchAnalyticsConfig}
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode
import co.datainsider.jobworker.domain.{Job, JobType, SyncMode}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class GoogleSearchConsoleJob(
    orgId: Long = -1,
    jobId: Int = -1,
    displayName: String,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[String],
    siteUrl: String,
    @JsonScalaEnumeration(classOf[GoogleSearchConsoleTypeRef])
    tableType: GoogleSearchConsoleType,
    dateRange: DateRangeInfo,
    searchAnalyticsConfig: SearchAnalyticsConfig,
    lastSyncedValue: Option[String] = None
) extends Job {

  def jobType: JobType = JobType.GoogleSearchConsole

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
