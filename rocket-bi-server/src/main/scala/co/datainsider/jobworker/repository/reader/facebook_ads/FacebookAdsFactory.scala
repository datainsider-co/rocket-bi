package co.datainsider.jobworker.repository.reader.facebook_ads

import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.{FacebookAdsJob, FacebookAdsTimeRange, FacebookDatePreset, FacebookTableName}
import co.datainsider.jobworker.domain.source.FacebookAdsSource
import co.datainsider.jobworker.exception.ReaderException
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.factory.ReaderFactory
import com.facebook.ads.sdk._
import co.datainsider.schema.domain.column.Column
import datainsider.client.util.JsonParser
import SyncMode.SyncMode

import java.text.SimpleDateFormat
import java.util
import java.util.Calendar
import scala.jdk.CollectionConverters._

class FacebookAdsFactory(appSecret: String, appId: String) extends ReaderFactory[FacebookAdsSource, FacebookAdsJob] {

  override def create(source: FacebookAdsSource, job: FacebookAdsJob): Reader = {
    val apiContext = new APIContext(source.accessToken, appSecret, appId)
    val account: AdAccount = new AdAccount(job.accountId, apiContext)
    val columns: Seq[Column] = getColumns(job)

    val reader: Reader = job.tableName match {
      case FacebookTableName.AdInsight => createFacebookAdsInsightReader(job, account, columns)

      case FacebookTableName.AdSetInsight => createFacebookAdsInsightReader(job, account, columns)

      case FacebookTableName.CampaignInsight => createFacebookAdsInsightReader(job, account, columns)

      case FacebookTableName.AccountInsight => createFacebookAdsInsightReader(job, account, columns)
      case _ =>
        createFacebookAdsReader(job, account, columns)
    }
    reader
  }

  private def getTimeRanges(job: FacebookAdsJob): FacebookAdsTimeRange = {
    if (job.syncMode == SyncMode.IncrementalSync && job.lastSyncedValue.nonEmpty) {
      FacebookAdsTimeRange(job.lastSyncedValue, getYesterday)
    } else if (job.datePreset.nonEmpty) {
      FacebookDatePreset.toTimeRange(job.datePreset.get)
    } else if (job.timeRange.nonEmpty) {
      job.timeRange.get
    } else throw new ReaderException("time_range or date_preset must not empty")
  }

  private def toFields(columns: Seq[Column]): Seq[String] = {
    columns.map(_.name).filter(!_.equals("action_type"))
  }

  private def getYesterday: String = {
    val format = new SimpleDateFormat("yyyy-MM-dd")
    val calendar = Calendar.getInstance()
    calendar.add(Calendar.DATE, -1)
    format.format(calendar.getTime)
  }

  private def createFacebookAdsInsightReader(
      job: FacebookAdsJob,
      account: AdAccount,
      columns: Seq[Column]
  ): FacebookAdsInsightReader = {
    val nodeId: String = job.accountId
    val fields: util.List[String] = toFields(columns).asJava
    val request: AdAccount.APIRequestGetInsights = job.tableName match {
      case FacebookTableName.AdInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParam("level", "ad")
          .requestFields(fields)
      case FacebookTableName.AdSetInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParam("level", "adset")
          .requestFields(fields)
      case FacebookTableName.CampaignInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParam("level", "campaign")
          .requestFields(fields)
      case FacebookTableName.AccountInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParam("level", "account")
          .requestFields(fields)
      case _ =>
        throw new UnsupportedOperationException(s" FacebookTableName.${job.tableName} is not supported to get response")
    }
    val timeRanges = FacebookAdsTimeRange.split(getTimeRanges(job), 1)
    new FacebookAdsInsightReader(
      job = job,
      request = request,
      columns = columns,
      timeRanges = timeRanges
    )

  }

  private def createFacebookAdsReader(
      job: FacebookAdsJob,
      account: AdAccount,
      columns: Seq[Column]
  ): FacebookAdsReader = {
    val fields: util.List[String] = columns.map(_.name).asJava
    val apiNode: APINodeList[APINode] = (job.tableName match {
      case FacebookTableName.Ad =>
        account.getAds.requestFields(fields).execute()
      case FacebookTableName.AdSet =>
        account.getAdSets.requestFields(fields).execute()
      case FacebookTableName.Campaign =>
        account.getCampaigns.requestFields(fields).execute()
      case FacebookTableName.Activity =>
        account.getActivities.requestFields(fields).execute()
      case FacebookTableName.AdCreative =>
        account.getAdCreatives.requestFields(fields).execute()
      case FacebookTableName.CustomConversions =>
        account.getCustomConversions.requestFields(fields).execute()
      case FacebookTableName.AdImage =>
        account.getAdImages.requestFields(fields).execute()
      case FacebookTableName.AdVideo =>
        account.getAdVideos.requestFields(fields).execute()
      case FacebookTableName.AdAccount =>
        new User("me", account.getContext).getAdAccounts.requestFields(fields).execute()
      case _ =>
        throw new UnsupportedOperationException(s" FacebookTableName.${job.tableName} is not supported to get response")
    }).asInstanceOf[APINodeList[APINode]]

    new FacebookAdsReader(job, apiNode, columns = columns)
  }
  private def getColumns(job: FacebookAdsJob): Seq[Column] = {

    val columnPath: String = job.tableName match {
      case FacebookTableName.Ad                => "facebook_ads_schema/ad.json"
      case FacebookTableName.AdSet             => "facebook_ads_schema/ad_set.json"
      case FacebookTableName.Campaign          => "facebook_ads_schema/campaign.json"
      case FacebookTableName.Activity          => "facebook_ads_schema/activity.json"
      case FacebookTableName.AdInsight         => "facebook_ads_schema/insight.json"
      case FacebookTableName.CampaignInsight   => "facebook_ads_schema/insight.json"
      case FacebookTableName.AdSetInsight      => "facebook_ads_schema/insight.json"
      case FacebookTableName.AccountInsight    => "facebook_ads_schema/insight.json"
      case FacebookTableName.AdCreative        => "facebook_ads_schema/ad_creative.json"
      case FacebookTableName.CustomConversions => "facebook_ads_schema/custom_conversions.json"
      case FacebookTableName.AdImage           => "facebook_ads_schema/ad_image.json"
      case FacebookTableName.AdVideo           => "facebook_ads_schema/ad_video.json"
      case FacebookTableName.AdAccount         => "facebook_ads_schema/ad_account.json"
      case _ =>
        throw new UnsupportedOperationException(s"schema of FacebookTableName.${job.tableName} is not supported")
    }
    val inputStream = getClass.getClassLoader.getResourceAsStream(columnPath)
    val columnsAsJson =
      try scala.io.Source.fromInputStream(inputStream).mkString
      finally inputStream.close()
    val columns: Seq[Column] = JsonParser.fromJson[Seq[Column]](columnsAsJson)
    columns
  }

}
