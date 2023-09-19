package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{JobProgress, PalexyJobProgress}
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}

import java.sql.ResultSet

case class PalexyJob(
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
    dimensions: Set[String],
    metrics: Set[String],
    dateRange: DateRangeInfo,
    storeIds: Set[String] = Set.empty,
    storeCodes: Set[String] = Set.empty,
    lastSyncedValue: Option[String] = None
) extends Job {

  override def jobType: JobType = JobType.Palexy

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] =
    Map(
      "source_id" -> sourceId,
      "last_synced_value" -> lastSyncedValue.orNull,
      "date_range" -> JsonUtils.toJson(dateRange, false),
      "dimensions" -> JsonUtils.toJson(dimensions, false),
      "metrics" -> JsonUtils.toJson(metrics, false),
      "store_ids" -> JsonUtils.toJson(storeIds, false),
      "store_codes" -> JsonUtils.toJson(storeCodes, false),
      "schedule_time" -> JsonUtils.toJson(scheduleTime, false),
      "destinations" -> JsonUtils.toJson(destinations, false)
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
          lastSyncedValue = progress.asInstanceOf[PalexyJobProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[PalexyJobProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = progress.asInstanceOf[PalexyJobProgress].lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    throw new InternalError(s"not support multi create ${this.jobType}")
  }
}

object PalexyJob {
  def fromResultSet(rs: ResultSet): PalexyJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }
    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    PalexyJob(
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
      dimensions = JsonUtils.fromJson[Set[String]](jobData.at("/dimensions").textValue()),
      metrics = JsonUtils.fromJson[Set[String]](jobData.at("/metrics").textValue()),
      dateRange = JsonUtils.fromJson[DateRangeInfo](jobData.at("/date_range").textValue()),
      storeIds = JsonUtils.fromJson[Set[String]](jobData.at("/store_ids").textValue()),
      storeCodes = JsonUtils.fromJson[Set[String]](jobData.at("/store_codes").textValue()),
      lastSyncedValue =
        if (jobData.has("last_synced_value")) Some(jobData.at("/last_synced_value").textValue()) else None
    )
  }
}
