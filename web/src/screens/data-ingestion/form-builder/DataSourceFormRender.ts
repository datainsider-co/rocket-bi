import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';

export abstract class DataSourceFormRender {
  abstract renderForm(h: any): any;
  abstract createDataSourceInfo(): DataSourceInfo;
  abstract validSource(source: DataSourceInfo): void;
}
