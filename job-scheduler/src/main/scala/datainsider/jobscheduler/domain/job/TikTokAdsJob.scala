package datainsider.jobscheduler.domain.job

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleMinutely, ScheduleTime}
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.job.JobType.JobType
import datainsider.jobscheduler.domain.job.SyncMode.SyncMode
import datainsider.jobscheduler.domain.job.TikTokAdsEndPoint.TikTokAdsEndPoint
import datainsider.jobscheduler.domain.{JobProgress, TikTokAdsProgress}
import datainsider.jobscheduler.util.JsonUtils

import java.sql.ResultSet
import scala.util.Try

case class TikTokAdsJob(
    orgId: Long,
    jobId: JobId = 0,
    @NotEmpty displayName: String,
    jobType: JobType = JobType.TikTokAds,
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
    advertiserId: String,
    tikTokEndPoint: String,
    tikTokReport: Option[TikTokReport],
    lastSyncedValue: Option[String]
) extends Job {

  override def jobData: Map[String, Any] =
    Map(
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "destinations" -> JsonUtils.toJson(destinations),
      "last_sync_value" -> lastSyncedValue,
      "advertiser_id" -> advertiserId,
      "tik_tok_end_point" -> tikTokEndPoint,
      "tik_tok_report" -> JsonUtils.toJson(tikTokReport)
    )

  override def customCopy(lastSyncStatus: JobStatus, currentSyncStatus: JobStatus, lastSuccessfulSync: Long): Job =
    this.copy(
      currentSyncStatus = currentSyncStatus,
      lastSyncStatus = lastSyncStatus,
      lastSuccessfulSync = lastSuccessfulSync
    )

  override def copyJobStatus(progress: JobProgress): Job = {
    val lastSyncedValue = progress match {
      case tikTokAdsProgress: TikTokAdsProgress => tikTokAdsProgress.lastSyncedValue
      case _                                    => None
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

  private def createMultiReportJob(baseJob: TikTokAdsJob, endPoint: String): Set[TikTokAdsJob] = {
    ReportType.values.map(reportType => {
      val report = baseJob.tikTokReport.get.copy(reportType = reportType.toString)
      val tableName = s"Report:${reportType}"
      this.copy(
        orgId = orgId,
        creatorId = creatorId,
        displayName = baseJob.displayName + s"(table:${tableName})",
        lastModified = System.currentTimeMillis(),
        nextRunTime = TimeUtils.calculateNextRunTime(baseJob.scheduleTime, None),
        lastSyncStatus = JobStatus.Init,
        currentSyncStatus = JobStatus.Init,
        destTableName = tableName,
        tikTokEndPoint = endPoint,
        tikTokReport = Some(report)
      )
    })
  }

  private def createAdsJob(baseJob: TikTokAdsJob, endPoint: TikTokAdsEndPoint): TikTokAdsJob = {
    val tableName = endPoint match {
      case TikTokAdsEndPoint.Ads         => "Ads"
      case TikTokAdsEndPoint.AdGroups    => "AdGroups"
      case TikTokAdsEndPoint.Campaigns   => "Campaigns"
      case TikTokAdsEndPoint.Advertisers => "Advertisers"
      case TikTokAdsEndPoint.Report      => "Report"
    }
    this.copy(
      orgId = orgId,
      creatorId = creatorId,
      displayName = baseJob.displayName + s"(table:${tableName})",
      lastModified = System.currentTimeMillis(),
      nextRunTime = TimeUtils.calculateNextRunTime(baseJob.scheduleTime, None),
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      destTableName = tableName,
      tikTokEndPoint = endPoint
    )
  }

  override def toMultiJob(orgId: JobId, creatorId: String, tableNames: Seq[String]): Seq[Job] = {

    tableNames.flatMap(endPoint => {
      if (endPoint != TikTokAdsEndPoint.Report) Seq(createAdsJob(this, endPoint))
      else createMultiReportJob(this, endPoint)
    })

  }
}

object TikTokAdsJob {
  def fromResultSet(rs: ResultSet): TikTokAdsJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    val scheduleTime: ScheduleTime = if (jobData.has("schedule_time")) {
      JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue())
    } else {
      ScheduleMinutely(rs.getInt("sync_interval_in_mn"))
    }
    val dataDestinations: Seq[String] = if (jobData.has("destinations")) {
      JsonUtils.fromJson[Seq[String]](jobData.get("destinations").textValue())
    } else Seq.empty

    val lastSyncedValue =
      if (jobData.has("last_synced_value")) {
        Some(jobData.get("last_synced_value").textValue())
      } else None

    TikTokAdsJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      displayName = rs.getString("name"),
      jobType = JobType.TikTokAds,
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
      lastSyncedValue = lastSyncedValue,
      tikTokEndPoint = jobData.get("tik_tok_end_point").textValue(),
      tikTokReport = Try(JsonUtils.fromJson[TikTokReport](jobData.get("tik_tok_report").textValue())).toOption,
      advertiserId = jobData.get("advertiser_id").textValue()
    )
  }
}

case class TikTokReport(
    reportType: String,
    timeRange: TikTokTimeRange
)

