package co.datainsider.jobscheduler.domain.source

import com.fasterxml.jackson.core.`type`.TypeReference

object DataSourceType extends Enumeration {
  type DataSourceType = Value
  val Jdbc: DataSourceType = Value("Jdbc")
  val GoogleAds: DataSourceType = Value("GoogleAds")
  val Service: DataSourceType = Value("Service")
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
  val Ga: DataSourceType = Value("Ga")
  val Ga4: DataSourceType = Value("Ga4")
  val TrackingSource: DataSourceType = Value("TrackingSource")
  val FaceBookAdsSource: DataSourceType = Value("FacebookAdsSource")
  val TikTokAdsSource: DataSourceType = Value("TikTokAdsSource")
  val Shopee: DataSourceType = Value("Shopee")
  val Lazada: DataSourceType = Value("Lazada")
  val Palexy: DataSourceType = Value("Palexy")
}

class DataSourceTypeRef extends TypeReference[DataSourceType.type]
