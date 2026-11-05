import { BigQueryConnection } from './BigQueryConnection';
import { ClickhouseConnection } from './ClickhouseConnection';
import { ConnectionType, isConnectionType } from './ConnectionType';
import { MySqlConnection } from './MySqlConnection';
import { PostgreSqlConnection } from './PostgreSqlConnection';
import { RedshiftConnection } from './RedshiftConnection';
import { VerticaConnection } from './VerticaConnection';

/** The organization's data warehouse connection (v1 `Connector`, the "DataSource"). */
export type Connection =
  | ClickhouseConnection
  | MySqlConnection
  | PostgreSqlConnection
  | RedshiftConnection
  | VerticaConnection
  | BigQueryConnection;

export function createConnection(type: ConnectionType, json?: unknown): Connection {
  switch (type) {
    case ConnectionType.Clickhouse:
      return new ClickhouseConnection(json);
    case ConnectionType.MySql:
      return new MySqlConnection(json);
    case ConnectionType.PostgreSql:
      return new PostgreSqlConnection(json);
    case ConnectionType.Redshift:
      return new RedshiftConnection(json);
    case ConnectionType.Vertica:
      return new VerticaConnection(json);
    case ConnectionType.BigQuery:
      return new BigQueryConnection(json);
  }
}

/** Picks the class from `class_name`. A type the server added later gives `undefined`. */
export function parseConnection(json: unknown): Connection | undefined {
  const className = (json as { class_name?: unknown } | null | undefined)?.class_name;
  return isConnectionType(className) ? createConnection(className, json) : undefined;
}
