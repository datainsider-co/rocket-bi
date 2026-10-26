import { asArray, isRecord, type JsonObject } from '@/core/json/json';

/** A sort picked on a table header: the column's label in the response, which is the column's name. */
export interface TableSort {
  column: string;
  direction: 'ASC' | 'DESC';
}

/**
 * The table setting sorted by one of its columns instead of its stored sorts (v1 `AbstractTableQuerySetting.applySort`,
 * one column at a time). A label that matches no column leaves the setting as it is.
 */
export function applyTableSort(setting: JsonObject, sort: TableSort | undefined): JsonObject {
  if (!sort) return setting;
  const column = asArray(setting['columns']).find(item => isRecord(item) && item['name'] === sort.column);
  if (!isRecord(column)) return setting;
  return { ...setting, sorts: [{ class_name: 'order_by', function: column['function'], order: sort.direction }] };
}
