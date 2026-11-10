/** `class_name` of the organization's data warehouse connection: every type the server knows (`Connection.scala`). */
export const ConnectionType = {
  Clickhouse: 'clickhouse_connection',
  MySql: 'mysql_connection',
  PostgreSql: 'postgresql_connection',
  Redshift: 'redshift_connection',
  Vertica: 'vertica_connection',
  BigQuery: 'bigquery_connection'
} as const;

export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

export function isConnectionType(value: unknown): value is ConnectionType {
  return Object.values<unknown>(ConnectionType).includes(value);
}

/** Types whose connection can go through an SSH tunnel (the server's `TunnelConnection`s). */
const TUNNEL_TYPES: readonly ConnectionType[] = [
  ConnectionType.Clickhouse,
  ConnectionType.MySql,
  ConnectionType.Redshift,
  ConnectionType.Vertica
];

/** v1 offered a tunnel for PostgreSQL too, but the server's `PostgreSqlConnection` has none and dropped it. */
export function supportsSshTunnel(type: ConnectionType): boolean {
  return TUNNEL_TYPES.includes(type);
}

/** Extra driver properties: every JDBC type, not BigQuery. */
export function supportsProperties(type: ConnectionType): boolean {
  return type !== ConnectionType.BigQuery;
}
