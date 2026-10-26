import { ClickhouseConnection } from './ClickhouseConnection';
import { ConnectionType } from './ConnectionType';
import { MySqlConnection } from './MySqlConnection';

/** The organization's data warehouse connection (v1 `Connector`, the "DataSource"). */
export type Connection = ClickhouseConnection | MySqlConnection;

export function createConnection(type: ConnectionType, json?: unknown): Connection {
  switch (type) {
    case ConnectionType.Clickhouse:
      return new ClickhouseConnection(json);
    case ConnectionType.MySql:
      return new MySqlConnection(json);
  }
}

/** Picks the class from `class_name`. A type v2 can't handle yet (BigQuery, Vertica, ...) gives `undefined`. */
export function parseConnection(json: unknown): Connection | undefined {
  const className = (json as { class_name?: unknown } | null | undefined)?.class_name;
  switch (className) {
    case ConnectionType.Clickhouse:
    case ConnectionType.MySql:
      return createConnection(className, json);
    default:
      return undefined;
  }
}
