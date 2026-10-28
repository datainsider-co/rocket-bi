import { asArray, isRecord, type JsonObject } from '@/core/json/json';
import { drilldownConditions } from './drilldown';
import { equalCondition } from './filterRequests';

/**
 * Pivot tables (`pivot_table_chart_setting`, v1 `PivotTableQuerySetting`). With columns across, the server answers one
 * row group at a time (it fails on several), so the chart asks for the first and each expanded row asks for the next
 * one under it. Without columns, the server nests every row group itself.
 */

export const PIVOT_TABLE_SETTING = 'pivot_table_chart_setting';

export function isPivotTableSetting(setting: JsonObject): boolean {
  return setting['class_name'] === PIVOT_TABLE_SETTING;
}

/** The setting's columns of one zone (`rows`, `columns`, `values`). */
export function pivotColumnsOf(setting: JsonObject, key: 'rows' | 'columns' | 'values'): JsonObject[] {
  return asArray(setting[key]).filter(isRecord);
}

/** Whether rows expand into the next row group by a query of their own: columns across and more than one row group. */
export function hasLazyPivotRows(setting: JsonObject): boolean {
  return isPivotTableSetting(setting) && pivotColumnsOf(setting, 'columns').length > 0 && pivotColumnsOf(setting, 'rows').length > 1;
}

/** What the chart queries (v1 `PivotTableQuerySetting.getCurrentQuery`): only the first row group when there are columns. */
export function pivotCurrentSetting(setting: JsonObject): JsonObject {
  return hasLazyPivotRows(setting) ? { ...setting, rows: pivotColumnsOf(setting, 'rows').slice(0, 1) } : setting;
}

/**
 * The query for the rows under a row (v1 `DashboardControllerStore.buildSubRowQuerySetting`): `path` holds the row's
 * value and its parents', from the top; the next row group takes the first one's name, so the response keeps the same
 * header keys. The values filter the setting's own filters, which the server ORs; v1 added them as one more OR group,
 * so a chart with filters got rows of other parents. `undefined` past the last row group.
 */
export function pivotSubRowSetting(setting: JsonObject, path: readonly string[]): JsonObject | undefined {
  const rows = pivotColumnsOf(setting, 'rows');
  const next = rows[path.length];
  const first = rows[0];
  if (!first || !next || path.length === 0) return undefined;
  const equals = path.map((value, depth) => equalCondition(rows[depth], value));
  const filters = equals.reduce<unknown[]>((current, equal) => (equal ? drilldownConditions(current, equal) : current), asArray(setting['filters']));
  return { ...setting, filters, rows: [{ ...next, name: first['name'] }] };
}
