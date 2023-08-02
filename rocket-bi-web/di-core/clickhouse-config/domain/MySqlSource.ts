import { DataSource } from './DataSource';
import { DataSourceType } from '@core/clickhouse-config';
import { SourceId } from '@core/common/domain';

export class MySQLSource extends DataSource {
  className: DataSourceType = DataSourceType.MySQL;
  displayName = 'MySQL';
  host: string;
  port: string;
  username: string;
  password: string;
  properties: Record<string, string>;

  constructor(
    id: SourceId,
    createdAt: number,
    updatedAt: number,
    host: string,
    port: string,
    username: string,
    password: string,
    properties: Record<string, string>,
    createdBy?: string,
    updatedBy?: string
  ) {
    super(id, createdAt, updatedAt, createdBy, updatedBy);
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.properties = properties;
  }

  static fromObject(obj: any): MySQLSource {
    return new MySQLSource(
      obj.id,
      obj.createdAt || obj['created_at'],
      obj.updatedAt || obj['updated_at'],
      obj.host,
      obj.port,
      obj.username,
      obj.password,
      obj.properties,
      obj.createdBy || obj['created_by'],
      obj.updatedBy || obj['updated_by']
    );
  }

  toJson(): Record<string, any> {
    return {
      ...super.toJson(),
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      properties: this.properties
    };
  }

  static default(): MySQLSource {
    return new MySQLSource(MySQLSource.DEFAULT_ID, -1, -1, '', '', '', '', {});
  }
}
