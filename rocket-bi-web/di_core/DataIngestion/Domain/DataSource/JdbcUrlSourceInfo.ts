import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { JdbcSource } from '@core/DataIngestion/Domain/Response/JdbcSource';
import { SourceId } from '@core/domain';

export class JdbcUrlSourceInfo implements DataSourceInfo {
  className = DataSources.JdbcSource;
  sourceType = DataSourceType.GenericJdbc;
  id: SourceId;
  orgId: string;
  displayName: string;
  jdbcUrl: string;
  username: string;
  password: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, jdbcUrl: string, username: string, password: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.jdbcUrl = jdbcUrl;
    this.username = username;
    this.password = password;
    this.lastModify = lastModify;
  }

  static fromJdbcSource(obj: JdbcSource): DataSourceInfo {
    const oracleSourceInfo = new JdbcUrlSourceInfo(obj.id, obj.orgId, obj.displayName, obj.jdbcUrl, obj.username, obj.password, obj.lastModify);
    return oracleSourceInfo;
  }

  static fromObject(obj: any): JdbcUrlSourceInfo {
    return new JdbcUrlSourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.jdbcUrl ?? '',
      obj.username ?? '',
      obj.password ?? '',
      obj.lastModify ?? 0
    );
  }

  toDataSource(): DataSource {
    const request = new JdbcSource(this.id, this.orgId, this.sourceType, this.displayName, this.jdbcUrl, this.username, this.password, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
