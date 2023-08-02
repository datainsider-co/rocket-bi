package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import co.datainsider.jobscheduler.domain.JobProgress
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}

import java.sql.ResultSet

/**
  * Created by phg on 7/4/21.
 **/
case class HubspotJob(
    orgId: Long,
    jobId: JobId = 0,
    @NotEmpty displayName: String,
    jobType: JobType = JobType.Hubspot,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    syncMode: SyncMode = SyncMode.IncrementalSync,
    subType: HubspotSubJobType.Type = HubspotSubJobType.Contact,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    nextRunTime: Long = System.currentTimeMillis(),
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[String]
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] =
    Map(
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations)
    )

  override def customCopy(lastSyncStatus: JobStatus, currentSyncStatus: JobStatus, lastSuccessfulSync: Long): Job = {
    this.copy(
      currentSyncStatus = currentSyncStatus,
      lastSyncStatus = lastSyncStatus,
      lastSuccessfulSync = lastSuccessfulSync
    )
  }

  override def copyJobStatus(progress: JobProgress): Job = {
    progress.jobStatus match {
      case JobStatus.Synced =>
        this.copy(
          currentSyncStatus = JobStatus.Synced,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Synced
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    throw new InternalError(s"not support multi create ${this.jobType}")
  }
}

object HubspotJob {
  def fromResultSet(rs: ResultSet): Job = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }
    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    HubspotJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.Hubspot,
      creatorId = rs.getString("creator_id"),
      lastModified = rs.getLong("last_modified"),
      syncMode = SyncMode.withName(rs.getString("sync_mode")),
      subType = HubspotSubJobType.withName(jobData.get("sub_type").asText(HubspotSubJobType.Unknown.toString)),
      sourceId = rs.getLong("source_id"),
      lastSuccessfulSync = rs.getLong("last_successful_sync"),
      syncIntervalInMn = rs.getInt("sync_interval_in_mn"),
      lastSyncStatus = JobStatus.withName(rs.getString("last_sync_status")),
      currentSyncStatus = JobStatus.withName(rs.getString("current_sync_status")),
      scheduleTime = scheduleTime,
      destDatabaseName = rs.getString("destination_db"),
      destTableName = rs.getString("destination_tbl"),
      destinations = dataDestinations
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
