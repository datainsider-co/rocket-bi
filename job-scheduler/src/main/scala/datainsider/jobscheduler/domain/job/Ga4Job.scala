package datainsider.jobscheduler.domain.job

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import datainsider.jobscheduler.domain.{Ga4Progress, JobProgress}
import datainsider.jobscheduler.domain.job.DataDestination.DataDestination
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.job.JobType.JobType
import datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import datainsider.jobscheduler.util.JsonUtils

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

case class Ga4Job(
    orgId: Long,
    jobId: JobId = 0,
    @NotEmpty displayName: String,
    jobType: JobType = JobType.Ga4,
    creatorId: String = "", //??
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
    propertyId: String,
    dateRanges: Array[Ga4DateRange],
    metrics: Array[Ga4Metric],
    dimensions: Array[Ga4Dimension],
    incrementalColumn: Option[String],
    lastSyncedValue: String,
) extends Job {

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] =
    Map(
      "property_id" -> propertyId,
      "date_ranges" -> dateRanges,
      "metrics" -> metrics,
      "dimensions" -> dimensions,
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "last_sync_value" -> lastSyncedValue,
      "incremental_column" -> incrementalColumn,
    )

  override def customCopy(lastSyncStatus: JobStatus, currentSyncStatus: JobStatus, lastSuccessfulSync: Long): Job =
    this.copy(
      currentSyncStatus = currentSyncStatus,
      lastSyncStatus = lastSyncStatus,
      lastSuccessfulSync = lastSuccessfulSync
    )

  override def copyJobStatus(progress: JobProgress): Job = {
    val lastSyncedValue = progress match {
      case ga4Progress: Ga4Progress => ga4Progress.lastSyncedValue.getOrElse("")
      case _ => ""
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

object Ga4Job {
  def fromResultSet(rs: ResultSet): Ga4Job = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val dateRangesData = ArrayBuffer.empty[Ga4DateRange]
    val metricsData = ArrayBuffer.empty[Ga4Metric]
    val dimensionsData = ArrayBuffer.empty[Ga4Dimension]
    jobData
      .withArray[JsonNode]("date_ranges")
      .iterator
      .forEachRemaining(gaDateRange => {
        dateRangesData += Ga4DateRange(
          gaDateRange.get("start_date").textValue(),
          gaDateRange.get("end_date").textValue()
        )
      })
    jobData
      .withArray[JsonNode]("metrics")
      .iterator
      .forEachRemaining(gaMetric => {
        metricsData += Ga4Metric(
          gaMetric.get("name").textValue(),
          gaMetric.get("data_type").textValue()
        )
      })
    jobData
      .withArray[JsonNode]("dimensions")
      .iterator
      .forEachRemaining(dimension => {
        dimensionsData += Ga4Dimension(dimension.get("name").textValue())
      })
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
    Ga4Job(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.Ga4,
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
      propertyId = jobData.get("property_id").textValue(),
      dateRanges = dateRangesData.toArray,
      metrics = metricsData.toArray,
      dimensions = dimensionsData.toArray,
      destinations = dataDestinations,
      incrementalColumn = incrementalColumn,
      lastSyncedValue = jobData.get("last_sync_value").textValue(),
    )
  }
}

case class Ga4DateRange(startDate: String, endDate: String)

case class Ga4Dimension(name: String)

case class Ga4Metric(name: String, dataType: String)

