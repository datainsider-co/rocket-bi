import { LogoAndCompanyNameUsage } from '@core/organization/domain/usage/LogoAndCompanyNameUsage';

export enum UsageClassName {
  CdpUsage = 'cdp_usage',
  LakeUsage = 'lake_usage',
  DataCookUsage = 'data_cook_usage',
  IngestionUsage = 'ingestion_usage',
  StreamingUsage = 'streaming_usage',
  UserActivityUsage = 'user_activity_usage',
  BillingUsage = 'billing_usage',
  ClickhouseConfigUsage = 'clickhouse_config_usage',
  UserManagementUsage = 'user_management_usage',
  ApiKeyUsage = 'api_key_usage',
  TableRelationshipUsage = 'table_relationship_usage',
  GoogleOAuthUsage = 'google_oauth_usage',

  LogoAndCompanyNameUsage = 'logo_and_company_name_usage',
  PrimarySupportUsage = 'primary_support_usage',
  DashboardPasswordUsage = 'dashboard_password_usage',
  MySqlIngestionUsage = 'mysql_ingestion_usage',
  MongoIngestionUsage = 'mongo_ingestion_usage',
  GenericJdbcIngestionUsage = 'generic_jdbc_ingestion_usage',
  OracleIngestionUsage = 'oracle_ingestion_usage',
  MsSqlIngestionUsage = 'mssql_ingestion_usage',
  RedshiftIngestionUsage = 'redshift_ingestion_usage',
  BigQueryIngestionUsage = 'bigquery_ingestion_usage',
  PostgreIngestionUsage = 'postgre_ingestion_usage',
  GA3IngestionUsage = 'ga3_ingestion_usage',
  GA4IngestionUsage = 'ga4_ingestion_usage',
  GoogleAdsIngestionUsage = 'google_ads_ingestion_usage',
  GoogleSheetIngestionUsage = 'google_sheet_ingestion_usage',
  ShopifyIngestionUsage = 'shopify_ingestion_usage',
  S3IngestionUsage = 's3_ingestion_usage'
}
