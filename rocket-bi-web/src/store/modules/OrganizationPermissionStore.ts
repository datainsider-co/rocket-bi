/* eslint-disable @typescript-eslint/no-use-before-define */
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';

import { DataCookUsage, GoogleOAuthUsage, Licence, OrganizationPermissionService, TableRelationShipUsage, Usage, UsageClassName } from '@core/organization';
import { Log } from '@core/utils';
import { Di } from '@core/common/modules';
import { LogoAndCompanyNameUsage } from '@core/organization/domain/usage/LogoAndCompanyNameUsage';
import { DashboardPasswordUsage } from '@core/organization/domain/usage/DashboardPasswordUsage';
import { MongoIngestionUsage } from '@core/organization/domain/usage/MongoIngestionUsage';
import { MySqlIngestionUsage } from '@core/organization/domain/usage/MySqlIngestionUsage';
import { PrimarySupportUsage } from '@core/organization/domain/usage/PrimarySupportUsage';
import { GenericJdbcIngestionUsage } from '@core/organization/domain/usage/GenericJdbcIngestionUsage';
import { OracleIngestionUsage } from '@core/organization/domain/usage/OracleIngestionUsage';
import { MsSqlIngestionUsage } from '@core/organization/domain/usage/MsSqlIngestionUsage';
import { RedshiftIngestionUsage } from '@core/organization/domain/usage/RedshiftIngestionUsage';
import { PostgreIngestionUsage } from '@core/organization/domain/usage/PostgreIngestionUsage';
import { BigQueryIngestionUsage } from '@core/organization/domain/usage/BigQueryIngestionUsage';
import { GA3IngestionUsage } from '@core/organization/domain/usage/GA3IngestionUsage';
import { GA4IngestionUsage } from '@core/organization/domain/usage/GA4IngestionUsage';
import { GoogleAdsIngestionUsage } from '@core/organization/domain/usage/GoogleAdsIngestionUsage';
import { GoogleSheetIngestionUsage } from '@core/organization/domain/usage/GoogleSheetIngestionUsage';
import { ShopifyIngestionUsage } from '@core/organization/domain/usage/ShopifyIngestionUsage';
import { S3IngestionUsage } from '@core/organization/domain/usage/S3IngestionUsage';
import { DataSourceType } from '@core/data-ingestion';
import { ApiKeyUsage } from '@core/organization/domain/usage/ApiKeyUsage';
import { UserManagementUsage } from '@core/organization/domain/usage/UserManagementUsage';

@Module({ store, name: Stores.OrganizationPermission, dynamic: true, namespaced: true })
export class OrganizationPermissionStore extends VuexModule {
  private licence: Licence = Licence.community();
  private usageAllowedAsMap: Map<string, boolean> = new Map();

  private listRequiredUsages: Usage[] = [
    new GoogleOAuthUsage(),
    new LogoAndCompanyNameUsage(),
    new DashboardPasswordUsage(),
    new MongoIngestionUsage(),
    new MySqlIngestionUsage(),
    new PrimarySupportUsage(),
    new GenericJdbcIngestionUsage(),
    new OracleIngestionUsage(),
    new MsSqlIngestionUsage(),
    new RedshiftIngestionUsage(),
    new PostgreIngestionUsage(),
    new BigQueryIngestionUsage(),
    new GA3IngestionUsage(),
    new GA4IngestionUsage(),
    new GoogleAdsIngestionUsage(),
    new GoogleSheetIngestionUsage(),
    new ShopifyIngestionUsage(),
    new S3IngestionUsage(),
    new DataCookUsage(),
    new TableRelationShipUsage(),
    new ApiKeyUsage(),
    new UserManagementUsage(),
    new GoogleOAuthUsage()
  ];

