import { asArray, asBoolean, asRecord, asString, type JsonObject } from '@/core/json/json';

/**
 * A table as the Schema page edits it (backend `TableSchema`, `databases/{db}/tables/*`). `TableSchema` of
 * `SchemaService` is what the ChartBuilder reads; this one keeps the JSON the table and each column were read from, so a
 * save sends back what v2 doesn't model (`primary_keys`, `order_bys`, `input_formats`, measures, ...). v1 dropped
 * `primary_keys` and `order_bys` on read and sent them back empty.
 */

/** `table_status`: the server sets `Processing` while it fills a table. */
export const TableStatus = {
  Normal: 'Normal',
  Processing: 'Processing'
} as const;

/** `table_type`. Only `view` (and `default`) can be created from a query on MySQL; `materialized` answers 501. */
export const TableKind = {
  Default: 'default',
  View: 'view',
  Materialized: 'materialized'
} as const;

/** What `default_value` holds: text, a number or a boolean, by the column's type. */
export type DefaultValue = string | number | boolean;

export interface ColumnDefinition {
  readonly name: string;
  readonly displayName: string;
  /** `class_name`: `string`, `int64`, `datetime`, ... */
  readonly type: string;
  readonly description: string;
  readonly isNullable: boolean;
  readonly defaultValue: DefaultValue | undefined;
  readonly json: JsonObject;
}

export interface TableDefinition {
  readonly dbName: string;
  readonly name: string;
  /** MySQL storage doesn't keep it: the server answers with the table's name. */
  readonly displayName: string;
  readonly tableType: string;
  readonly status: string;
  /** A view's SQL. */
  readonly query: string | undefined;
  readonly columns: readonly ColumnDefinition[];
  readonly json: JsonObject;
}

/** Keys every column class takes; type-specific ones (`input_formats`, `nested_columns`, ...) are left out on a type change. */
const COMMON_COLUMN_KEYS = ['name', 'display_name', 'description', 'is_nullable', 'is_encrypted', 'is_private', 'default_value', 'default_expression'];

function defaultValueFromJson(value: unknown): DefaultValue | undefined {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : undefined;
}

export function columnDefinitionFromJson(value: unknown): ColumnDefinition {
  const json = asRecord(value);
  const name = asString(json['name']);
  return {
    name,
    displayName: asString(json['display_name']) || name,
    type: asString(json['class_name']),
    description: asString(json['description']),
    isNullable: asBoolean(json['is_nullable']),
    defaultValue: defaultValueFromJson(json['default_value']),
    json
  };
}

/** A column added on the Schema page; nullable like v1's new columns. */
export function newColumn(name: string, type: string): ColumnDefinition {
  return { name, displayName: name, type, description: '', isNullable: true, defaultValue: undefined, json: {} };
}

/**
 * The column merged onto the JSON it was read from. A changed type keeps only the keys every column class has, since
 * the server parses a column by `class_name`. An empty description and an unset default value are left out, as the
 * server sends them.
 */
export function columnDefinitionToJson(column: ColumnDefinition): JsonObject {
  const readType = asString(column.json['class_name']);
  const typeChanged = readType !== '' && readType !== column.type;
  const kept = typeChanged ? Object.fromEntries(Object.entries(column.json).filter(([key]) => COMMON_COLUMN_KEYS.includes(key))) : column.json;
  const { description: _description, default_value: _defaultValue, ...rest } = kept;
  return {
    ...rest,
    class_name: column.type,
    name: column.name,
    display_name: column.displayName,
    ...(column.description && { description: column.description }),
    ...(column.defaultValue !== undefined && { default_value: column.defaultValue }),
    is_nullable: column.isNullable
  };
}

/** `dbName` stands in for a missing `db_name`. */
export function tableDefinitionFromJson(value: unknown, dbName = ''): TableDefinition {
  const json = asRecord(value);
  const name = asString(json['name']);
  const query = asString(json['query']);
  return {
    dbName: asString(json['db_name'], dbName),
    name,
    displayName: asString(json['display_name']) || name,
    tableType: asString(json['table_type'], TableKind.Default),
    status: asString(json['table_status'], TableStatus.Normal),
    query: query || undefined,
    columns: asArray(json['columns']).map(columnDefinitionFromJson),
    json
  };
}

/** A table to create with `TableService.createTable`. */
export function newTable(dbName: string, name: string, displayName: string, columns: readonly ColumnDefinition[]): TableDefinition {
  return { dbName, name, displayName, tableType: TableKind.Default, status: TableStatus.Normal, query: undefined, columns, json: {} };
}

/** The table as `PUT databases/{db}/tables/{tbl}` takes it in `table_schema`, merged onto what the server sent. */
export function tableDefinitionToJson(table: TableDefinition): JsonObject {
  return {
    ...table.json,
    db_name: table.dbName,
    name: table.name,
    display_name: table.displayName,
    columns: table.columns.map(columnDefinitionToJson)
  };
}
