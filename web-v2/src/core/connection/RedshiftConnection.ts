import { BaseConnection } from './BaseConnection';
import { ConnectionType } from './ConnectionType';

/** Backend `RedshiftConnection`. */
export class RedshiftConnection extends BaseConnection {
  readonly className = ConnectionType.Redshift;
  readonly displayName = 'Redshift';

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
  }
}
