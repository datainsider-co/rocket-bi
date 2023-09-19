package co.datainsider.jobscheduler.domain.job

import co.datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import co.datainsider.jobscheduler.domain.job.GoogleSearchConsoleType.GoogleSearchConsoleType
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.JobType.JobType
import co.datainsider.jobscheduler.domain.job.SearchAnalyticsDataState.SearchAnalyticsDataState
import co.datainsider.jobscheduler.domain.job.SearchAnalyticsType.SearchAnalyticsType
import co.datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import co.datainsider.jobscheduler.domain.{GoogleJobProgress, JobProgress}
import co.datainsider.jobscheduler.util.JsonUtils
import co.datainsider.jobscheduler.util.JsonUtils.ImplicitJsonNode
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}

import java.sql.ResultSet

case class GoogleSearchConsoleJob(
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
    siteUrl: String,
    @JsonScalaEnumeration(classOf[GoogleSearchConsoleTypeRef])
    tableType: GoogleSearchConsoleType,
    dateRange: DateRangeInfo,
    searchAnalyticsConfig: SearchAnalyticsConfig,
    lastSyncedValue: Option[String] = None
) extends Job {

  override def jobType: JobType = JobType.GoogleSearchConsole

  /** *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] =
    Map(
      "source_id" -> sourceId,
      "last_synced_value" -> lastSyncedValue.orNull,
      "date_range" -> JsonUtils.toJson(dateRange, false),
      "schedule_time" -> JsonUtils.toJson(scheduleTime, false),
      "destinations" -> JsonUtils.toJson(destinations, false),
      "site_url" -> siteUrl,
      "table_type" -> tableType.toString,
      "search_analytics_config" -> JsonUtils.toJson(searchAnalyticsConfig, false)
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
          lastSyncedValue = progress.asInstanceOf[GoogleJobProgress].lastSyncedValue
        )
      case JobStatus.Error =>
        this.copy(
          currentSyncStatus = JobStatus.Error,
          lastSuccessfulSync = progress.updatedTime,
          lastSyncStatus = JobStatus.Error,
          lastSyncedValue = progress.asInstanceOf[GoogleJobProgress].lastSyncedValue
        )
      case _ =>
        this.copy(
          currentSyncStatus = progress.jobStatus,
          lastSyncedValue = progress.asInstanceOf[GoogleJobProgress].lastSyncedValue
        )
    }
  }

  override def copyRunTime(runTime: JobId): Job = this.copy(nextRunTime = runTime)

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {
    throw new InternalError(s"not support multi create ${this.jobType}")
  }
}

object GoogleSearchConsoleJob {
  def fromResultSet(rs: ResultSet): GoogleSearchConsoleJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }

    GoogleSearchConsoleJob(
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
      destinations = jobData.asOpt[Seq[String]]("/destinations").getOrElse(Seq.empty),
      siteUrl = jobData.getString("site_url"),
      tableType = GoogleSearchConsoleType.withName(jobData.getString("table_type")),
      dateRange = jobData.as[DateRangeInfo]("/date_range"),
      searchAnalyticsConfig = jobData.as[SearchAnalyticsConfig]("/search_analytics_config"),
      lastSyncedValue = jobData.optString("last_synced_value")
    )
  }
}

object GoogleSearchConsoleType extends Enumeration {
  type GoogleSearchConsoleType = Value
  val SearchAnalytics: GoogleSearchConsoleType.Value = Value("search_analytic")
  val SearchAppearance: GoogleSearchConsoleType.Value = Value("search_appearance")
}

class GoogleSearchConsoleTypeRef extends TypeReference[GoogleSearchConsoleType.type]

case class SearchAnalyticsConfig(
    `type`: SearchAnalyticsType = SearchAnalyticsType.Web,
    dataState: Option[SearchAnalyticsDataState] = None
)

object SearchAnalyticsType extends Enumeration {
  type SearchAnalyticsType = String
  val Web: SearchAnalyticsType = "web"
  val Image: SearchAnalyticsType = "image"
  val Video: SearchAnalyticsType = "video"
  val News: SearchAnalyticsType = "news"
  val GoogleNews: SearchAnalyticsType = "googleNews"
  val Discover: SearchAnalyticsType = "discover"
}

object SearchAnalyticsDataState extends Enumeration {
  type SearchAnalyticsDataState = String
  val All: SearchAnalyticsDataState = "all"
  val Final: SearchAnalyticsDataState = "final"
}
