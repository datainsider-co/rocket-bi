import { BaseConnection } from './BaseConnection';
import { ConnectionType } from './ConnectionType';

/** Backend `MysqlConnection`. */
export class MySqlConnection extends BaseConnection {
  readonly className = ConnectionType.MySql;
  readonly displayName = 'MySQL';

  host = '';
  port = 0;
  username = '';
  password = '';

  constructor(json?: unknown) {
    super({
      host: ['host', String],
      port: ['port', Number],
      username: ['username', String],
      password: ['password', String]
    });
    this.parse(json);
  }
}
