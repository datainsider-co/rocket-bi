import { DataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/DataSourceFormRender';
import { BigQueryDataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/BigQueryDataSourceFormRender';
import { GoogleAnalyticsSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/GoogleAnalyticsSourceFormRender';
import { JdbcUrlSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/JdbcUrlSourceFormRender';
import { MongoDBDataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/MongoDBDataSourceFormRender';
import { MsSqlDataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/MsSqlDataSourceFormRender';
import { MySqlDataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/MySqlDataSourceFormRender';
import { OracleDataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/OracleDataSourceFormRender';
import { PostgreSqlDataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/PostgreSqlDataSourceFormRender';
import { RedshiftDataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/RedshiftDataSourceFormRender';
import { S3SourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/S3SourceFormRender';
import { ShopifySourceFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/SourceFormRender/ShopifySourceFormRender';
import { MongoDBSourceInfo, S3SourceInfo } from '@core/DataIngestion';
import { BigQuerySourceInfoV2 } from '@core/DataIngestion/Domain/DataSource/BigQuerySourceInfoV2';
import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { GoogleAnalyticsSourceInfo } from '@core/DataIngestion/Domain/DataSource/GoogleAnalyticsSourceInfo';
import { JdbcUrlSourceInfo } from '@core/DataIngestion/Domain/DataSource/JdbcUrlSourceInfo';
import { MSSqlSourceInfo } from '@core/DataIngestion/Domain/DataSource/MSSqlSourceInfo';
import { MySqlSourceInfo } from '@core/DataIngestion/Domain/DataSource/MySqlSourceInfo';
import { OracleSourceInfo } from '@core/DataIngestion/Domain/DataSource/OracleSourceInfo';
import { RedshiftSourceInfo } from '@core/DataIngestion/Domain/DataSource/RedshiftSourceInfo';
import { ShopifySourceInfo } from '@core/DataIngestion/Domain/DataSource/ShopifySourceInfo';
import { UnsupportedException } from '@core/domain/Exception/UnsupportedException';

export class DataSourceFormFactory {
  createRender(dataSource: DataSourceInfo): DataSourceFormRender {
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
      case DataSourceType.GoogleAnalytics:
        return new GoogleAnalyticsSourceFormRender(dataSource as GoogleAnalyticsSourceInfo);
      case DataSourceType.MongoDB: {
        return new MongoDBDataSourceFormRender(dataSource as MongoDBSourceInfo);
      }
      case DataSourceType.GenericJdbc:
        return new JdbcUrlSourceFormRender(dataSource as JdbcUrlSourceInfo);
      case DataSourceType.Shopify:
        return new ShopifySourceFormRender(dataSource as ShopifySourceInfo);
      case DataSourceType.S3:
        return new S3SourceFormRender(dataSource as S3SourceInfo);
      default:
        throw new UnsupportedException(`Unsupported data source type ${dataSource.sourceType}`);
    }
  }
}