/**
  * @param start yyyy-MM-dd
  * @param end yyyy-MM-dd
  */
case class TikTokTimeRange(start: String, end: String)

object ReportType extends Enumeration {
  type ReportType = Value
  val ReservationBasicAdData: ReportType = Value("ReservationBasicAdBasicData")
  val ReservationBasicAdEngagement: ReportType = Value("ReservationBasicAdEngagement")
  val ReservationBasicAdVideoPlay: ReportType = Value("ReservationBasicAdVideoPlay")
  val ReservationBasicAdgroupData: ReportType = Value("ReservationBasicAdgroupData")
  val ReservationBasicAdgroupEngagement: ReportType = Value("ReservationBasicAdgroupEngagement")
  val ReservationBasicAdgroupVideoPlay: ReportType = Value("ReservationBasicAdgroupVideoPlay")
  val ReservationBasicCampaignData: ReportType = Value("ReservationBasicCampaignData")
  val ReservationBasicCampaignEngagement: ReportType = Value("ReservationBasicCampaignEngagement")
  val ReservationBasicCampaignVideoPlay: ReportType = Value("ReservationBasicCampaignVideoPlay")
  val AuctionBasicAdData: ReportType = Value("AuctionBasicAdBasicData")
  val AuctionBasicAdEngagement: ReportType = Value("AuctionBasicAdEngagement")
  val AuctionBasicAdInAppEvent: ReportType = Value("AuctionBasicAdInAppEvent")
  val AuctionBasicAdOnsiteEvent: ReportType = Value("AuctionBasicAdOnsiteEvent")
  val AuctionBasicAdPageEvent: ReportType = Value("AuctionBasicAdPageEvent")
  val AuctionBasicAdVideoPlay: ReportType = Value("AuctionBasicAdVideoPlay")
  val AuctionBasicAdSkan: ReportType = Value("AuctionBasicAdVideoSkan")
  val AuctionBasicAdgroupData: ReportType = Value("AuctionBasicAdgroupData")
  val AuctionBasicAdgroupEngagement: ReportType = Value("AuctionBasicAdgroupEngagement")
  val AuctionBasicAdgroupInAppEvent: ReportType = Value("AuctionBasicAdgroupInAppEvent")
  val AuctionBasicAdgroupOnsiteEvent: ReportType = Value("AuctionBasicAdgroupOnsiteEvent")
  val AuctionBasicAdgroupPageEvent: ReportType = Value("AuctionBasicAdgroupPageEvent")
  val AuctionBasicAdgroupVideoPlay: ReportType = Value("AuctionBasicAdgroupVideoPlay")
  val AuctionBasicAdgroupSkan: ReportType = Value("AuctionBasicAdgroupSkan")
  val AuctionBasicCampaignData: ReportType = Value("AuctionBasicCampaignData")
  val AuctionBasicCampaignEngagement: ReportType = Value("AuctionBasicCampaignEngagement")
  val AuctionBasicCampaignInAppEvent: ReportType = Value("AuctionBasicCampaignInAppEvent")
  val AuctionBasicCampaignOnsiteEvent: ReportType = Value("AuctionBasicCampaignOnsiteEvent")
  val AuctionBasicCampaignPageEvent: ReportType = Value("AuctionBasicCampaignPageEvent")
  val AuctionBasicCampaignVideoPlay: ReportType = Value("AuctionBasicCampaignVideoPlay")
  val AuctionBasicCampaignSkan: ReportType = Value("AuctionBasicCampaignSkan")
  val AuctionBasicAdvertiserData: ReportType = Value("AuctionBasicAdvertiserData")
  val AuctionBasicAdvertiserEngagement: ReportType = Value("AuctionBasicAdvertiserEngagement")
  val AuctionBasicAdvertiserInAppEvent: ReportType = Value("AuctionBasicAdvertiserInAppEvent")
  val AuctionBasicAdvertiserInteractiveAddOn: ReportType = Value("AuctionBasicAdvertiserInteractiveAddOn")
  val AuctionBasicAdvertiserLive: ReportType = Value("AuctionBasicAdvertiserLive")
  val AuctionBasicAdvertiserOnsiteEvent: ReportType = Value("AuctionBasicAdvertiserOnsiteEvent")
  val AuctionBasicAdvertiserPageEvent: ReportType = Value("AuctionBasicAdvertiserPageEvent")
  val AuctionBasicAdvertiserVideoPlay: ReportType = Value("AuctionBasicAdvertiserVideoPlay")
  val AuctionBasicAdvertiserSkan: ReportType = Value("AuctionBasicAdvertiserSkan")

}

object TikTokAdsEndPoint extends Enumeration {
  type TikTokAdsEndPoint = String
  val Ads: TikTokAdsEndPoint = "ad/get"
  val AdGroups: TikTokAdsEndPoint = "adgroup/get"
  val Campaigns: TikTokAdsEndPoint = "campaign/get"
  val Advertisers: TikTokAdsEndPoint = "advertiser/info"
  val Report: TikTokAdsEndPoint = "report/integrated/get"
}
