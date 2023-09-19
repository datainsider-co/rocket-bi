package co.datainsider.jobscheduler.domain

import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
import co.datainsider.jobscheduler.domain.source._
import co.datainsider.jobscheduler.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode

import scala.util.Try

trait DataSourceFactory {
  def build(
      dataSourceType: DataSourceType,
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource
}

case class DataSourceFactoryImpl() extends DataSourceFactory {

  override def build(
      dataSourceType: DataSourceType,
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    dataSourceType match {
      case DataSourceType.Jdbc => buildJdbcSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.GoogleServiceAccountCredential =>
        buildGoogleServiceAccountCredentialSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.GoogleSheet    => buildGoogleSheetSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.FaceBookAds    => buildFbAdsSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.MongoDb        => buildMongoSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.Solana         => buildSolanaSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.AmazonS3       => buildAmazonS3Source(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.Shopify        => buildShopifySource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.Ga4            => buildGa4Source(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.Ga             => buildGaSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.TrackingSource => buildTrackingSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.GoogleAds      => buildGoogleAdsSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.FaceBookAdsSource =>
        buildFacebookAdsSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.TikTokAdsSource => buildTikTokAdsSource(orgId, id, creatorId, displayName, lastModify, config)
      case DataSourceType.Shopee          => buildShopeeSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.Lazada          => buildLazadaSource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.Palexy          => buildPalexySource(orgId, id, displayName, creatorId, lastModify, config)
      case DataSourceType.GoogleSearchConsole =>
        buildGoogleSearchConsoleSource(orgId, id, displayName, creatorId, lastModify, config)
      case _ => throw new UnsupportedOperationException(s"No support for dataSourceType=$dataSourceType, id=$id")
    }
  }

  private def buildTikTokAdsSource(
      orgId: Long,
      id: Long,
      creatorId: String,
      displayName: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    TikTokAdsSource(
      id = id,
      orgId = orgId,
      creatorId = creatorId,
      displayName = displayName,
      accessToken = config.get("access_token").textValue(),
      lastModify = lastModify
    )
  }
  private def buildFacebookAdsSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    FacebookAdsSource(orgId, id, displayName, config.get("access_token").textValue(), creatorId, lastModify)
  }

  private def buildGoogleAdsSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    GoogleAdsSource(
      creatorId = creatorId,
      displayName = displayName,
      id = id,
      lastModify = lastModify,
      refreshToken = config.get("refresh_token").textValue()
    )
  }
  private def buildTrackingSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    TrackingSource(
      orgId = orgId,
      creatorId = creatorId,
      displayName = displayName,
      id = id,
      lastModify = lastModify,
      apiKey = config.get("api_key").textValue(),
      sourceType = TrackingSourceType.withName(config.get("source_type").textValue())
    )
  }
  private def buildGoogleSheetSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    GoogleSheetSource(
      orgId = orgId,
      creatorId = creatorId,
      displayName = displayName,
      accessToken = config.get("access_token").textValue(),
      refreshToken = config.get("refresh_token").textValue(),
      id = id,
      lastModify = lastModify
    )
  }

  private def buildJdbcSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    JdbcSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      databaseType = DatabaseType.withName(config.get("database_type").textValue()),
      jdbcUrl = config.get("jdbc_url").textValue(),
      username = config.get("username").textValue(),
      password = config.get("password").textValue(),
      creatorId = creatorId,
      lastModify = lastModify
    )
  }

  private def buildGoogleServiceAccountCredentialSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    GoogleServiceAccountSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      credential = config.get("credential").textValue(),
      creatorId = creatorId,
      lastModify = lastModify
    )
  }

  private def buildFbAdsSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    FBCredentialSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      accessToken = config.get("access_token").textValue(),
      appSecret = config.get("app_secret").textValue(),
      creatorId = creatorId,
      lastModify = lastModify
    )
  }

  private def buildMongoSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    val port = if (config.has("port")) {
      Some(config.get("port").textValue())
    } else {
      None
    }

    val tlsConfiguration: Option[TLSConfiguration] =
      if (config.has("tls_configuration")) {
        Some(JsonUtils.fromJson[TLSConfiguration](config.get("tls_configuration").textValue()))
      } else {
        None
      }

    val connectionUri: Option[String] = if (config.has("connection_uri")) {
      Some(config.get("connection_uri").textValue())
    } else {
      None
    }

    MongoSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      host = config.get("host").textValue(),
      port = port,
      username = config.get("username").textValue(),
      password = config.get("password").textValue(),
      tlsConfiguration = tlsConfiguration,
      connectionUri = connectionUri,
      creatorId = creatorId,
      lastModify = lastModify
    )
  }

  private def buildSolanaSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {

    SolanaSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      entrypoint = config.get("entrypoint").textValue()
    )
  }

  private def buildShopifySource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {

    ShopifySource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      apiUrl = config.at("/api_url").asText(),
      accessToken = config.at("/access_token").asText(),
      apiVersion = config.at("/api_version").asText()
    )
  }

  private def buildGa4Source(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {

    Ga4Source(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      accessToken = config.at("/access_token").asText(),
      refreshToken = config.at("/refresh_token").asText()
    )
  }

  private def buildGaSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {

    GaSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      accessToken = config.at("/access_token").asText(),
      refreshToken = config.at("/refresh_token").asText()
    )
  }

  private def buildAmazonS3Source(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    AmazonS3Source(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      awsAccessKeyId = config.get("aws_access_key_id").textValue(),
      awsSecretAccessKey = config.get("aws_secret_access_key").textValue(),
      region = config.get("region").textValue()
    )
  }

  private def buildShopeeSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    val shopIds: Set[String] =
      Try(JsonUtils.fromJson[Set[String]](config.at("/shop_ids").asText())).getOrElse(Set.empty)

    ShopeeSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      accessToken = config.at("/access_token").asText(),
      refreshToken = config.at("/refresh_token").asText(),
      shopIds = shopIds
    )
  }

  private def buildLazadaSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {

    LazadaSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      accessToken = config.at("/access_token").asText(),
      refreshToken = config.at("/refresh_token").asText(),
      expiresInSec = config.at("/expires_in_sec").asInt(),
      refreshExpiresIn = config.at("/refresh_expires_in").asInt(),
      country = config.at("/country").asText(),
      accountId = config.at("/account_id").asText(),
      account = config.at("/account").asText(),
      accountPlatform = config.at("/account_platform").asText(),
      countryUserInfo = config.at("/country_user_info").asText()
    )
  }

  private def buildPalexySource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ): DataSource = {
    PalexySource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      apiKey = config.at("/api_key").asText()
    )
  }

  private def buildGoogleSearchConsoleSource(
      orgId: Long,
      id: Long,
      displayName: String,
      creatorId: String,
      lastModify: Long,
      config: JsonNode
  ) = {
    GoogleSearchConsoleSource(
      orgId = orgId,
      id = id,
      displayName = displayName,
      creatorId = creatorId,
      lastModify = lastModify,
      accessToken = config.at("/access_token").asText(),
      refreshToken = config.at("/refresh_token").asText()
    )
  }
}
