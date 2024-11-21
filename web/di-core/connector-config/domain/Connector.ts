import {
  BigqueryConnector,
  ClickhouseConnector,
  ConnectorType,
  MySqlConnector,
  PostgreSQLConnector,
  SSHConfig,
  UnknownConnnector,
  VerticaConnector,
  RedshiftConnector
} from '@core/connector-config';
import { Log } from '@core/utils';
import { SourceId } from '@core/common/domain';
import { StringUtils } from '@/utils';

export abstract class Connector {
  static readonly DEFAULT_ID = -2;

  abstract className: ConnectorType;
  abstract displayName: string;
  id: SourceId;
  tunnelConfig?: SSHConfig;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;

  protected constructor(id: SourceId, sshConfig?: SSHConfig, createdAt?: number, updatedAt?: number, createdBy?: string, updatedBy?: string) {
    this.id = id;
    this.tunnelConfig = sshConfig;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromObject(obj: any | Connector): Connector {
    switch (obj.className) {
      case ConnectorType.Clickhouse:
        return ClickhouseConnector.fromObject(obj);
      case ConnectorType.Bigquery:
        return BigqueryConnector.fromObject(obj);
      case ConnectorType.MySQL:
        return MySqlConnector.fromObject(obj);
      case ConnectorType.Vertica:
        return VerticaConnector.fromObject(obj);
      case ConnectorType.PostgreSQL:
        return PostgreSQLConnector.fromObject(obj);
      case ConnectorType.Redshift:
        return RedshiftConnector.fromObject(obj);
      default:
        Log.error('DataSource::fromObject::', obj);
        return UnknownConnnector.fromObject(obj);
      // throw new ClassNotFound(`Data source ${obj.className} is not supported!`);
    }
  }

  static default(type: ConnectorType): Connector {
    switch (type) {
      case ConnectorType.Clickhouse:
        return ClickhouseConnector.default();
      case ConnectorType.Bigquery:
        return BigqueryConnector.default();
      case ConnectorType.MySQL:
        return MySqlConnector.default();
      case ConnectorType.Vertica:
        return VerticaConnector.default();
      case ConnectorType.PostgreSQL:
        return PostgreSQLConnector.default();
      case ConnectorType.Redshift:
        return RedshiftConnector.default();
      default:
        return UnknownConnnector.default();
    }
  }

  toJson(): Record<string, any> {
    const haveTunnelConfig =
      this.tunnelConfig &&
      StringUtils.isNotEmpty(this.tunnelConfig.host) &&
      StringUtils.isNotEmpty(`${this.tunnelConfig.port}`) &&
      StringUtils.isNotEmpty(this.tunnelConfig.username);
    const tunnelConfig = haveTunnelConfig ? this.tunnelConfig?.toJson() : void 0;
    Log.debug('DataSource::toJson::tunnelConfig::', this, tunnelConfig, StringUtils.isNotEmpty(this.tunnelConfig?.port));
    return {
      class_name: this.className,
      id: this.id,
      // created_at: this.createdAt,
      // updated_at: this.updatedAt,
      tunnel_config: tunnelConfig,
      created_by: this.createdBy,
      updated_by: this.updatedBy
    };
  }

  get isCreating(): boolean {
    return this.id === Connector.DEFAULT_ID;
  }
}
