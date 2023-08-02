import { DataSource } from './DataSource';
import { DataSourceType } from '@core/clickhouse-config';
import { SourceId } from '@core/common/domain';

export class VerticaSource extends DataSource {
  className: DataSourceType = DataSourceType.Vertica;
  displayName = 'Vertica';
  host: string;
  port: string;
  username: string;
  password: string;
  catalog: string;
  isLoadBalance: boolean;
  properties: Record<string, string>;

  constructor(
    id: SourceId,
    createdAt: number,
    updatedAt: number,
    host: string,
    port: string,
    username: string,
    password: string,
    catalog: string,
    isLoadBalance: boolean,
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
    this.catalog = catalog;
    this.isLoadBalance = isLoadBalance;
  }

  static fromObject(obj: any): VerticaSource {
    return new VerticaSource(
      obj.id,
      obj.createdAt || obj['created_at'],
      obj.updatedAt || obj['updated_at'],
      obj.host,
      obj.port,
      obj.username,
      obj.password,
      obj.catalog,
      obj.isLoadBalance || obj['is_load_balance'] || false,
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
      properties: this.properties,
      catalog: this.catalog,
      is_load_balance: this.isLoadBalance
    };
  }

  static default(): VerticaSource {
    return new VerticaSource(VerticaSource.DEFAULT_ID, -1, -1, '', '', '', '', '', false, {});
  }
}
