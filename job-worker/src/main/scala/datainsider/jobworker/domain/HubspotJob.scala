package datainsider.jobworker.domain

import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SourceId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain.JobType.JobType
import datainsider.jobworker.domain.SyncMode.SyncMode
import datainsider.jobworker.util.JsonUtils

/**
  * Created by phg on 7/4/21.
 **/
case class HubspotJob(
    orgId: Long,
    jobId: Int = 0,
    jobType: JobType = JobType.Hubspot,
    syncMode: SyncMode,
    subType: HubspotSubJobType.Type = HubspotSubJobType.Contact,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination]
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: String =
    JsonUtils.toJson(
      Map(
        "sub_type" -> subType.toString
      )
    )

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

object HubspotSubJobType extends Enumeration {
  type Type = Value
  val Contact: Type = Value("contact")
  val Engagement: Type = Value("engagement")
  val Company: Type = Value("company")
  val Deal: Type = Value("deal")
  val Unknown: Type = Value("unknown")
}
