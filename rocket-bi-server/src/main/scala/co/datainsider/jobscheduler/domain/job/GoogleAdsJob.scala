package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{GoogleAdsProgress, JobProgress}
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import datainsider.client.util.TimeUtils

import java.sql.ResultSet
import scala.util.Try

case class GoogleAdsJob(
    orgId: Long = -1,
    jobId: Long,
    displayName: String,
    jobType: JobType = JobType.GoogleAds,
    creatorId: String = "",
    lastModified: Long = System.currentTimeMillis(),
    syncMode: SyncMode = SyncMode.IncrementalSync,
    sourceId: SourceId = -1,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    nextRunTime: Long = System.currentTimeMillis(),
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[String],
    customerId: String,
    resourceName: String,
    incrementalColumn: Option[String],
    lastSyncedValue: String,
    startDate: Option[String]
) extends Job {

  override def jobData: Map[String, Any] = {
    Map(
      "customer_id" -> customerId,
      "resource_name" -> resourceName,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "last_sync_value" -> lastSyncedValue,
      "incremental_column" -> incrementalColumn,
      "start_date" -> startDate
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
          lastSyncedValue = progress.asInstanceOf[GoogleAdsProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[GoogleAdsProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = progress.asInstanceOf[GoogleAdsProgress].lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: SourceId): Job = {
    this.copy(nextRunTime = runTime)
  }

  override def toMultiJob(orgId: SourceId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    tableNames.map(tableName => {
      this.copy(
        orgId = orgId,
        creatorId = creatorId,
        displayName = this.displayName + s" (resource: ${tableName})",
        lastModified = System.currentTimeMillis(),
        nextRunTime = TimeUtils.calculateNextRunTime(this.scheduleTime, None),
        lastSyncStatus = JobStatus.Init,
        currentSyncStatus = JobStatus.Init,
        destTableName = tableName,
        resourceName = tableName
      )
    })
  }
}

object GoogleAdsJob {
  def fromResultSet(rs: ResultSet): GoogleAdsJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))

    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }

    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    val incrementalColumn: Option[String] =
      if (jobData.has("incremental_column")) {
        Some(jobData.get("incremental_column").textValue())
      } else {
        None
      }

    val query: Option[String] = if (jobData.has("query")) {
      Some(jobData.get("query").textValue())
    } else {
      None
    }

    GoogleAdsJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.GoogleAds,
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
      customerId = jobData.get("customer_id").textValue(),
      resourceName = jobData.get("resource_name").textValue(),
      destinations = dataDestinations,
      incrementalColumn = incrementalColumn,
      lastSyncedValue = jobData.get("last_sync_value").textValue(),
      startDate = Try(jobData.get("start_date").textValue()).toOption
    )
  }
}
