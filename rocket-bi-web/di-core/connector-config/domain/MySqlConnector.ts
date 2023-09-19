import { Connector } from './Connector';
import { ConnectorType, SSHConfig } from '@core/connector-config';
import { SourceId } from '@core/common/domain';

export class MySqlConnector extends Connector {
  className: ConnectorType = ConnectorType.MySQL;
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
    tunnelConfig?: SSHConfig,
    createdBy?: string,
    updatedBy?: string
  ) {
    super(id, tunnelConfig, createdAt, updatedAt, createdBy, updatedBy);
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.properties = properties;
  }

  static fromObject(obj: any): MySqlConnector {
    const tunnelConfig = obj.tunnelConfig ? SSHConfig.fromObject(obj.tunnelConfig) : void 0;
    return new MySqlConnector(
      obj.id,
      obj.createdAt || obj['created_at'],
      obj.updatedAt || obj['updated_at'],
      obj.host,
      obj.port,
      obj.username,
      obj.password,
      obj.properties,
      tunnelConfig,
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

  static default(): MySqlConnector {
    return new MySqlConnector(MySqlConnector.DEFAULT_ID, -1, -1, '', '', '', '', {});
  }
}
