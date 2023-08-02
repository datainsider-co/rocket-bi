package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{JobProgress, LazadaJobProgress, RangeValue}
import co.datainsider.jobscheduler.util.JsonUtils
import co.datainsider.jobscheduler.util.JsonUtils.ImplicitJsonNode
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}

import java.sql.ResultSet

case class LazadaJob(
    orgId: Long = -1,
    jobId: JobId,
    displayName: String,
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    nextRunTime: Long = System.currentTimeMillis(),
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    tableName: String,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[String],
    timeRange: RangeValue[Long],
    incrementalColumn: Option[String],
    lastSyncedValue: Option[String]
) extends Job {

  override def jobType: JobType = JobType.Lazada

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] =
    Map(
      "time_range" -> JsonUtils.toJson(timeRange),
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "last_synced_value" -> lastSyncedValue.orNull,
      "incremental_column" -> incrementalColumn.orNull,
      "table_name" -> tableName
    )

  override def customCopy(lastSyncStatus: JobStatus, currentSyncStatus: JobStatus, lastSuccessfulSync: Long): Job =
    this.copy(
      currentSyncStatus = currentSyncStatus,
      lastSyncStatus = lastSyncStatus,
      lastSuccessfulSync = lastSuccessfulSync
    )

  override def copyJobStatus(progress: JobProgress): Job = {
    val lastSyncedValue = progress match {
      case jobProgress: LazadaJobProgress => jobProgress.lastSyncedValue
      case _                              => None
    }
    progress.jobStatus match {
      case JobStatus.Synced =>
        this.copy(
          currentSyncStatus = JobStatus.Synced,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Synced,
          lastSyncedValue = lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    throw new InternalError(s"not support multi create ${this.jobType}")
  }
}

object LazadaJob {
  def fromResultSet(rs: ResultSet): LazadaJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }
    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    LazadaJob(
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
      destinations = dataDestinations,
      lastSyncedValue = jobData.optString("last_synced_value"),
      tableName = jobData.getString("table_name"),
      timeRange = JsonUtils.fromJson[RangeValue[Long]](jobData.at("/time_range").textValue()),
      incrementalColumn = jobData.optString("incremental_column")
    )
  }
}
