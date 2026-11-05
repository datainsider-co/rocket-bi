import { BaseConnection } from './BaseConnection';
import { ConnectionType } from './ConnectionType';

/** Backend `VerticaConnection`. `catalog` is optional; empty means the server's default. */
export class VerticaConnection extends BaseConnection {
  readonly className = ConnectionType.Vertica;
  readonly displayName = 'Vertica';

  host = '';
  port = 0;
  username = '';
  password = '';
  catalog = '';
  isLoadBalance = false;

  constructor(json?: unknown) {
    super({
      host: ['host', String],
      port: ['port', Number],
      username: ['username', String],
      password: ['password', String],
      catalog: ['catalog', String],
      isLoadBalance: ['is_load_balance', Boolean]
    });
    this.parse(json);
  }
}
