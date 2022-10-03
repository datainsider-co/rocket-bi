import { ItemData } from '@/shared';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';

export const ALL_DATASOURCE: ItemData[] = [
  {
    title: 'Generic JDBC',
    src: 'ic_generic_jdbc.png',
    type: DataSourceType.GenericJdbc
  },
  {
    title: 'MySql',
    src: 'ic_mysql.png',
    type: DataSourceType.MySql
  },
  {
    title: 'Oracle',
    src: 'ic_oracle.png',
    type: DataSourceType.Oracle
  },
  {
    title: 'MSSql',
    src: 'ic_sql_server.png',
    type: DataSourceType.MSSql
  },
  {
    title: 'MongoDB',
    src: 'ic_mongo.png',
    type: DataSourceType.MongoDB
  },
  {
    title: 'Redshift',
    src: 'ic_redshift.png',
    type: DataSourceType.Redshift
  },
  {
    title: 'BigQuery',
    src: 'ic_big_query.png',
    type: DataSourceType.BigQueryV2
  },
  {
    title: 'PostgreSql',
    src: 'ic_postgresql.png',
    type: DataSourceType.PostgreSql
  },
  {
    title: 'Google Analytics',
    src: 'ic_ga.png',
    type: DataSourceType.GoogleAnalytics
  },
  {
    title: 'Google Analytics 4',
    src: 'ic_ga.png',
    type: DataSourceType.GA4
  },
  {
    title: 'Csv',
    src: 'ic_csv.png',
    type: 'csv'
  },
  {
    title: 'Google Sheets',
    src: 'ic_google_sheet.png',
    type: 'sheet'
  },
  {
    title: 'Shopify',
    src: 'ic_shopify.png',
    type: DataSourceType.Shopify
  },
  {
    title: 'S3',
    src: 'ic_s3.png',
    type: DataSourceType.S3
  }
  // {
  //   title: 'iOS',
  //   src: 'ic_ios.png',
  //   type: DataSourceType.IOS
  // },
  // {
  //   title: 'Android',
  //   src: 'ic_android.png',
  //   type: DataSourceType.Android
  // },
  // {
  //   title: 'ReactNative',
  //   src: 'ic_flutter.png',
  //   type: DataSourceType.ReactNative
  // },
  // {
  //   title: 'Flutter',
  //   src: 'ic_flutter.png',
  //   type: DataSourceType.Flutter
  // },
  // {
  //   title: 'JavaScript',
  //   src: 'ic_js.png',
  //   type: DataSourceType.JavaScript
  // }
];
