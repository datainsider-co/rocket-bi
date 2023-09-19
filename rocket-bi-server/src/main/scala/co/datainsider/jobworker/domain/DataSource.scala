package co.datainsider.jobworker.domain

import co.datainsider.jobworker.domain.source.{AmazonS3Source, FacebookAdsSource, Ga4Source, GaSource, GoogleAdsSource, GoogleSearchConsoleSource, GoogleServiceAccountSource, JdbcSource, LazadaSource, MongoSource, PalexySource, ShopeeSource, ShopifySource, SolanaSource, TikTokAdsSource}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import DataSourceType.DataSourceType
import Ids.SourceId

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
    new Type(value = classOf[GaSource], name = "ga_source"),
    new Type(value = classOf[Ga4Source], name = "ga4_source"),
    new Type(value = classOf[GoogleAdsSource], name = "google_ads_source"),
    new Type(value = classOf[FacebookAdsSource], name = "facebook_ads_source"),
    new Type(value = classOf[TikTokAdsSource], name = "tik_tok_ads_source"),
    new Type(value = classOf[ShopeeSource], name = "shopee_source"),
    new Type(value = classOf[LazadaSource], name = "lazada_source"),
    new Type(value = classOf[PalexySource], name = "palexy_source"),
    new Type(value = classOf[GoogleSearchConsoleSource], name = "google_search_console_source"),
  )
)
trait DataSource {

  def getId: SourceId

  def getName: String

  def getType: DataSourceType

  def getConfig: Map[String, Any]
}
