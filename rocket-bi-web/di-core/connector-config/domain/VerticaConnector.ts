import { Connector } from './Connector';
import { ConnectorType, SSHConfig } from '@core/connector-config';
import { SourceId } from '@core/common/domain';

export class VerticaConnector extends Connector {
  className: ConnectorType = ConnectorType.Vertica;
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
    this.catalog = catalog;
    this.isLoadBalance = isLoadBalance;
  }

  static fromObject(obj: any): VerticaConnector {
    const tunnelConfig = obj.tunnelConfig ? SSHConfig.fromObject(obj.tunnelConfig) : void 0;
    return new VerticaConnector(
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
      properties: this.properties,
      catalog: this.catalog,
      is_load_balance: this.isLoadBalance
    };
  }

  static default(): VerticaConnector {
    return new VerticaConnector(VerticaConnector.DEFAULT_ID, -1, -1, '', '', '', '', '', false, {});
  }
}
