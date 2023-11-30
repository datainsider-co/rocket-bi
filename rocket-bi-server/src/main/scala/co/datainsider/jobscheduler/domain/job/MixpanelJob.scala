package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.MixpanelTableName.MixpanelTableName
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{JobProgress, JobProgressImpl, job}
import co.datainsider.jobscheduler.util.JsonUtils
import co.datainsider.jobscheduler.util.JsonUtils.ImplicitJsonNode
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}

import java.sql.ResultSet

case class MixpanelJob(
    orgId: Long = -1,
    jobId: JobId = -1,
    @NotEmpty displayName: String,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    nextRunTime: Long = System.currentTimeMillis(),
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[String],
    dateRange: DateRangeInfo,
    @JsonScalaEnumeration(classOf[MixpanelTableNameRef])
    tableName: MixpanelTableName,
    lastSyncedValue: Option[String] = None
) extends Job {

  override def jobType: JobType = JobType.Mixpanel

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] =
    Map(
      "last_synced_value" -> lastSyncedValue.orNull,
      "date_range" -> JsonUtils.toJson(dateRange, false),
      "schedule_time" -> JsonUtils.toJson(scheduleTime, false),
      "destinations" -> JsonUtils.toJson(destinations, false),
      "table_name" -> tableName.toString
    )

  override def customCopy(lastSyncStatus: JobStatus, currentSyncStatus: JobStatus, lastSuccessfulSync: Long): Job =
    this.copy(
      currentSyncStatus = currentSyncStatus,
      lastSyncStatus = lastSyncStatus,
      lastSuccessfulSync = lastSuccessfulSync
    )

  override def copyJobStatus(progress: JobProgress): Job = {
    progress.jobStatus match {
      case JobStatus.Synced =>
        this.copy(
          currentSyncStatus = JobStatus.Synced,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Synced,
          lastSyncedValue = progress.asInstanceOf[JobProgressImpl].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[JobProgressImpl].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = progress.asInstanceOf[JobProgressImpl].lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)
}

object MixpanelJob {
  def fromResultSet(rs: ResultSet): MixpanelJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }

    MixpanelJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      creatorId = rs.getString("creator_id"),
      lastModified = rs.getLong("last_modified"),
      syncMode = SyncMode.withName(rs.getString("sync_mode")),
      sourceId = rs.getLong("source_id"),
      lastSuccessfulSync = rs.getLong("last_successful_sync"),
      syncIntervalInMn = rs.getInt("sync_interval_in_mn"),
      nextRunTime = rs.getLong("next_run_time"),
      lastSyncStatus = JobStatus.withName(rs.getString("last_sync_status")),
      currentSyncStatus = JobStatus.withName(rs.getString("current_sync_status")),
      scheduleTime = scheduleTime,
      destDatabaseName = rs.getString("destination_db"),
      destTableName = rs.getString("destination_tbl"),
      destinations = jobData.asOpt[Seq[String]]("/destinations").getOrElse(Seq.empty),
      dateRange = jobData.as[DateRangeInfo]("/date_range"),
      tableName = MixpanelTableName.withName(jobData.getString("table_name")),
      lastSyncedValue = jobData.optString("last_synced_value")
    )
  }
}

object MixpanelTableName extends Enumeration {
  type MixpanelTableName = Value
  val Engagement: MixpanelTableName.Value = Value("engagement")
  val Retention: job.MixpanelTableName.Value = Value("retention")
  val Cohort: job.MixpanelTableName.Value = Value("cohort")
  val CohortMembers: job.MixpanelTableName.Value = Value("cohort_members")
  val Export: job.MixpanelTableName.Value = Value("export")
}

class MixpanelTableNameRef extends TypeReference[MixpanelTableName.type]
