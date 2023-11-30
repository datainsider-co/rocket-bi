package co.datainsider.jobworker.domain

import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.HubspotObjectType.HubspotObjectType
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode
import co.datainsider.jobworker.util.JsonUtils
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

/**
  * Created by phg on 7/4/21.
  */
case class HubspotJob(
    orgId: Long,
    jobId: Int = 0,
    syncMode: SyncMode,
    @JsonScalaEnumeration(classOf[HubspotObjectTypeRef])
    subType: HubspotObjectType = HubspotObjectType.Contact,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination]
) extends Job {

  val jobType: JobType = JobType.Hubspot

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

object HubspotObjectType extends Enumeration {
  type HubspotObjectType = Value
  val Contact: HubspotObjectType = Value("contact")
  val Engagement: HubspotObjectType = Value("engagement")
  val Company: HubspotObjectType = Value("company")
  val Deal: HubspotObjectType = Value("deal")
  val Unknown: HubspotObjectType = Value("unknown")
}

class HubspotObjectTypeRef extends TypeReference[HubspotObjectType.type]
