import { JdbcDatabaseType } from '@/core/ingestion/DataSource';

/**
 * Host, port and database of a JDBC source live in its `jdbc_url` (DI0); the form edits them as fields. These build
 * the URL the way v1 did for each `database_type` and read it back. Generic JDBC has no fields: its URL is typed.
 *
 * - MySQL `jdbc:mysql://host:port?k=v&…`
 * - SQL Server `jdbc:sqlserver://host:port;databaseName=db`
 * - PostgreSQL `jdbc:postgresql://host:port/db`, Redshift `jdbc:redshift://host:port/db`
 * - Oracle `jdbc:oracle:thin:@//host:port/service` or `…:port:sid`, then `?k=v&…`
 *
 * Property keys and values are URL-encoded (v1 sent them raw, so `&` or `=` in a value broke the URL). v1 read Oracle
 * properties after `&` though it wrote them after `?`, losing them on edit; both are read here as written.
 */

export const OracleTarget = {
  ServiceName: 'service_name',
  Sid: 'sid'
} as const;

export type OracleTarget = (typeof OracleTarget)[keyof typeof OracleTarget];

export interface JdbcEndpoint {
  readonly host: string;
  readonly port: string;
  /** Database name, Oracle service name or SID; unused by MySQL. */
  readonly database: string;
  readonly oracleTarget: OracleTarget;
  readonly properties: Readonly<Record<string, string>>;
}

/** The types whose URL the form builds from fields. */
export type FieldsDatabaseType = Exclude<JdbcDatabaseType, typeof JdbcDatabaseType.GenericJdbc>;

function encodeProperties(properties: Readonly<Record<string, string>>): string {
  const pairs = Object.entries(properties).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

function safeDecode(text: string): string | undefined {
  try {
    return decodeURIComponent(text);
  } catch {
    return undefined;
  }
}

/** `k=v&k2=v2`; `undefined` when a pair has no `=` or doesn't decode. */
export function parseProperties(query: string | undefined): Record<string, string> | undefined {
  if (!query) return {};
  const result: Record<string, string> = {};
  for (const pair of query.split('&')) {
    const separator = pair.indexOf('=');
    if (separator <= 0) return undefined;
    const key = safeDecode(pair.slice(0, separator));
    const value = safeDecode(pair.slice(separator + 1));
    if (key === undefined || value === undefined) return undefined;
    result[key] = value;
  }
  return result;
}

export function buildJdbcUrl(type: FieldsDatabaseType, endpoint: JdbcEndpoint): string {
  const { host, port, database } = endpoint;
  switch (type) {
    case JdbcDatabaseType.MySql:
      return `jdbc:mysql://${host}:${port}${encodeProperties(endpoint.properties)}`;
    case JdbcDatabaseType.SqlServer:
      return `jdbc:sqlserver://${host}:${port};databaseName=${database}`;
    case JdbcDatabaseType.Postgres:
      return `jdbc:postgresql://${host}:${port}/${database}`;
    case JdbcDatabaseType.Redshift:
      return `jdbc:redshift://${host}:${port}/${database}`;
    case JdbcDatabaseType.Oracle: {
      const separator = endpoint.oracleTarget === OracleTarget.Sid ? ':' : '/';
      return `jdbc:oracle:thin:@//${host}:${port}${separator}${database}${encodeProperties(endpoint.properties)}`;
    }
  }
}

const HOST = '([^:/?;@\\s]+)';
const PORT = '(\\d+)';

const PATTERNS: Readonly<Record<FieldsDatabaseType, RegExp>> = {
  [JdbcDatabaseType.MySql]: new RegExp(`^jdbc:mysql://${HOST}:${PORT}/?(?:\\?(.*))?$`),
  [JdbcDatabaseType.SqlServer]: new RegExp(`^jdbc:sqlserver://${HOST}:${PORT};databaseName=([^;]*)$`),
  [JdbcDatabaseType.Postgres]: new RegExp(`^jdbc:postgresql://${HOST}:${PORT}/([^?/]*)$`),
  [JdbcDatabaseType.Redshift]: new RegExp(`^jdbc:redshift://${HOST}:${PORT}/([^?/]*)$`),
  [JdbcDatabaseType.Oracle]: new RegExp(`^jdbc:oracle:thin:@//${HOST}:${PORT}([/:])([^?]*)(?:\\?(.*))?$`)
};

/** `undefined` when the URL is not the shape v1 built (typed by hand, other parameters): it is then edited as text. */
export function parseJdbcUrl(type: FieldsDatabaseType, url: string): JdbcEndpoint | undefined {
  const match = PATTERNS[type].exec(url.trim());
  if (!match) return undefined;
  const [, host = '', port = ''] = match;
  const base = { host, port, database: '', oracleTarget: OracleTarget.ServiceName, properties: {} };
  switch (type) {
    case JdbcDatabaseType.MySql: {
      const properties = parseProperties(match[3]);
      return properties && { ...base, properties };
    }
    case JdbcDatabaseType.Oracle: {
      const properties = parseProperties(match[5]);
      const oracleTarget = match[3] === ':' ? OracleTarget.Sid : OracleTarget.ServiceName;
      return properties && { ...base, database: match[4] ?? '', oracleTarget, properties };
    }
    default:
      return { ...base, database: match[3] ?? '' };
  }
}
