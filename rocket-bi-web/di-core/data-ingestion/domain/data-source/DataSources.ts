/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:08 PM
 */

export enum DataSources {
  JdbcSource = 'jdbc_source',
  MongoDbSource = 'mongo_db_source',
  GoogleSheetSource = 'google_token_credential_source',
  GoogleAnalyticsSource = 'gg_credential_source',
  GoogleAdsSource = 'google_ads_source',
  GA4Source = 'ga4_source',
  GoogleServiceAccountSource = 'gg_service_account_source',
  UnsupportedSource = 'unsupported_source',
  ShopifySource = 'shopify_source',
  S3Source = 'amazon_s3'
}
