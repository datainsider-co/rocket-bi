import { Connector } from './Connector';
import { ConnectorType, SSHConfig } from '@core/connector-config';
import { SourceId } from '@core/common/domain';

export class PostgreSQLConnector extends Connector {
  className: ConnectorType = ConnectorType.PostgreSQL;
  displayName = 'PostgreSQL';
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  properties: Record<string, string>;

  constructor(
    id: SourceId,
    host: string,
    port: string,
    username: string,
    password: string,
    database: string,
    properties: Record<string, string>,
    tunnelConfig?: SSHConfig,
    createdAt?: number,
    updatedAt?: number,
    createdBy?: string,
    updatedBy?: string
  ) {
    super(id, tunnelConfig, createdAt, updatedAt, createdBy, updatedBy);
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.database = database;
    this.properties = properties;
  }

  static fromObject(obj: any): PostgreSQLConnector {
    const tunnelConfig = obj.tunnelConfig ? SSHConfig.fromObject(obj.tunnelConfig) : void 0;

    return new PostgreSQLConnector(
      obj.id,
      obj.host,
      obj.port,
      obj.username,
      obj.password,
      obj.database,
      obj.properties,
      tunnelConfig,
      obj.createdAt || obj['created_at'],
      obj.updatedAt || obj['updated_at'],
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
      database: this.database,
      properties: this.properties
    };
  }

  static default(): PostgreSQLConnector {
    return new PostgreSQLConnector(PostgreSQLConnector.DEFAULT_ID, '', '', '', '', '', {});
  }
}
