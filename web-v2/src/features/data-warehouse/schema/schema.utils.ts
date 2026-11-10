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

/** The tabs of a table (v1 `DataSchema.ctrl` tab list). */
export const SchemaTab = {
  Schema: 'schema',
  Data: 'data',
  Measure: 'measure',
  Calculated: 'calculated',
  Rls: 'rls'
} as const;

export type SchemaTab = (typeof SchemaTab)[keyof typeof SchemaTab];

const TAB_LABELS: Readonly<Record<SchemaTab, string>> = {
  schema: 'Table Schema',
  data: 'Table Data',
  measure: 'Measure Schema',
  calculated: 'Calculated Field',
  rls: 'RLS'
};

/** v1 hid Measure Schema and Calculated Field on phones: their formula dialog needs a wide screen. */
export function schemaTabsOf(narrow: boolean): { value: SchemaTab; label: string }[] {
  const tabs: SchemaTab[] = narrow
    ? [SchemaTab.Schema, SchemaTab.Data, SchemaTab.Rls]
    : [SchemaTab.Schema, SchemaTab.Data, SchemaTab.Measure, SchemaTab.Calculated, SchemaTab.Rls];
  return tabs.map(value => ({ value, label: TAB_LABELS[value] }));
}

/** The tabs that list columns, with a search above them (v1). */
export function hasColumnSearch(tab: SchemaTab): boolean {
  return tab === SchemaTab.Schema || tab === SchemaTab.Measure || tab === SchemaTab.Calculated;
}

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

/** v1's column search: the name or the display name contains the text. Columns, measures or calculated columns. */
export function filterColumns<T extends Pick<ColumnDefinition, 'name' | 'displayName'>>(columns: readonly T[], text: string): T[] {
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
