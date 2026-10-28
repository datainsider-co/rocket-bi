import { asArray, asString, isRecord, type JsonObject } from '@/core/json/json';
import type { TableSort } from '@/core/query/tableSort';
import type { TableRow } from './table.utils';

/**
 * Collapse tables (`group_table_chart_setting`, v1 `DefaultTable` on a `GroupTableResponse`). The server nests each
 * row's next group under `children`, keeps one header for all the group by columns (the first one's), and names the
 * other columns `<name> by <first group by column>` once there are several groups. It pages and sorts the top rows.
 */

export const GROUP_TABLE_SETTING = 'group_table_chart_setting';

export function isCollapseTableSetting(setting: JsonObject): boolean {
  return setting['class_name'] === GROUP_TABLE_SETTING;
}

function childRecordsOf(record: JsonObject): JsonObject[] {
  return asArray(record['children']).filter(isRecord);
}

function treeRow(record: JsonObject, key: string): TableRow {
  const children = childRecordsOf(record).map((child, index) => treeRow(child, `${key}-${index}`));
  return children.length > 0 ? { key, record, children } : { key, record };
}

/** The page's rows with their groups below them; a row without a next level has no `children`, so it can't expand. */
export function toTreeRows(records: readonly JsonObject[], from: number): TableRow[] {
  return records.map((record, index) => treeRow(record, String(from + index)));
}

/**
 * Each shown row's position among the rows shown, the expanded rows' children after them (v1
 * `TableDataUtils.getExpandedRows`), for the even / odd colors.
 */
export function shownRowIndexes(rows: readonly TableRow[], expandedKeys: readonly string[]): Map<string, number> {
  const expanded = new Set(expandedKeys);
  const indexes = new Map<string, number>();
  const visit = (row: TableRow) => {
    indexes.set(row.key, indexes.size);
    if (expanded.has(row.key)) row.children?.forEach(visit);
  };
  rows.forEach(visit);
  return indexes;
}

/** A shown row's classes: even / odd by its place among the shown rows, bold while expanded (v1 `tr.expanded`). */
export function collapseRowClassName(key: string, shown: ReadonlyMap<string, number>, expandedKeys: readonly string[]): string {
  const stripe = (shown.get(key) ?? 0) % 2 === 0 ? 'flatten-table__row--even' : 'flatten-table__row--odd';
  return expandedKeys.includes(key) ? `${stripe} flatten-table__row--expanded` : stripe;
}

/** The keys with `key` expanded or collapsed. */
export function toggledKeys(keys: readonly string[], key: string): string[] {
  return keys.includes(key) ? keys.filter(current => current !== key) : [...keys, key];
}

/**
 * The query column a header shows: the one named like it, or the one it names `<name> by ...`; the longest name wins
 * when several match.
 */
export function columnOfLabel(columns: readonly unknown[], label: string): JsonObject | undefined {
  const named = columns.filter(isRecord).filter(column => {
    const name = asString(column['name']);
    return name !== '' && (label === name || label.startsWith(`${name} by `));
  });
  return named.reduce<JsonObject | undefined>((best, column) => (!best || asString(column['name']).length > asString(best['name']).length ? column : best), undefined);
}

/** The column's name for a header label, the label itself when no column matches. */
export function columnNameOfLabel(columns: readonly unknown[], label: string): string {
  const column = columnOfLabel(columns, label);
  return column ? asString(column['name']) : label;
}

/**
 * The header's sort as the column's name, which is what the query sorts by. v1 sorted by the label, which matched no
 * column once it read `<name> by ...`, and the table lost its sorts.
 */
export function sortByColumnName(sort: TableSort | undefined, columns: readonly unknown[]): TableSort | undefined {
  return sort && { ...sort, column: columnNameOfLabel(columns, sort.column) };
}

/** The sort shown on the header whose column it sorts by. */
export function sortByLabel(sort: TableSort | undefined, columns: readonly unknown[], labels: readonly string[]): TableSort | undefined {
  if (!sort) return undefined;
  const label = labels.find(current => columnNameOfLabel(columns, current) === sort.column);
  return { ...sort, column: label ?? sort.column };
}
