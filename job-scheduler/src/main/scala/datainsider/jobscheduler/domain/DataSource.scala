package datainsider.jobscheduler.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonIgnore, JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.jobscheduler.domain.DataSourceType.DataSourceType
import datainsider.jobscheduler.domain.DatabaseType.DatabaseType
import datainsider.jobscheduler.domain.Ids.SourceId
import datainsider.jobscheduler.domain.source.{FacebookAdsSource, Ga4Source, GoogleSheetSource, TikTokAdsSource, TrackingSource}
import datainsider.jobscheduler.util.JsonUtils

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JdbcSource], name = "jdbc_source"),
    new Type(value = classOf[GoogleServiceAccountSource], name = "gg_service_account_source"),
    new Type(value = classOf[FBCredentialSource], name = "facebook_ads_source"),
    new Type(value = classOf[GoogleAdsSource], name = "google_ads_source"),
    new Type(value = classOf[MongoSource], name = "mongo_db_source"),
    new Type(value = classOf[AmazonS3Source], name = "amazon_s3"),
    new Type(value = classOf[SolanaSource], name = "solana_db_source"),
    new Type(value = classOf[ShopifySource], name = "shopify_source"),
    new Type(value = classOf[Ga4Source], name = "ga4_source"),
    new Type(value = classOf[GoogleSheetSource], name = "google_sheet_source"),
    new Type(value = classOf[TrackingSource], name = "tracking_source"),
    new Type(value = classOf[FacebookAdsSource], name = "facebook_ads_source"),
    new Type(value = classOf[TikTokAdsSource], name = "tik_tok_ads_source")

  )
)
trait DataSource {

  def getId: SourceId

  def getCreatorId: String

  def getLastModify: Long

  @JsonIgnore def getName: String

  @JsonIgnore def getType: DataSourceType

  @JsonIgnore def getConfig: Map[String, Any]
}

case class JdbcSource(
    orgId: Long,
    id: Long = 0,
    @NotEmpty displayName: String,
    @JsonScalaEnumeration(classOf[DatabaseTypeRef]) databaseType: DatabaseType,
    @NotEmpty jdbcUrl: String,
    @NotEmpty username: String,
    password: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Jdbc

  /** *
    *
    * @return config of this source to be pass to JobWorker, data is in form of key value pair, key values are hardcoded
    */
  override def getConfig: Map[String, Any] = {
    Map("database_type" -> databaseType.toString, "jdbc_url" -> jdbcUrl, "username" -> username, "password" -> password)
  }

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}

object DataSourceType extends Enumeration {
  type DataSourceType = Value
  val Jdbc: DataSourceType = Value("Jdbc")
  val GoogleAds: DataSourceType = Value("GoogleAds")
  val Service: DataSourceType = Value("Service")
  val Ga: DataSourceType = Value("Google_Analytics")
  val FaceBookAds: DataSourceType = Value("FacebookAds")
  val File: DataSourceType = Value("File")
  val Hubspot: DataSourceType = Value("hubspot")
  val GoogleTokenCredential: DataSourceType = Value("GoogleTokenCredential")
  val GoogleServiceAccountCredential: DataSourceType = Value("GoogleServiceAccountCredential")
  val GoogleSheet: DataSourceType = Value("GoogleSheet")
  val MongoDb: DataSourceType = Value("mongoDb")
  val AmazonS3: DataSourceType = Value("AmazonS3")
  val Solana: DataSourceType = Value("Solana")
  val Other: DataSourceType = Value("Others")
  val Shopify: DataSourceType = Value("Shopify")
  val Ga4: DataSourceType = Value("Ga4")
  val TrackingSource: DataSourceType = Value("TrackingSource")
  val FaceBookAdsSource: DataSourceType = Value("FacebookAdsSource")
  val TikTokAdsSource:DataSourceType= Value("TikTokAdsSource")
}

class DataSourceTypeRef extends TypeReference[DataSourceType.type]

object DatabaseType extends Enumeration {
  type DatabaseType = Value
  val MySql: DatabaseType = Value("MySql")
  val Oracle: DatabaseType = Value("Oracle")
  val SqlServer: DatabaseType = Value("SqlServer")
  val Postgres: DatabaseType = Value("Postgres")
  val BigQuery: DatabaseType = Value("BigQuery")
  val Redshift: DatabaseType = Value("Redshift")
  val GoogleSheet: DatabaseType = Value("GoogleSheet")
  val GenericJdbc: DatabaseType = Value("GenericJdbc")
  val Vertica: DatabaseType = Value("Vertica")
  val Other: DatabaseType = Value("Others")
}

class DatabaseTypeRef extends TypeReference[DatabaseType.type]

case class GoogleServiceAccountSource(
    orgId: Long,
    id: SourceId,
    displayName: String,
    credential: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleServiceAccountCredential

  override def getConfig: Map[String, Any] =
    Map(
      "credential" -> credential
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}

case class FBCredentialSource(
    orgId: Long,
    id: SourceId,
    displayName: String,
    accessToken: String,
    appSecret: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.FaceBookAds

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken,
      "app_secret" -> appSecret
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}

case class MongoSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    host: String,
    port: Option[String],
    username: String,
    password: String,
    tlsConfiguration: Option[TLSConfiguration] = None,
    connectionUri: Option[String] = None,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.MongoDb

  override def getConfig: Map[String, Any] =
    Map(
      "host" -> host,
      "port" -> port,
      "username" -> username,
      "password" -> password,
      "tls_configuration" -> JsonUtils.toJson(tlsConfiguration),
      "connection_uri" -> connectionUri
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}

case class SolanaSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    entrypoint: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Solana

  override def getConfig: Map[String, Any] = Map("entrypoint" -> entrypoint)

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}

case class ShopifySource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    apiUrl: String,
    accessToken: String,
    apiVersion: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Shopify

  override def getConfig: Map[String, Any] =
    Map("api_url" -> apiUrl, "access_token" -> accessToken, "api_version" -> apiVersion)

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}

case class AmazonS3Source(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis(),
    awsAccessKeyId: String,
    awsSecretAccessKey: String,
    region: String
) extends DataSource {
  override def getId: SourceId = id

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.AmazonS3

  override def getConfig: Map[String, Any] = {
    Map("aws_access_key_id" -> awsAccessKeyId, "aws_secret_access_key" -> awsSecretAccessKey, "region" -> region)
  }
}

case class GoogleAdsSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis(),
    refreshToken: String
) extends DataSource {
  override def getId: SourceId = id

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleAds

  override def getConfig: Map[String, Any] = Map("refresh_token" -> refreshToken)

}
