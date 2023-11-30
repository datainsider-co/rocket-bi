package co.datainsider.jobworker.service.handler

import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.client.HttpClientImpl
import co.datainsider.jobworker.client.palexy.{PalexyClient, PalexyClientImpl}
import co.datainsider.jobworker.domain.source._
import co.datainsider.jobworker.domain.{DataSource, DatabaseType, JdbcJob, Job}
import co.datainsider.jobworker.repository.JdbcReader
import co.datainsider.jobworker.service.hubspot.client.APIKeyHubspotClient
import co.datainsider.jobworker.service.worker.AmazonS3Client
import co.datainsider.jobworker.util.GoogleOAuthConfig
import com.amazonaws.services.s3.AmazonS3
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.BadRequestError

object SourceMetadataHandler extends Logging {

  def apply(source: DataSource, extraData: Option[String] = None): SourceMetadataHandler = {
    source match {
      case jdbcSource: JdbcSource   => createJdbcMetadataHandler(jdbcSource)
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
      case source: GaSource => {
        new GaSourceMetadataHandler(source, getGoogleOAuthConfig())
      }
      case source: Ga4Source => {
        new Ga4SourceMetadataHandler(source, getGoogleOAuthConfig())
      }
      case source: PalexySource => {
        val palexyApiUrl = ZConfig.getString("palexy.base_url", "https://ica.palexy.com")
        new PalexyMetaDataHandler(
          client = new PalexyClientImpl(new HttpClientImpl(palexyApiUrl)),
          source = source
        )
      }
      case hubspotSource: HubspotSource => {
        val client = new APIKeyHubspotClient(hubspotSource.apiKey)
        new HubspotMetaDataHandler(client)
      }
      case ggSearchConsoleSource: GoogleSearchConsoleSource => {
        new GoogleSearchMetadataHandler(ggSearchConsoleSource, getGoogleOAuthConfig())
      }
      case source: MixpanelSource => {
        new MixpanelMetadataHandler(source)
      }
      case _ => throw BadRequestError(s"data source $source not yet supported")
    }
  }

  private def getGoogleOAuthConfig(): GoogleOAuthConfig = {
    GoogleOAuthConfig(
      clientId = ZConfig.getString("google.gg_client_id"),
      clientSecret = ZConfig.getString("google.gg_client_secret"),
      redirectUri = ZConfig.getString("google.redirect_uri"),
      serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
    )
  }

  private def createJdbcMetadataHandler(jdbcSource: JdbcSource): SourceMetadataHandler = {
    jdbcSource.databaseType match {
      case DatabaseType.MySql       => new MySqlMetadataHandler(jdbcSource)
      case DatabaseType.Oracle      => new OracleMetadataHandler(jdbcSource)
      case DatabaseType.SqlServer   => new SqlServerMetadataHandler(jdbcSource)
      case DatabaseType.BigQuery    => new BigQueryMetadataHandler(jdbcSource)
      case DatabaseType.Redshift    => new RedshiftMetadataHandler(jdbcSource)
      case DatabaseType.Postgres    => new PostgresMetadataHandler(jdbcSource)
      case DatabaseType.Vertica     => new VerticaMetadataHandler(jdbcSource)
      case DatabaseType.GenericJdbc => createHandlerByJdbcUrl(jdbcSource)
      case _                        => throw BadRequestError(s"database ${jdbcSource.databaseType} is not yet supported")
    }
  }

  /**
    * check jdbc url start with and create corresponding handler
    */
  private def createHandlerByJdbcUrl(jdbcSource: JdbcSource): SourceMetadataHandler = {
    String.valueOf(jdbcSource.jdbcUrl).trim match {
      case url if url.startsWith("jdbc:postgresql") => new PostgresMetadataHandler(jdbcSource)
      case url if url.startsWith("jdbc:oracle")     => new OracleMetadataHandler(jdbcSource)
      case url if url.startsWith("jdbc:sqlserver")  => new SqlServerMetadataHandler(jdbcSource)
      case url if url.startsWith("jdbc:vertica")    => new VerticaMetadataHandler(jdbcSource)
      case url if url.startsWith("jdbc:redshift")   => new RedshiftMetadataHandler(jdbcSource)
      case url if url.startsWith("jdbc:mysql")      => new MySqlMetadataHandler(jdbcSource)
      case _                                        => new GenericJdbcMetadataHandler(jdbcSource)
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
