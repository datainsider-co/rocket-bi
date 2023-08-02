package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{AmazonS3Progress, FileConfig, JobProgress}
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.domain.scheduler.Ids.JobId
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import co.datainsider.schema.domain.TableSchema

import java.sql.ResultSet

case class AmazonS3Job(
    orgId: Long = -1,
    jobId: JobId,
    displayName: String,
    jobType: JobType = JobType.S3,
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
    bucketName: String,
    fileConfig: FileConfig,
    folderPath: String = "",
    incrementalTime: Long,
    tableSchema: Option[TableSchema] = None
) extends Job {

  /**   *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] = {
    Map(
      "bucket_name" -> bucketName,
      "folder_path" -> folderPath,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "incremental_time" -> incrementalTime,
      "file_config" -> JsonUtils.toJson(fileConfig),
      "table_schema" -> JsonUtils.toJson(tableSchema)
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
          incrementalTime = progress.asInstanceOf[AmazonS3Progress].incrementalTime
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          incrementalTime = progress.asInstanceOf[AmazonS3Progress].incrementalTime
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus
        )
    }
  }

  override def copyRunTime(runTime: SourceId): Job = {
    this.copy(nextRunTime = runTime)
  }

  override def toMultiJob(orgId: SourceId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    throw new InternalError(s"not support multi create ${this.jobType}")
  }
}

object AmazonS3Job {
  def fromResultSet(rs: ResultSet): AmazonS3Job = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime =
      if (jobData.has("schedule_time")) {
        JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
      } else
        ScheduleMinutely(rs.getInt("sync_interval_in_mn"))

    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    AmazonS3Job(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.S3,
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
      bucketName = jobData.get("bucket_name").textValue(),
      fileConfig = JsonUtils.fromJson[FileConfig](jobData.get("file_config").textValue()),
      folderPath = jobData.get("folder_path").textValue(),
      incrementalTime = jobData.get("incremental_time").longValue(),
      tableSchema = JsonUtils.fromJson[Option[TableSchema]](jobData.get("table_schema").textValue())
    )
  }
}
