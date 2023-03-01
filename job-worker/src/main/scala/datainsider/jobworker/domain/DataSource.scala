package datainsider.jobworker.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.jobworker.domain.DataSourceType.DataSourceType
import datainsider.jobworker.domain.DatabaseType.DatabaseType
import datainsider.jobworker.domain.Ids.{DummyId, SourceId}
import datainsider.jobworker.domain.source.{FacebookAdsSource, Ga4Source, TikTokAdsSource}
import datainsider.jobworker.util.ShopifyUtils

import java.net.URL

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JdbcSource], name = "jdbc_source"),
    new Type(value = classOf[GoogleServiceAccountSource], name = "gg_service_account_source"),
    new Type(value = classOf[MongoSource], name = "mongo_db_source"),
    new Type(value = classOf[SolanaSource], name = "solana_db_source"),
    new Type(value = classOf[AmazonS3Source], name = "amazon_s3"),
    new Type(value = classOf[ShopifySource], name = "shopify_source"),
    new Type(value = classOf[Ga4Source], name = "ga4_source"),
    new Type(value = classOf[GoogleAdsSource], name = "google_ads_source"),
    new Type(value = classOf[FacebookAdsSource], name = "facebook_ads_source"),
    new Type(value = classOf[TikTokAdsSource], name = "tik_tok_ads_source")
  )
)
trait DataSource {

  def getId: SourceId

  def getName: String

  def getType: DataSourceType

  def getConfig: Map[String, Any]
}

case class JdbcSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    @JsonScalaEnumeration(classOf[DatabaseTypeRef]) databaseType: DatabaseType,
    jdbcUrl: String,
    username: String,
    password: String
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Jdbc

  override def getConfig: Map[String, Any] = {
    Map("database_type" -> databaseType.toString, "jdbc_url" -> jdbcUrl, "username" -> username, "password" -> password)
  }

}

object DataSourceType extends Enumeration {
  type DataSourceType = Value
  val Jdbc: DataSourceType = Value("Jdbc")
  val Service: DataSourceType = Value("Service")
  val File: DataSourceType = Value("File")
  val BigQuery: DataSourceType = Value("BigQuery")
  val Hubspot: DataSourceType = Value("hubspot")
  val MongoDb: DataSourceType = Value("mongoDb")
  val Solana: DataSourceType = Value("Solana")
  val GoogleTokenCredential: DataSourceType = Value("GoogleTokenCredential")
  val Kafka: DataSourceType = Value("Kafka")
  val AmazonS3: DataSourceType = Value("AmazonS3")
  val Other: DataSourceType = Value("Others")
  val Shopify: DataSourceType = Value("Shopify")
  val Ga4: DataSourceType = Value("Ga4")
  val FacebookAds: DataSourceType = Value("FacebookAds")
  val GoogleAds: DataSourceType = Value("GoogleAds")
  val TikTokAds: DataSourceType = Value("TikTokAds")
}

class DataSourceTypeRef extends TypeReference[DataSourceType.type]

object DatabaseType extends Enumeration {
  type DatabaseType = Value
  val MySql: DatabaseType = Value("MySql")
  val Oracle: DatabaseType = Value("Oracle")
  val SqlServer: DatabaseType = Value("SqlServer")
  val Clickhouse: DatabaseType = Value("Clickhouse")
  val BigQuery: DatabaseType = Value("BigQuery")
  val Redshift: DatabaseType = Value("Redshift")
  val Postgres: DatabaseType = Value("Postgres")
  val GoogleSheet: DatabaseType = Value("GoogleSheet")
  val GenericJdbc: DatabaseType = Value("GenericJdbc")
  val Vertica: DatabaseType = Value("Vertica")
  val Other: DatabaseType = Value("Others")
}

class DatabaseTypeRef extends TypeReference[DatabaseType.type]

case class GoogleServiceAccountSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    credential: String
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleTokenCredential

  override def getConfig: Map[String, Any] =
    Map(
      "credential" -> credential
    )
}

case class HubspotSource(
    id: SourceId,
    displayName: String,
    apiKey: String
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Hubspot

  override def getConfig: Map[String, Any] = Map()
}

case class MongoSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    host: String,
    port: Option[String],
    username: String,
    password: String,
    tlsConfiguration: Option[TLSConfiguration],
    connectionUri: Option[String]
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.MongoDb

  override def getConfig: Map[String, Any] = Map()
}

case class SolanaSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    entrypoint: String
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Solana

  override def getConfig: Map[String, Any] = Map()
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

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.AmazonS3

  override def getConfig: Map[String, Any] = {
    Map("aws_access_key_id" -> awsAccessKeyId, "aws_secret_access_key" -> awsSecretAccessKey)
  }
}

case class ShopifySource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    apiUrl: String,
    accessToken: String,
    apiVersion: String
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Shopify

  override def getConfig: Map[String, Any] = Map()

  def getAdminUrl(): String = ShopifyUtils.getAdminUrl(apiUrl)
}

case class GoogleAdsSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String,
    lastModify: Long,
    refreshToken: String
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleAds

  override def getConfig: Map[String, Any] = Map("refresh_token" -> refreshToken)
}

case class MockDataSource() extends DataSource {
  override def getId: SourceId = DummyId

  override def getName: String = "MockDataSource"

  override def getType: DataSourceType = DataSourceType.Other

  override def getConfig: Map[String, Any] = Map.empty
}
