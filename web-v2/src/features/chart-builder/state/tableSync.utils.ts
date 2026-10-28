import { asString, type JsonObject } from '@/core/json/json';
import type { BuilderData } from '@/core/chart-builder/BuilderData';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import type { SchemaColumn, TableSchema } from '@/core/schema/SchemaService';

/** A table of the database, by its names. */
export interface TableRef {
  readonly dbName: string;
  readonly name: string;
}

/** Where a field's column lives in its table, by the field's class. */
const COLUMN_LISTS: Readonly<Record<string, (table: TableSchema) => readonly SchemaColumn[] | undefined>> = {
  table_field: table => table.columns,
  expression_field: table => table.expressionColumns,
  calculated_field: table => table.calculatedColumns
};

/** Whether a builder field is a column of `table` (chart controls and ad hoc views never are). */
export function isFieldOf(field: JsonObject, table: TableRef): boolean {
  return asString(field['class_name']) in COLUMN_LISTS && field['db_name'] === table.dbName && field['tbl_name'] === table.name;
}

/** The column a field reads in its table; a nested column's field name is `` `nested.inner` ``. */
export function columnOfField(field: JsonObject, table: TableSchema): SchemaColumn | undefined {
  const columns = COLUMN_LISTS[asString(field['class_name'])]?.(table) ?? [];
  const fieldName = asString(field['field_name']);
  const nested = /^`([^.`]+)\.([^`]+)`$/.exec(fieldName);
  if (!nested) return columns.find(column => column.name === fieldName);
  return columns.find(column => column.name === nested[1])?.nestedColumns?.find(inner => inner.name === nested[2]);
}

interface Named {
  readonly field: JsonObject;
  readonly columnName?: string;
}

/** The field as the column now is: its type, and the expression of a measure or calculated column. */
function syncedField(field: JsonObject, column: SchemaColumn): JsonObject {
  const expression = 'expression' in field ? { expression: column.expression ?? '' } : {};
  return { ...field, field_type: column.type, ...expression };
}

/**
 * An item or condition after its table changed: `undefined` when its column is gone, else the column's type,
 * expression and display name. Unchanged values come back as they were, so the caller can tell nothing changed.
 */
function synced<T extends Named>(value: T, table: TableRef, schema: TableSchema | undefined, rename: (value: T, columnName: string) => T): T | undefined {
  if (!isFieldOf(value.field, table)) return value;
  const column = schema && columnOfField(value.field, schema);
  if (!column) return undefined;
  const field = syncedField(value.field, column);
  const same = Object.entries(field).every(([key, item]) => value.field[key] === item) && value.columnName === column.displayName;
  return same ? value : rename({ ...value, field }, column.displayName);
}

/** An item's display name follows the column's while the user has not changed it. */
const renameItem = (item: FunctionData, columnName: string): FunctionData => ({ ...item, columnName, name: item.name === item.columnName ? columnName : item.name });
const renameCondition = (condition: ConditionData, columnName: string): ConditionData => ({ ...condition, columnName });

function syncList<T extends Named>(list: readonly T[], sync: (value: T) => T | undefined): readonly T[] {
  const next = list.flatMap(value => {
    const result = sync(value);
    return result ? [result] : [];
  });
  return next.length === list.length && next.every((value, index) => value === list[index]) ? list : next;
}

export interface TableSyncResult {
  readonly data: BuilderData;
  /** How many items and conditions were dropped because their column is gone. */
  readonly removed: number;
}

/**
 * The builder's zones and filters after `table` changed in the schema (`schema` is its new state, `undefined` once
 * dropped). Items and conditions on a column that is gone are dropped, with the filter groups left empty; the others
 * take the column's type, expression and display name, so an edited measure or calculated column is queried with its
 * new formula (v1 `ConfigBuilderStore.updateField` did this only for measures). Returns `data` itself when nothing
 * changed.
 */
export function syncTableFields(data: BuilderData, table: TableRef, schema: TableSchema | undefined): TableSyncResult {
  let removed = 0;
  const count = <T>(value: T | undefined) => {
    if (value === undefined) removed += 1;
    return value;
  };
  const configs = Object.fromEntries(
    Object.entries(data.configs).map(([zone, items]) => [zone, syncList(items, item => count(synced(item, table, schema, renameItem)))])
  );
  const filters = Object.fromEntries(
    Object.entries(data.filters)
      .map(([group, conditions]) => [group, syncList(conditions, condition => count(synced(condition, table, schema, renameCondition)))] as const)
      .filter(([, conditions]) => conditions.length > 0)
  );
  const configsChanged = Object.entries(configs).some(([zone, items]) => items !== data.configs[zone]);
  const filtersChanged = Object.keys(filters).length !== Object.keys(data.filters).length || Object.entries(filters).some(([group, conditions]) => conditions !== data.filters[group]);
  if (!configsChanged && !filtersChanged) return { data, removed: 0 };
  return { data: { ...data, configs: configsChanged ? configs : data.configs, filters: filtersChanged ? filters : data.filters }, removed };
}
