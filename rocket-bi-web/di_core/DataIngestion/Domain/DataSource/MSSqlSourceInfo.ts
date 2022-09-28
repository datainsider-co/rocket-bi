import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { JdbcSource } from '@core/DataIngestion/Domain/Response/JdbcSource';
import { SourceId } from '@core/domain';
import { ListUtils } from '@/utils';

export class MSSqlSourceInfo implements DataSourceInfo {
  className = DataSources.JdbcSource;
  sourceType = DataSourceType.MSSql;
  id: SourceId;
  orgId: string;
  displayName: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
  lastModify: number;

  constructor(
    id: SourceId,
    orgId: string,
    displayName: string,
    host: string,
    port: string,
    databaseName: string,
    username: string,
    password: string,
    lastModify: number
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.host = host;
    this.port = port;
    this.databaseName = databaseName;
    this.username = username;
    this.password = password;
    this.lastModify = lastModify;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  static fromJdbcSource(obj: JdbcSource): DataSourceInfo {
    const url = obj.jdbcUrl;
    const host = ListUtils.getLast(url.match('\\/\\/(.*/?):') as []) ?? '';
    const [port, databaseName] = url.split(host + ':')[1].split(';databaseName=') ?? ['', ''];
    const msSqlSourceInfo = new MSSqlSourceInfo(obj.id, obj.orgId, obj.displayName, host, port, databaseName, obj.username, obj.password, obj.lastModify);
    return msSqlSourceInfo;
  }

  static fromObject(obj: any): MSSqlSourceInfo {
    return new MSSqlSourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.host ?? '',
      obj.port ?? '',
      obj.databaseName ?? '',
      obj.username ?? '',
      obj.password ?? '',
      obj.lastModify ?? 0
    );
  }

  toDataSource(): DataSource {
    const jdbcUrl = `jdbc:sqlserver://${this.host}:${this.port};databaseName=${this.databaseName}`;
    const request = new JdbcSource(this.id, this.orgId, this.sourceType, this.displayName, jdbcUrl, this.username, this.password, this.lastModify);
    return request;
  }
}
