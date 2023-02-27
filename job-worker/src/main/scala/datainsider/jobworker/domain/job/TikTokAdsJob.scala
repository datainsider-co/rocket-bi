package datainsider.jobworker.domain.job

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SourceId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain.JobType.JobType
import datainsider.jobworker.domain.SyncMode.SyncMode
import datainsider.jobworker.domain.job.ReportType.ReportType
import datainsider.jobworker.domain.job.TikTokAdsEndPoint.TikTokAdsEndPoint
import datainsider.jobworker.domain.{Job, JobType, SyncMode}
import datainsider.jobworker.repository.reader.tiktok.TikTokTimeRange

case class TikTokAdsJob(
    orgId: Long,
    jobId: Int,
    jobType: JobType = JobType.TikTokAds,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    advertiserId: String,
    tikTokEndPoint: TikTokAdsEndPoint,
    tikTokReport: Option[TikTokReport],
    lastSyncedValue: Option[String]
) extends Job {
  override def jobData: String = ""
  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: DataDestination,
      destDatabaseName: DataDestination,
      destTableName: DataDestination,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }
}

object TikTokAdsEndPoint extends Enumeration {
  type TikTokAdsEndPoint = String
  val Ads: TikTokAdsEndPoint = "ad/get"
  val AdGroups: TikTokAdsEndPoint = "adgroup/get"
  val Campaigns: TikTokAdsEndPoint = "campaign/get"
  val Advertisers: TikTokAdsEndPoint = "advertiser/info"
  val Report: TikTokAdsEndPoint = "report/integrated/get"
}

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

case class TikTokReport(
    @JsonScalaEnumeration(classOf[JobTypeRef]) reportType: ReportType,
    timeRange: TikTokTimeRange
) {
  def isValid = timeRange.isValid()
}

class JobTypeRef extends TypeReference[ReportType.type]
