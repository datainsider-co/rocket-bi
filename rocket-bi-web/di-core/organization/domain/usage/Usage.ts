import { UsageClassName } from './UsageClassName';
import { CdpUsage } from '@core/organization/domain/usage/CdpUsage';
import { DIException } from '@core/common/domain/exception/DIException';
import { GoogleOAuthUsage } from '@core/organization';
import { LogoAndCompanyNameUsage } from '@core/organization/domain/usage/LogoAndCompanyNameUsage';
import { PrimarySupportUsage } from '@core/organization/domain/usage/PrimarySupportUsage';
import { MySqlIngestionUsage } from '@core/organization/domain/usage/MySqlIngestionUsage';
import { MongoIngestionUsage } from '@core/organization/domain/usage/MongoIngestionUsage';
import { GA3IngestionUsage } from '@core/organization/domain/usage/GA3IngestionUsage';
import { GoogleSheetIngestionUsage } from '@core/organization/domain/usage/GoogleSheetIngestionUsage';
import { GoogleAdsIngestionUsage } from '@core/organization/domain/usage/GoogleAdsIngestionUsage';
import { GA4IngestionUsage } from '@core/organization/domain/usage/GA4IngestionUsage';
import { PostgreIngestionUsage } from '@core/organization/domain/usage/PostgreIngestionUsage';
import { BigQueryIngestionUsage } from '@core/organization/domain/usage/BigQueryIngestionUsage';
import { RedshiftIngestionUsage } from '@core/organization/domain/usage/RedshiftIngestionUsage';
import { MsSqlIngestionUsage } from '@core/organization/domain/usage/MsSqlIngestionUsage';
import { OracleIngestionUsage } from '@core/organization/domain/usage/OracleIngestionUsage';
import { GenericJdbcIngestionUsage } from '@core/organization/domain/usage/GenericJdbcIngestionUsage';
import { ShopifyIngestionUsage } from '@core/organization/domain/usage/ShopifyIngestionUsage';
import { S3IngestionUsage } from '@core/organization/domain/usage/S3IngestionUsage';

export abstract class Usage {
  abstract className: UsageClassName;

  static fromObject<T extends Usage>(obj: any): T {
    const className = obj.className as UsageClassName;
    switch (className) {
      case UsageClassName.CdpUsage:
        return CdpUsage.fromObject(obj) as T;
      case UsageClassName.LakeUsage:
        return CdpUsage.fromObject(obj) as T;
      case UsageClassName.GoogleOAuthUsage:
        return GoogleOAuthUsage.fromObject(obj) as T;

      case UsageClassName.LogoAndCompanyNameUsage:
        return LogoAndCompanyNameUsage.fromObject(obj) as T;
      case UsageClassName.PrimarySupportUsage:
        return PrimarySupportUsage.fromObject(obj) as T;
      case UsageClassName.MySqlIngestionUsage:
        return MySqlIngestionUsage.fromObject(obj) as T;
      case UsageClassName.MongoIngestionUsage:
        return MongoIngestionUsage.fromObject(obj) as T;
      case UsageClassName.GenericJdbcIngestionUsage:
        return GenericJdbcIngestionUsage.fromObject(obj) as T;
      case UsageClassName.OracleIngestionUsage:
        return OracleIngestionUsage.fromObject(obj) as T;
      case UsageClassName.MsSqlIngestionUsage:
        return MsSqlIngestionUsage.fromObject(obj) as T;
      case UsageClassName.RedshiftIngestionUsage:
        return RedshiftIngestionUsage.fromObject(obj) as T;
      case UsageClassName.BigQueryIngestionUsage:
        return BigQueryIngestionUsage.fromObject(obj) as T;
      case UsageClassName.PostgreIngestionUsage:
        return PostgreIngestionUsage.fromObject(obj) as T;
      case UsageClassName.GA3IngestionUsage:
        return GA3IngestionUsage.fromObject(obj) as T;
      case UsageClassName.GA4IngestionUsage:
        return GA4IngestionUsage.fromObject(obj) as T;
      case UsageClassName.GoogleAdsIngestionUsage:
        return GoogleAdsIngestionUsage.fromObject(obj) as T;
      case UsageClassName.GoogleSheetIngestionUsage:
        return GoogleSheetIngestionUsage.fromObject(obj) as T;
      case UsageClassName.ShopifyIngestionUsage:
        return ShopifyIngestionUsage.fromObject(obj) as T;
      case UsageClassName.S3IngestionUsage:
        return S3IngestionUsage.fromObject(obj) as T;
      default:
        throw new DIException(`unsupported class name: ${className}`);
    }
  }
}
