import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { JdbcSource } from '@core/DataIngestion/Domain/Response/JdbcSource';
import { SourceId } from '@core/domain';

export class BigQuerySourceInfo implements DataSourceInfo {
  className = DataSources.JdbcSource;
  sourceType = DataSourceType.BigQuery;
  orgId: string;
  id: SourceId;
  displayName: string;
  host: string;
  port: string;
  username: string;
  password: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, host: string, port: string, username: string, password: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.lastModify = lastModify;
  }

  static fromJdbcSource(obj: JdbcSource): DataSourceInfo {
    const bigQuerySourceInfo = new BigQuerySourceInfo(obj.id, obj.orgId, obj.displayName, 'bigquery', 'bigquery', obj.username, obj.password, obj.lastModify);
    return bigQuerySourceInfo;
  }

  static fromObject(obj: any): BigQuerySourceInfo {
    return new BigQuerySourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.host ?? '',
      obj.port ?? '',
      obj.username ?? '',
      obj.password ?? '',
      obj.lastModify ?? 0
    );
  }

  toDataSource(): DataSource {
    const request = new JdbcSource(this.id, this.orgId, this.sourceType, this.displayName, 'bigquery', 'bigquery', this.password, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
