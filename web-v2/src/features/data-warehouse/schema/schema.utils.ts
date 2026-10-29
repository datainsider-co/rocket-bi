import type { JsonObject } from '@/core/json/json';
import { toQueryRequestJson } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { JsonTableResponse } from '@/core/query/VisualizationResponse';
import type { DatabaseInfo, TableSchema } from '@/core/schema/SchemaService';
import { TableKind, TableStatus, type ColumnDefinition, type TableDefinition } from '@/core/schema/TableDefinition';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

/** What the Schema page shows (`?database=&table=`, v1 `DataSchema`). */
export interface SchemaSelection {
  readonly dbName: string | undefined;
  readonly tableName: string | undefined;
}

/**
 * The selection the URL asks for. Without a database v1 opened the first one; a table without a database means
 * nothing.
 */
export function selectionFromParams(params: URLSearchParams, databases: readonly DatabaseInfo[]): SchemaSelection {
  const asked = params.get('database');
  if (!asked) return { dbName: databases[0]?.name, tableName: undefined };
  return { dbName: asked, tableName: params.get('table') || undefined };
}

export function selectionToParams({ dbName, tableName }: SchemaSelection): URLSearchParams {
  const params = new URLSearchParams();
  if (dbName) params.set('database', dbName);
  if (dbName && tableName) params.set('table', tableName);
  return params;
}

/** The tabs of a table (v1 `DataSchema.ctrl` tab list). Measures, calculated fields (DW7) and RLS (DW8) come later. */
export const SchemaTab = {
  Schema: 'schema',
  Data: 'data'
} as const;

export type SchemaTab = (typeof SchemaTab)[keyof typeof SchemaTab];

/** v1 `ColumnTypeOptions`: the types a column can be given, with v1's labels. */
export const COLUMN_TYPES: readonly { value: string; label: string }[] = [
  { value: 'bool', label: 'Bool' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Datetime' },
  { value: 'datetime64', label: 'Datetime64' },
  { value: 'double', label: 'Double' },
  { value: 'float', label: 'Float' },
  { value: 'int8', label: 'Int8' },
  { value: 'int16', label: 'Int16' },
  { value: 'int32', label: 'Int32' },
  { value: 'int64', label: 'Int64' },
  { value: 'string', label: 'String' },
  { value: 'uint8', label: 'UInt8' },
  { value: 'uint16', label: 'UInt16' },
  { value: 'uint32', label: 'UInt32' },
  { value: 'uint64', label: 'UInt64' }
];

/** A column type's label; types outside the list (`array`, `nested`) show as they are. */
export function columnTypeLabel(type: string): string {
  return COLUMN_TYPES.find(option => option.value === type)?.label ?? type;
}

function matches(text: string, search: string): boolean {
  return text.toLowerCase().includes(search);
}

/** v1's column search: the name or the display name contains the text. */
export function filterColumns(columns: readonly ColumnDefinition[], text: string): ColumnDefinition[] {
  const search = text.trim().toLowerCase();
  return search ? columns.filter(column => matches(column.name, search) || matches(column.displayName, search)) : [...columns];
}

/** The database view's table search, by name or display name. Tables keep the schema's order. */
export function filterTables(tables: readonly TableSchema[], text: string): TableSchema[] {
  const search = text.trim().toLowerCase();
  return search ? tables.filter(table => matches(table.name, search) || matches(table.displayName ?? '', search)) : [...tables];
}

/** A view's query can be replaced (v1 "Update schema by query"); MySQL has no materialized tables, but the server may. */
export function canUpdateByQuery(table: Pick<TableDefinition, 'tableType'>): boolean {
  return table.tableType === TableKind.View || table.tableType === TableKind.Materialized;
}

/** The server is still filling the table; v1 polled it every 30 s until it was done. */
export function isProcessing(table: Pick<TableDefinition, 'status'>): boolean {
  return table.status === TableStatus.Processing;
}

/** v1 "Query table": the Query Editor on `select * from` the table. */
export function queryTablePath(table: Pick<TableDefinition, 'dbName' | 'name'>): string {
  const params = new URLSearchParams({ database: table.dbName, table: table.name });
  return `${getWarehouseSection(WarehouseSection.QueryEditor).path}?${params}`;
}

/** v1 "Update schema by query": the Query Editor on the view's query, saving back into it. */
export function updateByQueryPath(table: Pick<TableDefinition, 'dbName' | 'name' | 'displayName' | 'tableType'>): string {
  const params = new URLSearchParams({
    mode: 'update',
    database: table.dbName,
    table: table.name,
    tableDisplayName: table.displayName,
    tableType: table.tableType
  });
  return `${getWarehouseSection(WarehouseSection.QueryEditor).path}?${params}`;
}

/** The page of the preview v1 asked for first. */
export const PREVIEW_PAGE_SIZE = 20;

/**
 * The Table Data tab's query (v1 `SchemaUtils.buildQuery`): a grouped table with one `select` per column, sorted by
 * one of them when the user asked. Only the table's own columns: measures and calculated columns have no row values to
 * show. Nothing of a dashboard goes with it (v1 sent the last opened dashboard's filters).
 */
export function tablePreviewRequest(table: TableDefinition, page: number, pageSize: number, sort: TableSort | undefined): JsonObject {
  const field = (column: ColumnDefinition) => ({
    class_name: 'table_field',
    db_name: table.dbName,
    tbl_name: table.name,
    field_name: column.name,
    field_type: column.type
  });
  const select = (column: ColumnDefinition) => ({ class_name: 'select', field: field(column) });
  const sorted = sort && table.columns.find(column => column.name === sort.column);
  const setting = {
    class_name: 'group_table_chart_setting',
    columns: table.columns.map(column => ({
      name: column.name,
      function: select(column),
      is_horizontal_view: false,
      is_collapse: false,
      is_calc_group_total: true,
      is_calc_min_max: false,
      is_dynamic_function: false
    })),
    filters: [],
    sorts: sorted ? [{ class_name: 'order_by', function: select(sorted), order: sort.direction }] : [],
    sql_views: [],
    parameters: {},
    options: {}
  };
  return toQueryRequestJson({ setting, paging: { from: (page - 1) * pageSize, size: pageSize } });
}

export interface PreviewColumn {
  readonly key: string;
  /** The column's name, which a sort refers to. */
  readonly name: string;
  readonly title: string;
}

/** The preview's columns: the response names them, the table gives their display names. */
export function previewColumns(response: Pick<JsonTableResponse, 'headers'>, table: TableDefinition): PreviewColumn[] {
  return response.headers.map(header => ({
    key: header.key,
    name: header.label,
    title: table.columns.find(column => column.name === header.label)?.displayName ?? header.label
  }));
}

/** Key of each preview row; header keys are the server's hashes, so it can't clash with one. */
export const PREVIEW_ROW_KEY = '__row';

/** The page's rows, each keyed by its place in the whole result (rows have no id of their own). */
export function previewRows(records: readonly JsonObject[], offset: number): JsonObject[] {
  return records.map((record, index) => ({ ...record, [PREVIEW_ROW_KEY]: String(offset + index) }));
}
