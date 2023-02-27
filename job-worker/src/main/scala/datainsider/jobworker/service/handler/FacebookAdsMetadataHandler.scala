package datainsider.jobworker.service.handler
import com.facebook.ads.sdk.{APIContext, User}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.jobworker.domain.Job
import datainsider.jobworker.domain.job.FacebookTableName
import datainsider.jobworker.domain.source.FacebookAdsSource

import scala.jdk.CollectionConverters._

class FacebookAdsMetadataHandler(source: FacebookAdsSource, appSecret: String, appId: String)
    extends SourceMetadataHandler
    with Logging {
  val context = new APIContext(source.accessToken, appSecret, appId)
  override def testConnection(): Future[Boolean] = {
    this.listDatabases().map {
      case _: Seq[String] =>
        true
      case e: Throwable =>
        logger.error(s"FacebookAdsMetadataHandler::testConnection:: ${e.getMessage}")
        false
    }
  }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      val fields = Seq("name", "id").asJava
      val response = new User("me", context).getAdAccounts
        .requestFields(fields)
        .execute()
        .getRawResponseAsJsonObject
        .getAsJsonArray("data")
        .asScala
        .toSeq
      response.map(_.toString)
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      Seq(
        FacebookTableName.AdAccount,
        FacebookTableName.Campaign,
        FacebookTableName.AdSet,
        FacebookTableName.Ad,
        FacebookTableName.AccountInsight,
        FacebookTableName.CampaignInsight,
        FacebookTableName.AdSetInsight,
        FacebookTableName.AdInsight,
        FacebookTableName.AdCreative,
        FacebookTableName.AdImage,
        FacebookTableName.AdVideo,
        FacebookTableName.Activity,
        FacebookTableName.CustomConversions
      )
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = ???

  override def testJob(job: Job): Future[Boolean] = ???
}
