package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{GaProgress, JobProgress}
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

case class GaJob(
    orgId: Long,
    jobId: JobId = 0,
    @NotEmpty displayName: String,
    jobType: JobType = JobType.Ga,
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
    viewId: String,
    dateRanges: Array[GaDateRange],
    metrics: Array[GaMetric],
    dimensions: Array[GaDimension],
    sorts: Seq[String] = Seq.empty,
    @deprecated("use GaSource instead of") accessToken: String = "",
    @deprecated("use GaSource instead of") refreshToken: String = "",
    lastSyncedValue: String = "",
    propertyId: String = "",
    tableName: String = "", // support fontend show table name
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] =
    Map(
      "view_id" -> viewId,
      "date_ranges" -> dateRanges,
      "metrics" -> metrics,
      "dimensions" -> dimensions,
      "access_token" -> accessToken,
      "refresh_token" -> refreshToken,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "last_synced_value" -> lastSyncedValue,
      "property_id" -> propertyId,
      "table_name" -> tableName,
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
          lastSyncedValue = progress.asInstanceOf[GaProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[GaProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = progress.asInstanceOf[GaProgress].lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    throw new InternalError(s"not support multi create ${this.jobType}")
  }
}

object GaJob {
  def fromResultSet(rs: ResultSet): GaJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val dateRangesData = ArrayBuffer.empty[GaDateRange]
    val metricsData = ArrayBuffer.empty[GaMetric]
    val dimensionsData = ArrayBuffer.empty[GaDimension]
    jobData
      .withArray[JsonNode]("date_ranges")
      .iterator
      .forEachRemaining(gaDateRange => {
        dateRangesData += GaDateRange(
          gaDateRange.get("start_date").textValue(),
          gaDateRange.get("end_date").textValue()
        )
      })
    jobData
      .withArray[JsonNode]("metrics")
      .iterator
      .forEachRemaining(gaMetric => {
        metricsData += GaMetric(
          gaMetric.get("expression").textValue(),
          gaMetric.get("alias").textValue(),
          gaMetric.get("data_type").textValue()
        )
      })
    jobData
      .withArray[JsonNode]("dimensions")
      .iterator
      .forEachRemaining(dimension => {
        dimensionsData += GaDimension(dimension.get("name").textValue())
      })
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }
    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    GaJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.Ga,
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
      viewId = jobData.get("view_id").textValue(),
      dateRanges = dateRangesData.toArray,
      metrics = metricsData.toArray,
      dimensions = dimensionsData.toArray,
      accessToken = jobData.get("access_token").textValue(),
      refreshToken = jobData.get("refresh_token").textValue(),
      destinations = dataDestinations,
      lastSyncedValue = Option(jobData.at("/last_synced_value").textValue()).getOrElse(""),
      propertyId = Option(jobData.at("/property_id").textValue()).getOrElse(""),
      tableName = Option(jobData.at("/table_name").textValue()).getOrElse(""),
    )
  }
}

case class GaDateRange(startDate: String, endDate: String) // YYYY-MM-DD
case class GaDimension(name: String)
case class GaMetric(expression: String, alias: String, dataType: String)
