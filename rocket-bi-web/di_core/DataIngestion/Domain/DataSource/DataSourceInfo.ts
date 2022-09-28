import { MySqlSourceInfo } from './MySqlSourceInfo';
import { OracleSourceInfo } from './OracleSourceInfo';
import { MSSqlSourceInfo } from './MSSqlSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSources, JdbcSource, MongoDBSource, MongoDBSourceInfo, S3Source, S3SourceInfo } from '@core/DataIngestion';
import { SourceId } from '@core/domain';
import { RedshiftSourceInfo } from '@core/DataIngestion/Domain/DataSource/RedshiftSourceInfo';
import { UnsupportedException } from '@core/domain/Exception/UnsupportedException';
import { BigQuerySourceInfo } from '@core/DataIngestion/Domain/DataSource/BigQuerySourceInfo';
import { PostgreSqlSourceInfo } from '@core/DataIngestion/Domain/DataSource/PostgreSqlSourceInfo';
import { GoogleSheetSourceInfo } from '@core/DataIngestion/Domain/DataSource/GoogleSheetSourceInfo';
import { GoogleAnalyticsSourceInfo } from '@core/DataIngestion/Domain/DataSource/GoogleAnalyticsSourceInfo';
import { GoogleCredentialSource } from '@core/DataIngestion/Domain/Response/GoogleCredentialSource';
import { Log } from '@core/utils';
import { BigQuerySourceInfoV2 } from '@core/DataIngestion/Domain/DataSource/BigQuerySourceInfoV2';
import { GoogleServiceAccountSource } from '@core/DataIngestion/Domain/Response/GoogleServiceAccountSource';
import { UnsupportedSourceInfo } from '@core/DataIngestion/Domain/DataSource/UnsupportedSourceInfo';
import { JdbcUrlSourceInfo } from '@core/DataIngestion/Domain/DataSource/JdbcUrlSourceInfo';
import { ShopifySourceInfo } from '@core/DataIngestion/Domain/DataSource/ShopifySourceInfo';
import { ShopifySource } from '@core/DataIngestion/Domain/Response/ShopifySource';

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
      case DataSourceType.BigQuery:
        return BigQuerySourceInfo.fromObject(obj);
      case DataSourceType.Redshift:
        return RedshiftSourceInfo.fromObject(obj);
      case DataSourceType.PostgreSql:
        return PostgreSqlSourceInfo.fromObject(obj);
      case DataSourceType.GoogleSheet:
        return GoogleSheetSourceInfo.fromObject(obj);
      case DataSourceType.GoogleAnalytics:
        return GoogleAnalyticsSourceInfo.fromObject(obj);
      case DataSourceType.MongoDB:
        return MongoDBSourceInfo.fromObject(obj);
      case DataSourceType.GenericJdbc:
        return JdbcUrlSourceInfo.fromObject(obj);
      case DataSourceType.Shopify:
        return ShopifySourceInfo.fromObject(obj);
      case DataSourceType.S3:
        return S3SourceInfo.fromObject(obj);
      default:
        return UnsupportedSourceInfo.fromObject(obj);
    }
  }

  static fromDataSource(obj: DataSource): DataSourceInfo {
    switch (obj.className) {
      case DataSources.JdbcSource:
        return this.fromJdbcSource(obj as JdbcSource);
      case DataSources.MongoDbSource:
        return MongoDBSourceInfo.fromJdbcSource(obj as MongoDBSource);
      case DataSources.GoogleSheetSource:
        return this.fromGoogleCredentialSource(obj as GoogleCredentialSource);
      case DataSources.GoogleAnalyticsSource:
        return GoogleAnalyticsSourceInfo.fromGoogleCredentialSource(obj as GoogleCredentialSource);
      case DataSources.GoogleServiceAccountSource:
        return BigQuerySourceInfoV2.fromGoogleServiceAccountSource(obj as GoogleServiceAccountSource);
      case DataSources.ShopifySource:
        return ShopifySourceInfo.fromShopifySource(obj as ShopifySource);
      case DataSources.S3Source:
        return S3SourceInfo.fromS3Source(obj as S3Source);
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
      default:
        return 'ic_default.svg';
    }
  }

  abstract toDataSource(): DataSource;
  abstract getDisplayName(): string;
}
