package datainsider.jobworker.service.handler

import com.amazonaws.services.s3.AmazonS3
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.jobworker.domain._
import datainsider.jobworker.domain.source.{FacebookAdsSource, TikTokAdsSource}
import datainsider.jobworker.repository.JdbcReader
import datainsider.jobworker.service.worker.AmazonS3Client
import datainsider.jobworker.util.ZConfig

object SourceMetadataHandler {

  def apply(source: DataSource, extraData: Option[String] = None): SourceMetadataHandler = {
    source match {
      case jdbcSource: JdbcSource =>
        jdbcSource.databaseType match {
          case DatabaseType.MySql     => new MySqlMetadataHandler(jdbcSource)
          case DatabaseType.Oracle    => new OracleMetadataHandler(jdbcSource)
          case DatabaseType.SqlServer => new SqlServerMetadataHandler(jdbcSource)
          case DatabaseType.BigQuery  => new BigQueryMetadataHandler(jdbcSource)
          case DatabaseType.Redshift  => new RedshiftMetadataHandler(jdbcSource)
          case DatabaseType.Postgres  => new PostgresMetadataHandler(jdbcSource)
          case DatabaseType.Vertica   => new VerticaMetadataHandler(jdbcSource)
          case DatabaseType.Other     => throw BadRequestError(s"database ${jdbcSource.databaseType} is not yet supported")
        }
      case mongoSource: MongoSource => new MongoMetadataHandler(mongoSource)
      // Hiện tại chỉ google service account source chỉ support bigquery
      case dataSource: GoogleServiceAccountSource => BigQueryStorageMetadataHandler(dataSource, extraData)
      case datasource: ShopifySource              => new ShopifyMetadataHandler(datasource)
      case dataSource: AmazonS3Source =>
        val connectionTimeout: Int = 60000
        val timeToLive: Long = 1000
        val client: AmazonS3 =
          AmazonS3Client(dataSource, connectionTimeout = connectionTimeout, timeToLive = timeToLive)
        new AmazonS3MetadataHandler(client)

      case googleSource: GoogleAdsSource =>
        val clientId = ZConfig.getString("google_ads_api.gg_client_id")
        val clientSecret = ZConfig.getString("google_ads_api.gg_client_secret")
        val serverEncodedUrl = ZConfig.getString("google_ads_api.server_encoded_url")
        val developerToken = ZConfig.getString("google_ads_api.developer_token")
        new GoogleAdsMetaDataHandler(googleSource, clientId, clientSecret, serverEncodedUrl, developerToken)

      case facebookAdsSource: FacebookAdsSource =>
        val appId = ZConfig.getString("facebook_ads.app_id")
        val appSecret = ZConfig.getString("facebook_ads.app_secret")
        new FacebookAdsMetadataHandler(source = facebookAdsSource, appSecret = appSecret, appId = appId)

      case tikTokAdsSource: TikTokAdsSource =>
        new TikTokAdsMetaDataHandler(
          source = tikTokAdsSource,
          baseUrl = ZConfig.getString("tiktok_ads.base_url"),
          appId = ZConfig.getString("tiktok_ads.app_key"),
          appSecret = ZConfig.getString("tiktok_ads.app_secret")
        )
      case _ => throw BadRequestError(s"data source $source not yet supported")
    }
  }
}

trait SourceMetadataHandler {
  def testConnection(): Future[Boolean]

  def listDatabases(): Future[Seq[String]]

  def listTables(databaseName: String): Future[Seq[String]]

  def listColumn(databaseName: String, tableName: String): Future[Seq[String]]

  def testJob(job: Job): Future[Boolean]
}

abstract class JdbcSourceMetadataHandler extends SourceMetadataHandler {
  val jdbcSource: JdbcSource

  override def testJob(job: Job): Future[Boolean] =
    Future {
      try {
        val reader: JdbcReader = JdbcReader(jdbcSource, job.asInstanceOf[JdbcJob], 10)
        reader.hasNext
      } catch {
        case e: Throwable =>
          throw BadRequestError(s"unable to query data: $e", e)
      }
    }

}
