package datainsider.jobscheduler.domain.job

import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import datainsider.jobscheduler.domain.{BigqueryStorageProgress, JobProgress}
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.job.JobType.JobType
import datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import datainsider.jobscheduler.util.JsonUtils

import java.sql.ResultSet

case class BigQueryStorageJob(
    orgId: Long = -1,
    jobId: JobId,
    displayName: String,
    jobType: JobType = JobType.Bigquery,
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
    projectName: String,
    datasetName: String,
    tableName: String,
    selectedColumns: Seq[String],
    rowRestrictions: String,
    incrementalColumn: Option[String],
    lastSyncedValue: String
) extends Job {
  override def jobData: Map[String, Any] =
    Map(
      "dataset_name" -> datasetName,
      "table_name" -> tableName,
      "incremental_column" -> incrementalColumn,
      "last_sync_value" -> lastSyncedValue,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "project_name" -> projectName,
      "selected_columns" -> JsonUtils.toJson(selectedColumns.toArray),
      "row_restrictions" -> rowRestrictions
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
          lastSyncedValue = progress.asInstanceOf[BigqueryStorageProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[BigqueryStorageProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = progress.asInstanceOf[BigqueryStorageProgress].lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    tableNames.map(tableName => {
      this.copy(
        orgId = orgId,
        creatorId = creatorId,
        displayName = this.displayName + s" (database: ${this.datasetName}, table: $tableName)",
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

object BigQueryStorageJob {
  def fromResultSet(rs: ResultSet): BigQueryStorageJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val incrementalColumn =
      if (jobData.has("incremental_column")) {
        Some(jobData.get("incremental_column").textValue())
      } else {
        None
      }
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }
    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    BigQueryStorageJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.Bigquery,
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
      datasetName = jobData.get("dataset_name").textValue(),
      tableName = jobData.get("table_name").textValue(),
      incrementalColumn = incrementalColumn,
      lastSyncedValue = jobData.get("last_sync_value").textValue(),
      destinations = dataDestinations,
      projectName = jobData.get("project_name").textValue(),
      selectedColumns = JsonUtils.fromJson[Seq[String]](jobData.get("selected_columns").textValue()),
      rowRestrictions = jobData.get("row_restrictions").textValue()
    )
  }
}
