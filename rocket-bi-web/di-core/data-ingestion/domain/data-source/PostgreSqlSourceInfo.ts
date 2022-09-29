import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { JdbcSource } from '@core/data-ingestion/domain/response/JdbcSource';
import { SourceId } from '@core/common/domain';
import { ListUtils } from '@/utils';

export class PostgreSqlSourceInfo implements DataSourceInfo {
  className = DataSources.JdbcSource;
  sourceType = DataSourceType.PostgreSql;
  orgId: string;
  id: SourceId;
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
    const [port, databaseName] = url.split(host + ':')[1].split('/') ?? ['', ''];
    const postgreSqlSourceInfo = new PostgreSqlSourceInfo(
      obj.id,
      obj.orgId,
      obj.displayName,
      host,
      port,
      databaseName,
      obj.username,
      obj.password,
      obj.lastModify
    );
    return postgreSqlSourceInfo;
  }

  static fromObject(obj: any): PostgreSqlSourceInfo {
    return new PostgreSqlSourceInfo(
      obj.id,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName,
      obj.host,
      obj.port,
      obj.databaseName,
      obj.username,
      obj.password,
      obj.lastModify
    );
  }

  toDataSource(): DataSource {
    const jdbcUrl = `jdbc:postgresql://${this.host}:${this.port}/${this.databaseName}`;
    const request = new JdbcSource(this.id, this.orgId, this.sourceType, this.displayName, jdbcUrl, this.username, this.password, this.lastModify);
    return request;
  }
}
