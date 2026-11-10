import { BaseConnection } from './BaseConnection';
import { ConnectionType } from './ConnectionType';

/** Backend `PostgreSqlConnection`. It has no SSH tunnel: the server drops `tunnel_config`, so it is never sent. */
export class PostgreSqlConnection extends BaseConnection {
  readonly className = ConnectionType.PostgreSql;
  readonly displayName = 'PostgreSQL';

  host = '';
  port = 0;
  username = '';
  password = '';
  database = '';

  constructor(json?: unknown) {
    super({
      host: ['host', String],
      port: ['port', Number],
      username: ['username', String],
      password: ['password', String],
      database: ['database', String]
    });
    this.parse(json);
    this.tunnelConfig = undefined;
  }

  override toJson(): Record<string, unknown> {
    const { tunnel_config: _tunnel, ...json } = super.toJson();
    return json;
  }
}
