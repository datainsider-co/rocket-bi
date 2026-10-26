import { BaseConnection } from './BaseConnection';
import { ConnectionType } from './ConnectionType';

/** Backend `ClickhouseConnection`. */
export class ClickhouseConnection extends BaseConnection {
  readonly className = ConnectionType.Clickhouse;
  readonly displayName = 'ClickHouse';

  host = '';
  httpPort = 0;
  tcpPort = 0;
  username = '';
  password = '';
  useSsl = false;
  /** Empty means no cluster; sent as absent, since the server reads `""` as a cluster named "". */
  clusterName = '';

  constructor(json?: unknown) {
    super({
      host: ['host', String],
      httpPort: ['http_port', Number],
      tcpPort: ['tcp_port', Number],
      username: ['username', String],
      password: ['password', String],
      useSsl: ['use_ssl', Boolean],
      clusterName: ['cluster_name', String, true]
    });
    this.parse(json);
  }

  override toJson(): Record<string, unknown> {
    return { ...super.toJson(), cluster_name: this.clusterName || undefined };
  }
}
