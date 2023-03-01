package datainsider.jobworker.repository.reader.facebook_ads

import com.facebook.ads.sdk._
import datainsider.client.domain.schema.column.Column
import datainsider.client.util.JsonParser
import datainsider.jobworker.domain.job.{FacebookAdsJob, FacebookTableName}
import datainsider.jobworker.domain.source.FacebookAdsSource
import datainsider.jobworker.repository.reader.Reader
import datainsider.jobworker.repository.reader.factory.ReaderFactory

import java.util
import scala.jdk.CollectionConverters._

class FacebookAdsFactory(appSecret: String, appId: String) extends ReaderFactory[FacebookAdsSource, FacebookAdsJob] {

  override def create(source: FacebookAdsSource, job: FacebookAdsJob): Reader = {
    val apiContext = new APIContext(source.accessToken, appSecret, appId)
    val account: AdAccount = new AdAccount(job.accountId, apiContext)
    val columns: Seq[Column] = getColumns(job)
    val responseAPINode: APINodeList[APINode] =
      getResponseAsAPINode(job, account, columns).asInstanceOf[APINodeList[APINode]]
    new FacebookAdsReader(job, responseAPINode, columns = columns)

  }

  private def getResponseAsAPINode(job: FacebookAdsJob, account: AdAccount, columns: Seq[Column]): APINodeList[_] = {

    val params: util.Map[String, AnyRef] = this.prepareGetInsightRequestParams(job)
    val nodeId: String = job.accountId
    val fields: util.List[String] = columns.map(_.name).asJava
    job.tableName match {
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
      case FacebookTableName.AdInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParams(params)
          .setParam("level", "ad")
          .requestFields(fields)
          .execute()
      case FacebookTableName.AdSetInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParams(params)
          .setParam("level", "adset")
          .requestFields(fields)
          .execute()
      case FacebookTableName.CampaignInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParams(params)
          .setParam("level", "campaign")
          .requestFields(fields)
          .execute()
      case FacebookTableName.AccountInsight =>
        new AdAccount.APIRequestGetInsights(nodeId, account.getContext)
          .setParams(params)
          .setParam("level", "account")
          .requestFields(fields)
          .execute()
      case _ =>
        throw new UnsupportedOperationException(s" FacebookTableName.${job.tableName} is not supported to get response")
    }
  }
  private def prepareGetInsightRequestParams(job: FacebookAdsJob): util.Map[String, AnyRef] = {
    val params = scala.collection.mutable.Map[String, AnyRef]()
    if (job.timeRange.isDefined)
      params += (
        "time_range" -> s"{'since':'${job.timeRange.get.since}','until':'${job.timeRange.get.until}'}"
      )

    if (job.datePreset.isDefined)
      params += ("date_preset" -> job.datePreset.get)

    params.asJava
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
