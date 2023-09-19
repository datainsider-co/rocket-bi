import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { BigQueryDataSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/BigQueryDataSourceFormRender';
import { GoogleAnalyticsSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/GoogleAnalyticsSourceFormRender';
import { JdbcUrlSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/JdbcUrlSourceFormRender';
import { MongoDBDataSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/MongoDBDataSourceFormRender';
import { MsSqlDataSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/MsSqlDataSourceFormRender';
import { MySqlDataSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/MySqlDataSourceFormRender';
import { OracleDataSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/OracleDataSourceFormRender';
import { PostgreSqlDataSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/PostgreSqlDataSourceFormRender';
import { RedshiftDataSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/RedshiftDataSourceFormRender';
import { S3SourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/S3SourceFormRender';
import { ShopifySourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/ShopifySourceFormRender';
import { DataSourceType, FacebookAdsSourceInfo, GoogleAdsSourceInfo, MongoDBSourceInfo, S3SourceInfo, TiktokSourceInfo } from '@core/data-ingestion';
import { BigQuerySourceInfoV2 } from '@core/data-ingestion/domain/data-source/BigQuerySourceInfoV2';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { JdbcUrlSourceInfo } from '@core/data-ingestion/domain/data-source/JdbcUrlSourceInfo';
import { MSSqlSourceInfo } from '@core/data-ingestion/domain/data-source/MSSqlSourceInfo';
import { MySqlSourceInfo } from '@core/data-ingestion/domain/data-source/MySqlSourceInfo';
import { OracleSourceInfo } from '@core/data-ingestion/domain/data-source/OracleSourceInfo';
import { RedshiftSourceInfo } from '@core/data-ingestion/domain/data-source/RedshiftSourceInfo';
import { ShopifySourceInfo } from '@core/data-ingestion/domain/data-source/ShopifySourceInfo';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { GA4SourceInfo } from '@core/data-ingestion/domain/data-source/GA4SourceInfo';
import { Ga4SourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/Ga4SourceFormRender';
import { GoogleAdsSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/GoogleAdsSourceFormRender';
import { FacebookAdsSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/FacebookAdsSourceFormRender';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';
import { TiktokSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/TiktokSourceFormRender';
import { PalexySourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/PalexySourceFormRender';
import { PalexySourceInfo } from '@core/data-ingestion/domain/data-source/PalexySourceInfo';
import { GoogleSearchConsoleSourceFormRender } from '@/screens/data-ingestion/form-builder/render-impl/source-form-render/GoogleSearchConsoleSourceFormRender';
import { GoogleSearchConsoleSourceInfo } from '@core/data-ingestion/domain/data-source/GoogleSearchConsoleSourceInfo';

export class DataSourceFormFactory {
  createRender(dataSource: DataSourceInfo, onSubmit?: () => void): DataSourceFormRender {
    switch (dataSource.sourceType) {
      case DataSourceType.MSSql: {
        return new MsSqlDataSourceFormRender(dataSource as MSSqlSourceInfo);
      }
      case DataSourceType.MySql: {
        return new MySqlDataSourceFormRender(dataSource as MySqlSourceInfo);
      }
      case DataSourceType.Oracle: {
        return new OracleDataSourceFormRender(dataSource as OracleSourceInfo);
      }
      case DataSourceType.Redshift: {
        return new RedshiftDataSourceFormRender(dataSource as RedshiftSourceInfo);
      }
      // case DataSourceType.BigQuery:
      //   return new BigQueryDataSourceFormRender(dataSource as BigQuerySourceInfo);
      case DataSourceType.BigQueryV2:
        return new BigQueryDataSourceFormRender(dataSource as BigQuerySourceInfoV2);
      case DataSourceType.PostgreSql:
        return new PostgreSqlDataSourceFormRender(dataSource as RedshiftSourceInfo);
      case DataSourceType.GA:
        return new GoogleAnalyticsSourceFormRender(dataSource as GASourceInfo, onSubmit);
      case DataSourceType.GA4:
        return new Ga4SourceFormRender(dataSource as GA4SourceInfo, onSubmit);
      case DataSourceType.MongoDB: {
        return new MongoDBDataSourceFormRender(dataSource as MongoDBSourceInfo);
      }
      case DataSourceType.GenericJdbc:
        return new JdbcUrlSourceFormRender(dataSource as JdbcUrlSourceInfo);
      case DataSourceType.Shopify:
        return new ShopifySourceFormRender(dataSource as ShopifySourceInfo);
      case DataSourceType.S3:
        return new S3SourceFormRender(dataSource as S3SourceInfo);
      case DataSourceType.GoogleAds:
        return new GoogleAdsSourceFormRender(dataSource as GoogleAdsSourceInfo, onSubmit);
      case DataSourceType.Facebook:
        return new FacebookAdsSourceFormRender(dataSource as FacebookAdsSourceInfo, onSubmit);
      case DataSourceType.Tiktok:
        return new TiktokSourceFormRender(dataSource as TiktokSourceInfo, onSubmit);
      case DataSourceType.Palexy:
        return new PalexySourceFormRender(dataSource as PalexySourceInfo, onSubmit);
      case DataSourceType.GoogleSearchConsole:
        return new GoogleSearchConsoleSourceFormRender(dataSource as GoogleSearchConsoleSourceInfo, onSubmit);
      default:
        throw new UnsupportedException(`Unsupported data source type ${dataSource.sourceType}`);
    }
  }
}
