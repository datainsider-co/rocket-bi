package co.datainsider.jobworker.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object DataSourceType extends Enumeration {
  type DataSourceType = Value
  val Jdbc: DataSourceType = Value("Jdbc")
  val Service: DataSourceType = Value("Service")
  val File: DataSourceType = Value("File")
  val BigQuery: DataSourceType = Value("BigQuery")
  val Hubspot: DataSourceType = Value("Hubspot")
  val MongoDb: DataSourceType = Value("mongoDb")
  val Solana: DataSourceType = Value("Solana")
  val GoogleTokenCredential: DataSourceType = Value("GoogleTokenCredential")
  val Kafka: DataSourceType = Value("Kafka")
  val AmazonS3: DataSourceType = Value("AmazonS3")
  val Other: DataSourceType = Value("Others")
  val Shopify: DataSourceType = Value("Shopify")
  val Ga: DataSourceType = Value("Ga")
  val Ga4: DataSourceType = Value("Ga4")
  val FacebookAds: DataSourceType = Value("FacebookAds")
  val GoogleAds: DataSourceType = Value("GoogleAds")
  val TikTokAds: DataSourceType = Value("TikTokAds")
  val Shopee: DataSourceType = Value("Shopee")
  val Lazada: DataSourceType = Value("Lazada")
  val Palexy: DataSourceType = Value("Palexy")
  val GoogleSearchConsole: DataSourceType = Value("GoogleSourceConsole")
  val Mixpanel: DataSourceType = Value("Mixpanel")
}

class DataSourceTypeRef extends TypeReference[DataSourceType.type]
