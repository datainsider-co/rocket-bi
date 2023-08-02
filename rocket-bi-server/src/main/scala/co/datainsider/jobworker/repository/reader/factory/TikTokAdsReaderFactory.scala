package co.datainsider.jobworker.repository.reader.factory

import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.ReportType.ReportType
import co.datainsider.jobworker.domain.job.TikTokAdsEndPoint.TikTokAdsEndPoint
import co.datainsider.jobworker.domain.job.{ReportType, TikTokAdsEndPoint, TikTokAdsJob, TikTokReport}
import co.datainsider.jobworker.domain.source.TikTokAdsSource
import co.datainsider.jobworker.exception.CreateReaderException
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.tiktok._
import co.datainsider.schema.domain.column.{Column, StringColumn}
import datainsider.client.util.JsonParser

import java.io.InputStream
import java.time.format.DateTimeParseException

class TikTokAdsReaderFactory(apiUrl: String) extends ReaderFactory[TikTokAdsSource, TikTokAdsJob] {

  override def create(source: TikTokAdsSource, job: TikTokAdsJob): Reader = {
    val client = new TikTokClient(baseUrl = apiUrl, accessToken = source.accessToken)
    val reader = job.tikTokEndPoint match {
      case TikTokAdsEndPoint.Ads         => getTikTokAdsReader(job, client)
      case TikTokAdsEndPoint.AdGroups    => getTikTokAdsReader(job, client)
      case TikTokAdsEndPoint.Campaigns   => getTikTokAdsReader(job, client)
      case TikTokAdsEndPoint.Advertisers => getTikTokAdsReader(job, client)
      case TikTokAdsEndPoint.Report      => getTikTokReportReader(job, client)
      case endpoint                      => throw new UnsupportedOperationException(s"'${endpoint}' endpoint is unsupported ")
    }
    reader
  }

  private def getTikTokAdsReader(tiktokJob: TikTokAdsJob, tikTokClient: TikTokClient) = {
    new TikTokAdsReader(
      job = tiktokJob,
      client = tikTokClient,
      columns = getAdsColumns(tiktokJob.tikTokEndPoint),
      parser = new TikTokRecordParser
    )
  }

  private def getStartSyncedDate(tikTokJob: TikTokAdsJob, report: TikTokReport): String = {
    val startDate = if (tikTokJob.lastSyncedValue.nonEmpty) {
      TikTokTimeRange.getNextDate(tikTokJob.lastSyncedValue.get)
    } else report.timeRange.start
    startDate
  }

  private def getTikTokReportReader(tikTokJob: TikTokAdsJob, tikTokClient: TikTokClient) = {
    try {
      val report: TikTokReport = tikTokJob.tikTokReport.getOrElse(
        throw CreateReaderException("can't create report reader when tikTokReport field is empty")
      )
      val baseParamsInfo: ReportParamsInfo = getReportParamsInfo(report.reportType)
      val timeRanges = tikTokJob.syncMode match {
        case SyncMode.IncrementalSync =>
          val startSyncedDate = getStartSyncedDate(tikTokJob, report)
          TikTokTimeRange.getTimeRanges(Some(startSyncedDate))
        case SyncMode.FullSync =>
          report.timeRange.splitIntoMonth
      }
      new TikTokReportReader(
        tikTokJob,
        client = tikTokClient,
        parser = new TikTokRecordParser(),
        baseParams = baseParamsInfo,
        columns = getReportColumns(baseParamsInfo),
        timeRanges = timeRanges
      )
    } catch {
      case e: DateTimeParseException => throw CreateReaderException(e.getMessage, e)
    }
  }

  def getReportColumns(baseParams: ReportParamsInfo): Seq[Column] = {
    val dimensionColumns: Seq[Column] =
      baseParams.dimensions.map(dimension => StringColumn(dimension, dimension, None))
    dimensionColumns ++ baseParams.metricColumns
  }

