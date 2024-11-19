package co.datainsider.license.domain.permissions

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[CdpUsage], name = "cdp_usage"),
    new Type(value = classOf[LakeUsage], name = "lake_usage"),
    new Type(value = classOf[NumUsersUsage], name = "num_users_usage"),
    new Type(value = classOf[DataCookUsage], name = "data_cook_usage"),
    new Type(value = classOf[IngestionUsage], name = "ingestion_usage"),
    new Type(value = classOf[StreamingUsage], name = "streaming_usage"),
    new Type(value = classOf[UserActivityUsage], name = "user_activity_usage"),
    new Type(value = classOf[BillingUsage], name = "billing_usage"),
    new Type(value = classOf[ClickhouseConfigUsage], name = "clickhouse_config_usage"),
    new Type(value = classOf[UserManagementUsage], name = "user_management_usage"),
    new Type(value = classOf[ApiKeyUsage], name = "api_key_usage"),
    new Type(value = classOf[TableRelationshipUsage], name = "table_relationship_usage"),
    new Type(value = classOf[GoogleOAuthUsage], name = "google_oauth_usage"),
    new Type(value = classOf[LogoAndCompanyNameUsage], name = "logo_and_company_name_usage"),
    new Type(value = classOf[PrimarySupportUsage], name = "primary_support_usage"),
    new Type(value = classOf[DashboardPasswordUsage], name = "dashboard_password_usage"),
    new Type(value = classOf[MySqlIngestionUsage], name = "mysql_ingestion_usage"),
    new Type(value = classOf[MongoIngestionUsage], name = "mongo_ingestion_usage"),
    new Type(value = classOf[GenericJdbcIngestionUsage], name = "generic_jdbc_ingestion_usage"),
    new Type(value = classOf[OracleIngestionUsage], name = "oracle_ingestion_usage"),
    new Type(value = classOf[MsSqlIngestionUsage], name = "mssql_ingestion_usage"),
    new Type(value = classOf[RedshiftIngestionUsage], name = "redshift_ingestion_usage"),
    new Type(value = classOf[BigQueryIngestionUsage], name = "bigquery_ingestion_usage"),
    new Type(value = classOf[PostgreIngestionUsage], name = "postgre_ingestion_usage"),
    new Type(value = classOf[GA3IngestionUsage], name = "ga3_ingestion_usage"),
    new Type(value = classOf[GA4IngestionUsage], name = "ga4_ingestion_usage"),
    new Type(value = classOf[GoogleAdsIngestionUsage], name = "google_ads_ingestion_usage"),
    new Type(value = classOf[GoogleSheetIngestionUsage], name = "google_sheet_ingestion_usage"),
    new Type(value = classOf[ShopifyIngestionUsage], name = "shopify_ingestion_usage"),
    new Type(value = classOf[S3IngestionUsage], name = "s3_ingestion_usage"),
    new Type(value = classOf[NumEditorsUsage], name = "num_editors_usage"),
    new Type(value = classOf[NumViewersUsage], name = "num_viewers_usage"),
    new Type(value = classOf[SaasUsage], name = "saas_usage")
  )
)
abstract class Usage {
  val permissionKey: String
}

case class CdpUsage(permissionKey: String = PermissionKeys.Cdp) extends Usage
case class LakeUsage(permissionKey: String = PermissionKeys.Lake) extends Usage
case class NumUsersUsage(numUsers: Int, permissionKey: String = PermissionKeys.NumUsers) extends Usage
case class DataCookUsage(permissionKey: String = PermissionKeys.DataCook) extends Usage
case class IngestionUsage(permissionKey: String = PermissionKeys.Ingestion) extends Usage
case class StreamingUsage(permissionKey: String = PermissionKeys.Streaming) extends Usage
case class BillingUsage(permissionKey: String = PermissionKeys.Billing) extends Usage
case class ClickhouseConfigUsage(permissionKey: String = PermissionKeys.ClickhouseConfig) extends Usage
case class UserManagementUsage(permissionKey: String = PermissionKeys.UserManagement) extends Usage
case class ApiKeyUsage(permissionKey: String = PermissionKeys.ApiKey) extends Usage
case class UserActivityUsage(permissionKey: String = PermissionKeys.UserActivity) extends Usage
case class TableRelationshipUsage(permissionKey: String = PermissionKeys.TableRelationship) extends Usage
case class GoogleOAuthUsage(permissionKey: String = PermissionKeys.GoogleOAuth) extends Usage

case class LogoAndCompanyNameUsage(permissionKey: String = PermissionKeys.LogoAndCompanyName) extends Usage
case class PrimarySupportUsage(permissionKey: String = PermissionKeys.PrimarySupport) extends Usage
case class DashboardPasswordUsage(permissionKey: String = PermissionKeys.DashboardPassword) extends Usage
case class MySqlIngestionUsage(permissionKey: String = PermissionKeys.MySqlIngestion) extends Usage
case class MongoIngestionUsage(permissionKey: String = PermissionKeys.MongoIngestion) extends Usage

case class GenericJdbcIngestionUsage(permissionKey: String = PermissionKeys.GenericJdbcIngestion) extends Usage
case class OracleIngestionUsage(permissionKey: String = PermissionKeys.OracleIngestion) extends Usage
case class MsSqlIngestionUsage(permissionKey: String = PermissionKeys.MsSqlIngestion) extends Usage
case class RedshiftIngestionUsage(permissionKey: String = PermissionKeys.RedshiftIngestion) extends Usage
case class BigQueryIngestionUsage(permissionKey: String = PermissionKeys.BigQueryIngestion) extends Usage
case class PostgreIngestionUsage(permissionKey: String = PermissionKeys.PostgreIngestion) extends Usage
case class GA3IngestionUsage(permissionKey: String = PermissionKeys.GA3Ingestion) extends Usage
case class GA4IngestionUsage(permissionKey: String = PermissionKeys.GA4Ingestion) extends Usage
case class GoogleAdsIngestionUsage(permissionKey: String = PermissionKeys.GoogleAdsIngestion) extends Usage
case class GoogleSheetIngestionUsage(permissionKey: String = PermissionKeys.GoogleSheetIngestion) extends Usage
case class ShopifyIngestionUsage(permissionKey: String = PermissionKeys.ShopifyIngestion) extends Usage
case class S3IngestionUsage(permissionKey: String = PermissionKeys.S3Ingestion) extends Usage

case class NumEditorsUsage(editorsCount: Int, permissionKey: String = PermissionKeys.NumEditors) extends Usage
case class NumViewersUsage(viewersCount: Int, permissionKey: String = PermissionKeys.NumViewers) extends Usage

case class SaasUsage(permissionKey: String = PermissionKeys.Saas) extends Usage
