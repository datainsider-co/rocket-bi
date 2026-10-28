import { get } from 'lodash-es';
import { asString, type JsonObject } from '@/core/json/json';
import { pivotColumnsOf } from '@/core/query/pivotQuery';
import type { TableHeader } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { columnOfLabel } from './collapseTable.utils';
import type { HeaderColumn, HeaderColumnOf, SortableHeader, TableRow } from './table.utils';
import type { TableTotals } from './TableTotalRow';

/**
 * Pivot tables as the server answers them (`json_table_response`): the first row group's header (`is_group_by`), then,
 * without columns across, `<value> by <first row group>` per value; with columns, one group per column value and, under
 * it, one header per value (the value's name), or the column value itself when there is one value. Headers carry their
 * column's total. Keys are hashes, so headers are matched to the query's columns by name.
 */

const named = (column: JsonObject): HeaderColumn => ({ name: asString(column['name']), column });

/** The query column of each header, for its formatting (v1 `PivotFieldFormatterUtils`). */
export function pivotHeaderColumnOf(setting: JsonObject): HeaderColumnOf {
  const [firstRow] = pivotColumnsOf(setting, 'rows');
  const values = pivotColumnsOf(setting, 'values');
  const across = pivotColumnsOf(setting, 'columns').length > 0;
  return header => {
    if (header.isGroupBy && firstRow) return named(firstRow);
    const [onlyValue] = values;
    if (across && onlyValue && values.length === 1) return named(onlyValue);
    const column = across ? values.find(value => value['name'] === header.label) : columnOfLabel(values, header.label);
    return column ? named(column) : { name: header.label, column: {} };
  };
}

/**
 * The columns a header sort can name: the first row group and, without columns across, the values. Under columns
 * across, a value header stands for one column value only, which the query can't sort by.
 */
export function pivotSortColumns(setting: JsonObject): JsonObject[] {
  const firstRow = pivotColumnsOf(setting, 'rows').slice(0, 1);
  return pivotColumnsOf(setting, 'columns').length > 0 ? firstRow : [...firstRow, ...pivotColumnsOf(setting, 'values')];
}

/** The headers that sort the table: all without columns across, the row group's otherwise. */
export function pivotSortable(setting: JsonObject): SortableHeader {
  const across = pivotColumnsOf(setting, 'columns').length > 0;
  return header => !across || header.isGroupBy;
}

/** A table of one row (no row groups) has no pages. */
export function isPivotPaged(setting: JsonObject): boolean {
  return pivotColumnsOf(setting, 'rows').length > 0;
}

interface LazyRowsInput {
  records: readonly JsonObject[];
  /** The page's first row. */
  from: number;
  /** The key of the row group's cells. */
  groupKey: string;
  /** How many row groups there are; rows above the last one expand. */
  levels: number;
  /** The rows loaded under an expanded row, by its key. */
  childrenOf: (key: string) => readonly JsonObject[] | undefined;
}

/**
 * The rows of a pivot table whose rows expand by queries of their own: each with its path, and with the rows loaded
 * under it, or none yet (an empty list keeps its toggle).
 */
export function toLazyPivotRows({ records, from, groupKey, levels, childrenOf }: LazyRowsInput): TableRow[] {
  const visit = (record: JsonObject, key: string, parent: readonly string[]): TableRow => {
    const path = [...parent, String(record[groupKey] ?? '')];
    if (path.length >= levels) return { key, record, path };
    const children = (childrenOf(key) ?? []).map((child, index) => visit(child, `${key}-${index}`, path));
    return { key, record, path, children };
  };
  return records.map((record, index) => visit(record, String(from + index), []));
}

/** The headers that hold cells, in their order across. */
export function leafHeaders(headers: readonly TableHeader[]): TableHeader[] {
  return headers.flatMap(header => (header.children.length > 0 ? leafHeaders(header.children) : [header]));
}

/**
 * A pivot table's total row (v1 `PivotTable.isShowFooter`, `total.*`): with row groups, unless turned off, and only
 * when some column has a total. The label sits under the row group's header.
 */
export function pivotTotals(
  setting: JsonObject,
  options: VizOptions,
  headers: readonly TableHeader[],
  cellText: (header: TableHeader, value: string) => string
): TableTotals | undefined {
  const leaves = leafHeaders(headers);
  const enabled = get(options, 'total.enabled') !== false;
  if (!isPivotPaged(setting) || !enabled || !leaves.some(header => header.total !== undefined)) return undefined;
  const labelOn = get(options, 'total.label.enabled') !== false;
  const labelText: unknown = get(options, 'total.label.text');
  const label = labelOn ? (typeof labelText === 'string' ? labelText : 'Total') : '';
  return {
    cells: leaves.map((header, index) => {
      const key = header.key || String(index);
      if (header.isGroupBy) return { key, text: label, isLabel: true };
      return { key, text: header.total === undefined ? '' : cellText(header, header.total), isLabel: false };
    })
  };
}