  private def getReportParamsInfo(reportType: ReportType): ReportParamsInfo = {
    val source: String = reportType match {

      case ReportType.ReservationBasicAdData =>
        "tiktok_ads/report/reservation/basic/ad_level/basic_data_metric.json"
      case ReportType.ReservationBasicAdEngagement =>
        "tiktok_ads/report/reservation/basic/ad_level/engagement_metric.json"
      case ReportType.ReservationBasicAdVideoPlay =>
        "tiktok_ads/report/reservation/basic/ad_level/video_play_metric.json"

      case ReportType.ReservationBasicAdgroupData =>
        "tiktok_ads/report/reservation/basic/adgroup_level/basic_data_metric.json"
      case ReportType.ReservationBasicAdgroupEngagement =>
        "tiktok_ads/report/reservation/basic/adgroup_level/engagement_metric.json"
      case ReportType.ReservationBasicAdgroupVideoPlay =>
        "tiktok_ads/report/reservation/basic/adgroup_level/video_play_metric.json"

      case ReportType.ReservationBasicCampaignData =>
        "tiktok_ads/report/reservation/basic/campaign_level/basic_data_metric.json"
      case ReportType.ReservationBasicCampaignEngagement =>
        "tiktok_ads/report/reservation/basic/campaign_level/engagement_metric.json"
      case ReportType.ReservationBasicCampaignVideoPlay =>
        "tiktok_ads/report/reservation/basic/campaign_level/video_play_metric.json"

      case ReportType.AuctionBasicAdData =>
        "tiktok_ads/report/auction/basic/ad_level/basic_data_metric.json"
      case ReportType.AuctionBasicAdEngagement =>
        "tiktok_ads/report/auction/basic/ad_level/engagement_metric.json"
      case ReportType.AuctionBasicAdInAppEvent =>
        "tiktok_ads/report/auction/basic/ad_level/in_app_event_metric.json"
      case ReportType.AuctionBasicAdOnsiteEvent =>
        "tiktok_ads/report/auction/basic/ad_level/onsite_event_metric.json"
      case ReportType.AuctionBasicAdPageEvent =>
        "tiktok_ads/report/auction/basic/ad_level/page_event_metric.json"
      case ReportType.AuctionBasicAdVideoPlay =>
        "tiktok_ads/report/auction/basic/ad_level/video_play_metric.json"
      case ReportType.AuctionBasicAdSkan =>
        "tiktok_ads/report/auction/basic/ad_level/skan_metric.json"

      case ReportType.AuctionBasicAdgroupData =>
        "tiktok_ads/report/auction/basic/adgroup_level/basic_data_metric.json"
      case ReportType.AuctionBasicAdgroupEngagement =>
        "tiktok_ads/report/auction/basic/adgroup_level/engagement_metric.json"
      case ReportType.AuctionBasicAdgroupInAppEvent =>
        "tiktok_ads/report/auction/basic/adgroup_level/in_app_event_metric.json"
      case ReportType.AuctionBasicAdgroupOnsiteEvent =>
        "tiktok_ads/report/auction/basic/adgroup_level/onsite_event_metric.json"
      case ReportType.AuctionBasicAdgroupPageEvent =>
        "tiktok_ads/report/auction/basic/adgroup_level/page_event_metric.json"
      case ReportType.AuctionBasicAdgroupVideoPlay =>
        "tiktok_ads/report/auction/basic/adgroup_level/video_play_metric.json"
      case ReportType.AuctionBasicAdgroupSkan =>
        "tiktok_ads/report/auction/basic/adgroup_level/skan_metric.json"

      case ReportType.AuctionBasicCampaignData =>
        "tiktok_ads/report/auction/basic/campaign_level/basic_data_metric.json"
      case ReportType.AuctionBasicCampaignEngagement =>
        "tiktok_ads/report/auction/basic/campaign_level/engagement_metric.json"
      case ReportType.AuctionBasicCampaignInAppEvent =>
        "tiktok_ads/report/auction/basic/campaign_level/in_app_event_metric.json"
      case ReportType.AuctionBasicCampaignOnsiteEvent =>
        "tiktok_ads/report/auction/basic/campaign_level/onsite_event_metric.json"
      case ReportType.AuctionBasicCampaignPageEvent =>
        "tiktok_ads/report/auction/basic/campaign_level/page_event_metric.json"
      case ReportType.AuctionBasicCampaignVideoPlay =>
        "tiktok_ads/report/auction/basic/campaign_level/video_play_metric.json"
      case ReportType.AuctionBasicCampaignSkan =>
        "tiktok_ads/report/auction/basic/campaign_level/skan_metric.json"

      case ReportType.AuctionBasicAdvertiserData =>
        "tiktok_ads/report/auction/basic/advertiser_level/basic_data_metric.json"
      case ReportType.AuctionBasicAdvertiserEngagement =>
        "tiktok_ads/report/auction/basic/advertiser_level/engagement_metric.json"
      case ReportType.AuctionBasicAdvertiserInAppEvent =>
        "tiktok_ads/report/auction/basic/advertiser_level/in_app_event_metric.json"
      case ReportType.AuctionBasicAdvertiserInteractiveAddOn =>
        "tiktok_ads/report/auction/basic/advertiser_level/interactive_add_on_metric.json"
      case ReportType.AuctionBasicAdvertiserLive =>
        "tiktok_ads/report/auction/basic/advertiser_level/live_metric.json"
      case ReportType.AuctionBasicAdvertiserOnsiteEvent =>
        "tiktok_ads/report/auction/basic/advertiser_level/onsite_event_metric.json"
      case ReportType.AuctionBasicAdvertiserPageEvent =>
        "tiktok_ads/report/auction/basic/advertiser_level/page_event_metric.json"
      case ReportType.AuctionBasicAdvertiserVideoPlay =>
        "tiktok_ads/report/auction/basic/advertiser_level/video_play_metric.json"
      case ReportType.AuctionBasicAdvertiserSkan =>
        "tiktok_ads/report/auction/basic/advertiser_level/skan_metric.json"

      case reportType => throw new UnsupportedOperationException(s"${reportType} is unsupported ")
    }
    val is: InputStream = getClass.getClassLoader.getResourceAsStream(source)
    val reportingParamsAsJson = scala.io.Source.fromInputStream(is).mkString
    JsonParser.fromJson[ReportParamsInfo](reportingParamsAsJson)
  }

  private def getAdsColumns(table: TikTokAdsEndPoint): Seq[Column] = {
    val filePath = table match {
      case TikTokAdsEndPoint.Ads         => "tiktok_ads/ad.json"
      case TikTokAdsEndPoint.AdGroups    => "tiktok_ads/ad_group.json"
      case TikTokAdsEndPoint.Campaigns   => "tiktok_ads/campaign.json"
      case TikTokAdsEndPoint.Advertisers => "tiktok_ads/advertiser.json"
      case adsType                       => throw new UnsupportedOperationException(s"${adsType} is unsupported to get ads column")
    }
    val is = getClass.getClassLoader.getResourceAsStream(filePath)
    val json = scala.io.Source.fromInputStream(is).mkString
    JsonParser.fromJson[Seq[Column]](json)
  }

}
