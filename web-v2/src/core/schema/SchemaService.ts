import type { KyInstance } from 'ky';
import { token, type DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { asArray, asRecord, asString, withoutUndefined, type JsonObject } from '@/core/json/json';

/**
 * Database schemas (v1 `di-core/schema`, `GET databases`, `GET databases/{name}`). The schema keeps a column's type in
 * `class_name`. Keys the server leaves empty stay out, so the optional parts only show up on tables that have them.
 */

export interface SchemaColumn {
  name: string;
  displayName: string;
  /** `string`, `int32`, `datetime`, ...: what a `table_field` stores as `field_type`. `nested` for a nested column. */
  type: string;
  /** A measure's or calculated column's expression (`default_expression.expr`). */
  expression?: string;
  /** Kept when a measure or calculated column is edited. */
  description?: string;
  /** A nested column's own columns. */
  nestedColumns?: SchemaColumn[];
}

/** v1 `TableType` values the builder reads. */
export const TableType = {
  View: 'view'
} as const;

export interface TableSchema {
  dbName: string;
  name: string;
  displayName?: string;
  /** `default`, `view`, `materialized`, ... */
  tableType?: string;
  /** A view's SQL. */
  query?: string;
  columns: SchemaColumn[];
  /** Measures: aggregated by their expression (`expression_field`). */
  expressionColumns?: SchemaColumn[];
  /** Calculated columns (`calculated_field`). */
  calculatedColumns?: SchemaColumn[];
}

export interface DatabaseSchema {
  name: string;
  tables: TableSchema[];
}

/** One entry of `GET databases`, without its tables (v1 `ShortDatabaseInfo`). */
export interface DatabaseInfo {
  name: string;
  displayName: string;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function columnsFromJson(value: unknown): SchemaColumn[] | undefined {
  const columns = asArray(value).map(columnFromJson);
  return columns.length > 0 ? columns : undefined;
}

function columnFromJson(value: unknown): SchemaColumn {
  const json = asRecord(value);
  const name = asString(json['name']);
  return withoutUndefined<SchemaColumn>({
    name,
    displayName: asString(json['display_name']) || name,
    type: asString(json['class_name']),
    expression: nonEmptyString(asRecord(json['default_expression'])['expr']),
    description: nonEmptyString(json['description']),
    nestedColumns: columnsFromJson(json['nested_columns'])
  });
}

/** `dbName` stands in for a missing `db_name`. */
export function tableSchemaFromJson(value: unknown, dbName = ''): TableSchema {
  const json = asRecord(value);
  return withoutUndefined<TableSchema>({
    dbName: asString(json['db_name'], dbName),
    name: asString(json['name']),
    displayName: nonEmptyString(json['display_name']),
    tableType: nonEmptyString(json['table_type']),
    query: nonEmptyString(json['query']),
    columns: asArray(json['columns']).map(columnFromJson),
    expressionColumns: columnsFromJson(json['expression_columns']),
    calculatedColumns: columnsFromJson(json['calculated_columns'])
  });
}

export function databaseSchemaFromJson(value: unknown): DatabaseSchema {
  const json = asRecord(value);
  const name = asString(json['name']);
  return { name, tables: asArray(json['tables']).map(table => tableSchemaFromJson(table, name)) };
}

/** Sorted by display name, as v1 listed them (`SchemaUtils.sortDatabaseInfos`). */
export function databaseInfosFromJson(value: unknown): DatabaseInfo[] {
  return asArray(value)
    .map(item => {
      const json = asRecord(item);
      const name = asString(json['name']);
      return { name, displayName: asString(json['display_name']) || name };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/** A column as a query setting refers to it (backend `TableField`). */
export function tableField(table: Pick<TableSchema, 'dbName' | 'name'>, column: SchemaColumn): JsonObject {
  return { class_name: 'table_field', db_name: table.dbName, tbl_name: table.name, field_name: column.name, field_type: column.type };
}

export interface SchemaService {
  /** The databases the user can read, sorted by display name. */
  listDatabases(signal?: AbortSignal): Promise<DatabaseInfo[]>;
  getDatabase(dbName: string, signal?: AbortSignal): Promise<DatabaseSchema>;
  /** Columns a SQL query returns, as an ad-hoc table (`adhoc_view`) with an empty `dbName`. */
  detectTableSchema(query: string, signal?: AbortSignal): Promise<TableSchema>;
}

export const SchemaService = token<SchemaService>('SchemaService');

export class HttpSchemaService implements SchemaService {
  constructor(private readonly http: KyInstance) {}

  async listDatabases(signal?: AbortSignal): Promise<DatabaseInfo[]> {
    return databaseInfosFromJson(await this.http.get('databases', { signal }).json());
  }

  async getDatabase(dbName: string, signal?: AbortSignal): Promise<DatabaseSchema> {
    return databaseSchemaFromJson(await this.http.get(`databases/${encodeURIComponent(dbName)}`, { signal }).json());
  }

  async detectTableSchema(query: string, signal?: AbortSignal): Promise<TableSchema> {
    return tableSchemaFromJson(await this.http.post('databases/adhoc/tables', { json: { query }, signal }).json());
  }
}

export const SchemaModule: DiModule = di => {
  di.bindSingleton(SchemaService, d => new HttpSchemaService(d.get(ApiClient)));
};
