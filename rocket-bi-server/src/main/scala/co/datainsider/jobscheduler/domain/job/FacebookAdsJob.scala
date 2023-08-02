package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import co.datainsider.jobscheduler.domain.JobProgress
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import datainsider.client.util.TimeUtils

import java.sql.ResultSet

case class FacebookAdsJob(
    orgId: Long,
    jobId: JobId = 0,
    displayName: String,
    jobType: JobType = JobType.FacebookAds,
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
    destinations: Seq[String],
    tableName: String,
    accountId: String,
    timeRange: Option[FacebookAdsTimeRange] = None,
    datePreset: Option[String] = None
) extends Job {

  override def jobData: Map[String, Any] =
    Map(
      "account_id" -> accountId,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "table_name" -> tableName,
      "account_id" -> accountId,
      "time_range" -> JsonUtils.toJson(timeRange),
      "date_preset" -> datePreset
    )

  override def customCopy(lastSyncStatus: JobStatus, currentSyncStatus: JobStatus, lastSuccessfulSync: JobId): Job =
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

  override def copyRunTime(runTime: Long): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: Long, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    tableNames.map(tableName => {
      this.copy(
        orgId = orgId,
        creatorId = creatorId,
        displayName = this.displayName + s"(table: $tableName)",
        lastModified = System.currentTimeMillis(),
        nextRunTime = TimeUtils.calculateNextRunTime(this.scheduleTime, None),
        lastSyncStatus = JobStatus.Init,
        currentSyncStatus = JobStatus.Init,
        destTableName = tableName,
        tableName = tableName
      )
    })
  }

}

object FacebookAdsJob {
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

    FacebookAdsJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.FacebookAds,
      creatorId = rs.getString("creator_id"),
      lastModified = rs.getLong("last_modified"),
      sourceId = rs.getLong("source_id"),
      lastSuccessfulSync = rs.getLong("last_successful_sync"),
      syncIntervalInMn = rs.getInt("sync_interval_in_mn"),
      lastSyncStatus = JobStatus.withName(rs.getString("last_sync_status")),
      currentSyncStatus = JobStatus.withName(rs.getString("current_sync_status")),
      scheduleTime = scheduleTime,
      destDatabaseName = rs.getString("destination_db"),
      destTableName = rs.getString("destination_tbl"),
      accountId = jobData.get("account_id").textValue(),
      destinations = dataDestinations,
      tableName = jobData.get("table_name").textValue(),
      timeRange = Option(JsonUtils.fromJson[FacebookAdsTimeRange](jobData.get("time_range").textValue())),
      datePreset = Option(jobData.get("date_preset").textValue()),
      nextRunTime = rs.getLong("next_run_time")
    )
  }
}

/**
  * @param since A date in the format of "YYYY-MM-DD", which means from the beginning midnight of that day.
  * @param until A date in the format of "YYYY-MM-DD", which means to the beginning midnight of the following day.
  */
case class FacebookAdsTimeRange(since: String, until: String)