  get isEnabledCDP(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.CdpUsage) ?? false;
  }

  get isEnabledLake(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.LakeUsage) ?? false;
  }

  get isEnabledIngestion(): boolean {
    return true;
  }

  get isEnabledStreaming(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.StreamingUsage) ?? false;
  }

  get isEnabledUserActivity(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.UserActivityUsage) ?? false;
  }

  get isEnabledBilling(): boolean {
    return !window.appConfig.VUE_APP_IS_DISABLE_BILLING ?? false;
  }

  get isEnabledClickhouseConfig(): boolean {
    return !window.appConfig.VUE_APP_IS_DISABLE_CLICKHOUSE_CONFIG ?? false;
  }

  get isEnabledDataCook(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.DataCookUsage) ?? false;
  }

  get isEnabledUserManagement(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.UserManagementUsage) ?? false;
  }

  get isEnabledApiKey(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.ApiKeyUsage) ?? false;
  }

  get isEnableTableRelationship(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.TableRelationshipUsage) ?? false;
  }

  get isEnableGoogleOAuthSetting() {
    return this.usageAllowedAsMap.get(UsageClassName.GoogleOAuthUsage) ?? false;
  }

  get isEnableLogoAndCompanyNameSetting() {
    return this.usageAllowedAsMap.get(UsageClassName.LogoAndCompanyNameUsage) ?? false;
  }

  get isEnablePrimarySupport() {
    return this.usageAllowedAsMap.get(UsageClassName.PrimarySupportUsage) ?? false;
  }

  get isEnableDashboardPassword() {
    return this.usageAllowedAsMap.get(UsageClassName.DashboardPasswordUsage) ?? false;
  }

  get isEnableMongoIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.MongoIngestionUsage) ?? false;
  }

  get isEnableMySqlIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.MySqlIngestionUsage) ?? false;
  }

  get isEnableGenericJdbcIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.GenericJdbcIngestionUsage) ?? false;
  }

  get isEnableOracleIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.OracleIngestionUsage) ?? false;
  }

  get isEnableMsSqlIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.MsSqlIngestionUsage) ?? false;
  }

  get isEnableRedshiftIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.RedshiftIngestionUsage) ?? false;
  }

  get isEnableBigQueryIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.BigQueryIngestionUsage) ?? false;
  }

  get isEnablePostgreIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.PostgreIngestionUsage) ?? false;
  }

  get isEnableGA3Ingestion() {
    return this.usageAllowedAsMap.get(UsageClassName.GA3IngestionUsage) ?? false;
  }

  get isEnableGA4Ingestion() {
    return this.usageAllowedAsMap.get(UsageClassName.GA4IngestionUsage) ?? false;
  }

  get isEnableGoogleAdsIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.GoogleAdsIngestionUsage) ?? false;
  }

  get isEnableGoogleSheetIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.GoogleSheetIngestionUsage) ?? false;
  }

  get isEnableShopifyIngestion() {
    return this.usageAllowedAsMap.get(UsageClassName.ShopifyIngestionUsage) ?? false;
  }

  get isEnableS3Ingestion() {
    return this.usageAllowedAsMap.get(UsageClassName.S3IngestionUsage) ?? false;
  }

  get isEnableDataSourceType(): (sourceType: DataSourceType) => boolean {
    return sourceType => {
      switch (sourceType) {
        case DataSourceType.MongoDB:
          return this.isEnableMongoIngestion;
        case DataSourceType.MySql:
          return this.isEnableMySqlIngestion;
        case DataSourceType.GenericJdbc:
          return this.isEnableGenericJdbcIngestion;
        case DataSourceType.MSSql:
          return this.isEnableMsSqlIngestion;
        case DataSourceType.Oracle:
          return this.isEnableOracleIngestion;
        case DataSourceType.Redshift:
          return this.isEnableRedshiftIngestion;
        case DataSourceType.BigQueryV2:
          return this.isEnableBigQueryIngestion;
        case DataSourceType.PostgreSql:
          return this.isEnablePostgreIngestion;
        case DataSourceType.GA:
          return this.isEnableGA3Ingestion;
        case DataSourceType.GA4:
          return this.isEnableGA4Ingestion;
        case DataSourceType.GoogleAds:
          return this.isEnableGoogleAdsIngestion;
        case DataSourceType.GoogleSheet:
          return this.isEnableGoogleSheetIngestion;
        case DataSourceType.Shopify:
          return this.isEnableShopifyIngestion;
        case DataSourceType.S3:
          return this.isEnableS3Ingestion;
        case 'csv' as DataSourceType:
          return true;
        default:
          return false;
      }
    };
  }

  @Mutation
  protected setLicence(licence: Licence) {
    this.licence = licence;
  }

  @Mutation
  setUsageAllowed(usageAllowedAsMap: Map<UsageClassName, boolean>) {
    this.usageAllowedAsMap = usageAllowedAsMap;
  }
  @Action
  async init() {
    try {
      Log.debug('OrganizationStore::init::listRequiredUsages::', this.listRequiredUsages);
      const usageAllowedAsMap: Map<UsageClassName, boolean> = await Di.get(OrganizationPermissionService).isAllow(...this.listRequiredUsages);
      this.setUsageAllowed(usageAllowedAsMap);
    } catch (ex) {
      Log.error('OrganizationPermissionStore::init', ex);
    }
  }
}

const OrganizationPermissionModule = getModule(OrganizationPermissionStore, store);
export default OrganizationPermissionModule;
