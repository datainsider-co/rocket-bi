import { MySqlSourceInfo } from './MySqlSourceInfo';
import { OracleSourceInfo } from './OracleSourceInfo';
import { MSSqlSourceInfo } from './MSSqlSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import {
  DataSources,
  FacebookAdsSourceInfo,
  GoogleAdsSourceInfo,
  JdbcSource,
  MongoDBSource,
  MongoDBSourceInfo,
  S3Source,
  S3SourceInfo,
  TiktokSourceInfo
} from '@core/data-ingestion';
import { SourceId } from '@core/common/domain';
import { RedshiftSourceInfo } from '@core/data-ingestion/domain/data-source/RedshiftSourceInfo';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { BigQuerySourceInfo } from '@core/data-ingestion/domain/data-source/BigQuerySourceInfo';
import { PostgreSqlSourceInfo } from '@core/data-ingestion/domain/data-source/PostgreSqlSourceInfo';
import { GoogleSheetSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSheetSourceInfo';
import { GoogleCredentialSource } from '@core/data-ingestion/domain/response/GoogleCredentialSource';
import { Log } from '@core/utils';
import { BigQuerySourceInfoV2 } from '@core/data-ingestion/domain/data-source/BigQuerySourceInfoV2';
import { GoogleServiceAccountSource } from '@core/data-ingestion/domain/response/GoogleServiceAccountSource';
import { UnsupportedSourceInfo } from '@core/data-ingestion/domain/data-source/UnsupportedSourceInfo';
import { JdbcUrlSourceInfo } from '@core/data-ingestion/domain/data-source/JdbcUrlSourceInfo';
import { ShopifySourceInfo } from '@core/data-ingestion/domain/data-source/ShopifySourceInfo';
import { ShopifySource } from '@core/data-ingestion/domain/response/ShopifySource';
import { GA4SourceInfo } from '@core/data-ingestion/domain/data-source/GA4SourceInfo';
import { GA4Source } from '@core/data-ingestion/domain/response/GA4Source';
import { GASource } from '@core/data-ingestion/domain/response/GASource';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';
import { PalexySourceInfo } from '@core/data-ingestion/domain/data-source/PalexySourceInfo';
import { GoogleSearchConsoleSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSearchConsoleSourceInfo';

export abstract class DataSourceInfo {
  static readonly DEFAULT_ID = -1;
  abstract className: DataSources;
  abstract sourceType: DataSourceType;
  abstract id: SourceId;
  abstract orgId: string;
  abstract lastModify: number;

  static fromObject(obj: any): DataSourceInfo {
    switch (obj.sourceType) {
      case DataSourceType.MySql:
        return MySqlSourceInfo.fromObject(obj);
      case DataSourceType.Oracle:
        return OracleSourceInfo.fromObject(obj);
      case DataSourceType.MSSql:
        return MSSqlSourceInfo.fromObject(obj);
      case DataSourceType.BigQueryV2:
        return BigQuerySourceInfoV2.fromObject(obj);
      case DataSourceType.GA4:
        return GA4SourceInfo.fromObject(obj);
      case DataSourceType.GA:
        return GASourceInfo.fromObject(obj);
      case DataSourceType.BigQuery:
        return BigQuerySourceInfo.fromObject(obj);
      case DataSourceType.Redshift:
        return RedshiftSourceInfo.fromObject(obj);
      case DataSourceType.PostgreSql:
        return PostgreSqlSourceInfo.fromObject(obj);
      case DataSourceType.GoogleSheet:
        return GoogleSheetSourceInfo.fromObject(obj);
      case DataSourceType.MongoDB:
        return MongoDBSourceInfo.fromObject(obj);
      case DataSourceType.GenericJdbc:
        return JdbcUrlSourceInfo.fromObject(obj);
      case DataSourceType.Shopify:
        return ShopifySourceInfo.fromObject(obj);
      case DataSourceType.S3:
        return S3SourceInfo.fromObject(obj);
      case DataSourceType.GoogleAds:
        return GoogleAdsSourceInfo.fromObject(obj);
      case DataSourceType.Facebook:
        return FacebookAdsSourceInfo.fromObject(obj);
      case DataSourceType.Tiktok:
        return TiktokSourceInfo.fromObject(obj);
      case DataSourceType.Palexy:
        return PalexySourceInfo.fromObject(obj);
      case DataSourceType.GoogleSearchConsole:
        return GoogleSearchConsoleSourceInfo.fromObject(obj);
      default:
        return UnsupportedSourceInfo.fromObject(obj);
    }
  }

  static fromDataSource(obj: DataSource): DataSourceInfo {
    // Log.debug("DataSourceInfo::fromDataSource::obj::", obj)
    switch (obj.className) {
      case DataSources.JdbcSource:
        return this.fromJdbcSource(obj as JdbcSource);
      case DataSources.MongoDbSource:
        return MongoDBSourceInfo.fromJdbcSource(obj as MongoDBSource);
      case DataSources.GoogleSheetSource:
        return this.fromGoogleCredentialSource(obj as GoogleCredentialSource);
      case DataSources.GoogleServiceAccountSource:
        return BigQuerySourceInfoV2.fromGoogleServiceAccountSource(obj as GoogleServiceAccountSource);
      case DataSources.ShopifySource:
        return ShopifySourceInfo.fromShopifySource(obj as ShopifySource);
      case DataSources.S3Source:
        return S3SourceInfo.fromS3Source(obj as S3Source);
      case DataSources.GA4Source:
        return GA4SourceInfo.fromGA4Source(obj as GA4Source);
      case DataSources.GASource:
        return GASourceInfo.fromGASource(obj as GASource);
      case DataSources.GoogleAdsSource:
        return GoogleAdsSourceInfo.fromObject(obj);
      case DataSources.FacebookAds:
        return FacebookAdsSourceInfo.fromObject(obj);
      case DataSources.TiktokAds:
        return TiktokSourceInfo.fromObject(obj);
      case DataSources.Palexy:
        return PalexySourceInfo.fromObject(obj);
      case DataSources.GoogleSearchConsole: {
        const source = GoogleSearchConsoleSourceInfo.fromObject(obj);
        Log.debug('DataSourceInfo::fromDataSource::obj::', source);
        return source;
      }
      default:
        return UnsupportedSourceInfo.fromObject(obj);
    }
  }

  static fromJdbcSource(obj: JdbcSource): DataSourceInfo {
    switch (obj.databaseType) {
      case DataSourceType.MySql:
        return MySqlSourceInfo.fromJdbcSource(obj);
      case DataSourceType.MSSql:
        return MSSqlSourceInfo.fromJdbcSource(obj);
      case DataSourceType.Oracle:
        return OracleSourceInfo.fromJdbcSource(obj);
      case DataSourceType.Redshift:
        return RedshiftSourceInfo.fromJdbcSource(obj);
      case DataSourceType.BigQuery:
        return BigQuerySourceInfo.fromJdbcSource(obj);
      case DataSourceType.PostgreSql:
        return PostgreSqlSourceInfo.fromJdbcSource(obj);
      case DataSourceType.GenericJdbc:
        return JdbcUrlSourceInfo.fromJdbcSource(obj);
      default:
        return UnsupportedSourceInfo.fromObject(obj);
    }
  }

  static fromGoogleCredentialSource(obj: GoogleCredentialSource): DataSourceInfo {
    Log.debug('DataSourceInfo::fromGoogleCredentialSource::obj::', GoogleSheetSourceInfo.fromDataSource(obj));
    switch (obj.databaseType) {
      //no data source with type google sheet
      case DataSourceType.GoogleSheet:
        return GoogleSheetSourceInfo.fromDataSource(obj);
      default:
        throw new UnsupportedException(`Unsupported google database type ${obj.databaseType}`);
    }
  }

  static default(type: DataSourceType): DataSourceInfo {
    return DataSourceInfo.fromObject({ sourceType: type as DataSourceType, id: DataSourceInfo.DEFAULT_ID });
  }

  static dataSourceIcon(type: DataSourceType): string {
    switch (type) {
      case DataSourceType.MySql:
        return 'ic_my_sql_small.png';
      case DataSourceType.MSSql:
        return 'ic_sql_server_small.png';
      case DataSourceType.Oracle:
        return 'ic_oracle_small.png';
      case DataSourceType.Redshift:
        return 'ic_redshift_small.png';
      case DataSourceType.BigQueryV2:
        return 'ic_big_query_small.png';
      case DataSourceType.PostgreSql:
        return 'ic_postgre_sql_small.png';
      case DataSourceType.MongoDB:
        return 'ic_mongo_small.png';
      case DataSourceType.GenericJdbc:
        return 'ic_generic_jdbc_small.png';
      case DataSourceType.Shopify:
        return 'ic_shopify_small.png';
      case DataSourceType.S3:
        return 'ic_s3_small.png';
      case DataSourceType.GA4:
        return 'ic_ga_4_small.svg';
      case DataSourceType.GA:
        return 'ic_ga_small.png';
      case DataSourceType.GoogleAds:
        return 'ic_gg_ads_small.png';
      case DataSourceType.Facebook:
        return 'ic_fb_ads_small.svg';
      case DataSourceType.Tiktok:
        return 'ic_tiktok_ads_small.svg';
      case DataSourceType.Palexy:
        return 'ic_palexy_small.svg';
      case DataSourceType.GoogleSearchConsole:
        return 'ic_google_search_console_small.svg';
      default:
        return 'ic_default.svg';
    }
  }

  abstract toDataSource(): DataSource;

  abstract getDisplayName(): string;
}
