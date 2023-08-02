package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.domain.job.{ReportType, TikTokAdsEndPoint}
import co.datainsider.jobworker.domain.request.GenerateAccessTokenRequest
import co.datainsider.jobworker.domain.source.TikTokAdsSource
import co.datainsider.jobworker.repository.reader.tiktok.{TikTokAdvertiserData, TikTokClient, TikTokResponse, TikTokTokenInfo}
import co.datainsider.jobworker.util.JsonUtils
import com.twitter.util.logging.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.exception.BadRequestError
import co.datainsider.bi.util.ZConfig

class TikTokAdsMetaDataHandler(
    source: TikTokAdsSource,
    baseUrl: String,
    appId: String,
    appSecret: String
) extends SourceMetadataHandler
    with Logging {

  override def testConnection(): Future[Boolean] = {
    this.listDatabases().transform {
      case Throw(e) =>
        logger.error(s"GoogleAdsMetaDataHandler::testConnection:: ${e.getMessage}")
        Future.False
      case Return(r) => Future.True
    }
  }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      val tiktokClient =
        new TikTokClient(baseUrl = baseUrl, accessToken = source.accessToken)

      val params = Map[String, String](
        "app_id" -> appId,
        "secret" -> appSecret
      )
      val resp =
        tiktokClient.get[TikTokResponse[TikTokAdvertiserData]](endPoint = "oauth2/advertiser/get", params = params.toSeq)
      if (resp.isSuccess()) {
        resp.data.list.map(JsonUtils.toJson(_))
      } else throw BadRequestError(resp.message)
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      Seq(
        TikTokAdsEndPoint.Ads,
        TikTokAdsEndPoint.Advertisers,
        TikTokAdsEndPoint.Report,
        TikTokAdsEndPoint.AdGroups,
        TikTokAdsEndPoint.Campaigns
      )
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = ???

  override def testJob(job: Job): Future[Boolean] = ???
}

object TikTokAdsMetaDataHandler {
  def listReportTable(): Seq[String] = ReportType.values.toList.map(_.toString)

  def getTokenInfo(authCode: String): TikTokTokenInfo = {
    val tikTokClient = new TikTokClient(ZConfig.getString("tiktok_ads.base_url"), "")
    val request = GenerateAccessTokenRequest(
      secret = ZConfig.getString("tiktok_ads.app_secret"),
      appId = ZConfig.getString("tiktok_ads.app_key"),
      authCode = authCode
    )
    val resp = tikTokClient
      .post[TikTokResponse[TikTokTokenInfo], GenerateAccessTokenRequest](
        endPoint = "oauth2/access_token",
        data = request,
        headers = Seq()
      )
    if (resp.isSuccess()) {
      resp.data
    } else {
      throw BadRequestError(resp.message)
    }

  }

}
