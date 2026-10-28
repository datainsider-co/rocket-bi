import { asNumber, asRecord, asString, type JsonObject } from '@/core/json/json';

/**
 * A place data is ingested from (backend `DataSource`, `source/*`), discriminated by `class_name`. Plain values, like
 * `Widget`, so they can sit in the query cache and feed forms.
 *
 * Each source keeps the JSON it was read from in `json`, and edits are merged onto it. Sources v2 can't edit yet (Mongo,
 * BigQuery, the OAuth ones, ...) are `UnsupportedSource`: listed and deletable, never written back.
 */

export const SourceClassName = {
  Jdbc: 'jdbc_source'
} as const;

/** `database_type` of a `jdbc_source`. The server rejects other values ("key not found"). */
export const JdbcDatabaseType = {
  MySql: 'MySql',
  SqlServer: 'SqlServer',
  Oracle: 'Oracle',
  Redshift: 'Redshift',
  Postgres: 'Postgres',
  GenericJdbc: 'GenericJdbc'
} as const;

export type JdbcDatabaseType = (typeof JdbcDatabaseType)[keyof typeof JdbcDatabaseType];

const JDBC_DATABASE_TYPES: readonly string[] = Object.values(JdbcDatabaseType);

export type SourceId = number;

/** `id` of a source not saved yet; the server also takes `org_id` from the session, so new sources send -1. */
export const NEW_SOURCE_ID: SourceId = -1;

interface SourceBase {
  readonly id: SourceId;
  readonly displayName: string;
  readonly creatorId: string;
  /** Epoch millis of the last save, set by the server. */
  readonly lastModify: number;
  readonly json: JsonObject;
}

/** Host, port and database live in `jdbcUrl`; the form splits them out per `databaseType`. */
export interface JdbcSource extends SourceBase {
  readonly kind: 'jdbc';
  readonly databaseType: JdbcDatabaseType;
  readonly jdbcUrl: string;
  readonly username: string;
  /** The server sends it back in plain text. */
  readonly password: string;
}

export interface UnsupportedSource extends SourceBase {
  readonly kind: 'unsupported';
  readonly className: string;
}

export type DataSource = JdbcSource | UnsupportedSource;

export function dataSourceFromJson(value: unknown): DataSource {
  const json = asRecord(value);
  const base = {
    id: asNumber(json['id'], NEW_SOURCE_ID),
    displayName: asString(json['display_name']),
    creatorId: asString(json['creator_id']),
    lastModify: asNumber(json['last_modify']),
    json
  };
  const className = asString(json['class_name']);
  const databaseType = asString(json['database_type']);
  if (className === SourceClassName.Jdbc && JDBC_DATABASE_TYPES.includes(databaseType)) {
    return {
      ...base,
      kind: 'jdbc',
      databaseType: databaseType as JdbcDatabaseType,
      jdbcUrl: asString(json['jdbc_url']),
      username: asString(json['username']),
      password: asString(json['password'])
    };
  }
  return { ...base, kind: 'unsupported', className };
}

export type JdbcSourceValues = Pick<JdbcSource, 'displayName' | 'databaseType' | 'jdbcUrl' | 'username' | 'password'>;

/** A source to create; `toJson` gives what `source/create` and `source/test` take. */
export function newJdbcSource(values: JdbcSourceValues): JdbcSource {
  return { ...values, kind: 'jdbc', id: NEW_SOURCE_ID, creatorId: '', lastModify: 0, json: {} };
}

/** Fields the server needs (`org_id`, `id` and `display_name` are required) merged onto what it sent. */
export function jdbcSourceToJson(source: JdbcSource): JsonObject {
  return {
    org_id: -1,
    ...source.json,
    class_name: SourceClassName.Jdbc,
    id: source.id,
    display_name: source.displayName,
    database_type: source.databaseType,
    jdbc_url: source.jdbcUrl,
    username: source.username,
    password: source.password
  };
}
