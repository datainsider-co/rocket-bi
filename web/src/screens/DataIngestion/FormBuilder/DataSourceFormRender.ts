import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';

export abstract class DataSourceFormRender {
  abstract renderForm(h: any): any;
  abstract createDataSourceInfo(): DataSourceInfo;
}
