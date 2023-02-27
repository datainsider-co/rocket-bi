package datainsider.jobscheduler.domain.job

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import datainsider.jobscheduler.domain.job.DataDestination.DataDestination
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.job.JobType.JobType
import datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import datainsider.jobscheduler.domain.{JdbcProgress, JobProgress}
import datainsider.jobscheduler.util.JsonUtils

import java.sql.ResultSet

case class JdbcJob(
    orgId: Long,
    jobId: JobId = 0,
    @NotEmpty displayName: String,
    jobType: JobType = JobType.Jdbc,
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
    databaseName: String,
    tableName: String,
    queryStatement: Option[String],
    incrementalColumn: Option[String],
    lastSyncedValue: String,
    maxFetchSize: Int
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker, data is in form of key value pair, key values are hardcoded
    */
  override def jobData: Map[String, Any] = {
    Map(
      "database_name" -> databaseName,
      "table_name" -> tableName,
      "query_statement" -> queryStatement,
      "incremental_column" -> incrementalColumn,
      "last_sync_value" -> lastSyncedValue,
      "max_fetch_size" -> maxFetchSize,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations)
    )
  }

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
          lastSyncedValue = progress.asInstanceOf[JdbcProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[JdbcProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = progress.asInstanceOf[JdbcProgress].lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    tableNames.map(tableName => {
      this.copy(
        orgId = orgId,
        creatorId = creatorId,
        displayName = this.displayName + s" (database: ${this.databaseName}, table: $tableName)",
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

object JdbcJob {
  def fromResultSet(rs: ResultSet): JdbcJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val incrementalColumn =
      if (jobData.has("incremental_column")) {
        Some(jobData.get("incremental_column").textValue())
      } else {
        None
      }
    val queryStatement = if (jobData.has("query_statement")) {
      Some(jobData.get("query_statement").textValue())
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

    JdbcJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.withName(rs.getString("job_type")),
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
      databaseName = jobData.get("database_name").textValue(),
      tableName = jobData.get("table_name").textValue(),
      queryStatement = queryStatement,
      incrementalColumn = incrementalColumn,
      lastSyncedValue = jobData.get("last_sync_value").textValue(),
      maxFetchSize = jobData.get("max_fetch_size").intValue(),
      destinations = dataDestinations
    )
  }

  def toMultiJob(orgId: Long, creatorId: String, baseJob: JdbcJob, tableNames: Seq[String]): Seq[Job] = {
    tableNames.map(tableName => {
      baseJob.copy(
        orgId = orgId,
        creatorId = creatorId,
        displayName = baseJob.displayName + s" (database: ${baseJob.databaseName}, table: $tableName)",
        lastModified = System.currentTimeMillis(),
        nextRunTime = TimeUtils.calculateNextRunTime(baseJob.scheduleTime, None),
        lastSyncStatus = JobStatus.Init,
        currentSyncStatus = JobStatus.Init,
        destTableName = tableName,
        tableName = tableName
      )
    })
  }
}
