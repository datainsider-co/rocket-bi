package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{JobProgress, SolanaProgress}
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.domain.scheduler.Ids.JobId
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}

import java.sql.ResultSet

case class SolanaJob(
    orgId: Long = -1,
    jobId: JobId,
    displayName: String,
    jobType: JobType = JobType.Solana,
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
    destTransactionTable: String,
    destRewardTable: String,
    lastSyncedValue: String,
    retryTime: Int = 3,
    // can skip sync when error
    isSkip: Boolean = true
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] = {
    Map(
      "last_sync_value" -> lastSyncedValue,
      "retry_time" -> retryTime,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "is_skip" -> isSkip,
      "dest_transaction_table" -> destTransactionTable,
      "dest_reward_table" -> destRewardTable
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
          lastSyncedValue = progress.asInstanceOf[SolanaProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[SolanaProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus
        )
    }
  }

  override def copyRunTime(runTime: SourceId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: SourceId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    throw new InternalError(s"not support multi create ${this.jobType}")
  }
}

object SolanaJob {
  def fromResultSet(rs: ResultSet): SolanaJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime =
      if (jobData.has("schedule_time")) {
        JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
      } else
        ScheduleMinutely(rs.getInt("sync_interval_in_mn"))

    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    SolanaJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.Solana,
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
      lastSyncedValue = jobData.get("last_sync_value").textValue(),
      destinations = dataDestinations,
      destTransactionTable = jobData.get("dest_transaction_table").textValue(),
      destRewardTable = jobData.get("dest_reward_table").textValue(),
      retryTime = jobData.get("retry_time").intValue(),
      isSkip = jobData.get("is_skip").booleanValue()
    )
  }
}
