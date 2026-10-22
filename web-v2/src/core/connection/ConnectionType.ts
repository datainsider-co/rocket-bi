/**
 * `class_name` of the connections v2 can set up. v1 also had BigQuery, PostgreSQL, Redshift and Vertica; add them here
 * when they are ported.
 */
export const ConnectionType = {
  Clickhouse: 'clickhouse_connection',
  MySql: 'mysql_connection'
} as const;

export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

export function isConnectionType(value: unknown): value is ConnectionType {
  return Object.values<unknown>(ConnectionType).includes(value);
}
