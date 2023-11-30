package co.datainsider.jobworker.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object JobType extends Enumeration {
  type JobType = Value
  val Jdbc: JobType.Value = Value("Jdbc")
  val GenericJdbc: JobType.Value = Value("GenericJdbc")
  val S3: JobType.Value = Value("Amazon_S3")
  val GoogleSheets: JobType.Value = Value("Google_Sheets")
  val Ga: JobType.Value = Value("Google_Analytics")
  val FacebookAds: JobType.Value = Value("FacebookAds")
  val Bigquery: JobType.Value = Value("Bigquery")
  val Hubspot: JobType.Value = Value("Hubspot")
  val MongoDb: JobType.Value = Value("MongoDb")
  val CoinMarketCap: JobType.Value = Value("CoinMarketCap")
  val Other: JobType.Value = Value("Others")
  val Solana: JobType.Value = Value("Solana")
  val GoogleAds: JobType.Value = Value("GoogleAds")
  val Shopify: JobType.Value = Value("Shopify")
  val Ga4: JobType.Value = Value("Ga4")
  val TikTokAds: JobType.Value = Value("TikTokAds")
  val Shopee: JobType.Value = Value("Shopee")
  val Lazada: JobType.Value = Value("Lazada")
  val Palexy: JobType.Value = Value("Palexy")
  val GoogleSearchConsole: JobType.Value = Value("GoogleSearchConsole")
  val Mixpanel: JobType.Value = Value("Mixpanel")
}

class JobTypeRef extends TypeReference[JobType.type]
