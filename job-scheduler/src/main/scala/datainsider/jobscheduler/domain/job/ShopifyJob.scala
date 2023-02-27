package datainsider.jobscheduler.domain.job

import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.domain.scheduler.Ids.JobId
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.SourceId
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.job.JobType.JobType
import datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import datainsider.jobscheduler.domain.{JobProgress, ShopifyJobProgress}
import datainsider.jobscheduler.util.JsonUtils

import java.sql.ResultSet

case class ShopifyJob(
    orgId: Long = -1,
    jobId: JobId,
    displayName: String,
    jobType: JobType = JobType.Shopify,
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
    lastSyncedValue: String
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] = {
    Map(
      "last_sync_value" -> lastSyncedValue,
      "table_name" -> tableName,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
    )
  }

  override def customCopy(
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      lastSuccessfulSync: SourceId
  ): Job = {
    this.copy(
      currentSyncStatus = currentSyncStatus,
      lastSyncStatus = lastSyncStatus,
      lastSuccessfulSync = lastSuccessfulSync,
      nextRunTime = nextRunTime
    )
  }

  override def copyJobStatus(progress: JobProgress): Job = {
    progress.jobStatus match {
      case JobStatus.Synced =>
        this.copy(
          currentSyncStatus = JobStatus.Synced,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Synced,
          lastSyncedValue = progress.asInstanceOf[ShopifyJobProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[ShopifyJobProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus
        )
    }
  }

  override def copyRunTime(runTime: SourceId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: SourceId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    tableNames.map(tableName => {
      this.copy(
        orgId = orgId,
        creatorId = creatorId,
        displayName = this.displayName + s" (table: $tableName)",
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

object ShopifyJob {
  def fromResultSet(rs: ResultSet): ShopifyJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val incrementalColumn =
      if (jobData.has("incremental_column")) {
        Some(jobData.get("incremental_column").textValue())
      } else {
        None
      }
    val scheduleTime: ScheduleTime =
      if (jobData.has("schedule_time")) {
        JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
      } else
        ScheduleMinutely(rs.getInt("sync_interval_in_mn"))

    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    ShopifyJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.Shopify,
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
      tableName = jobData.get("table_name").textValue(),
      lastSyncedValue = jobData.get("last_sync_value").textValue(),
      destinations = dataDestinations
    )
  }
}
