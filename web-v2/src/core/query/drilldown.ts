import { isEqual } from 'lodash-es';
import { asArray, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { equalCondition } from './filterRequests';

/**
 * Drill down (v1 `Drilldownable`, `DrilldownDataStore`): a clicked value of the chart's dimension becomes a filter, and
 * the dimension is replaced by another field of the same table. Each step is a new setting; going back is picking an
 * earlier one.
 */

/** The dimension a chart class drills on (v1 `getColumnWillDrilldown`). Maps need geo areas and come later. */
const DRILL_COLUMN: Readonly<Record<string, string>> = {
  series_chart_setting: 'x_axis',
  scatter_chart_setting: 'x_axis',
  pie_chart_setting: 'legend',
  pyramid_chart_setting: 'legend',
  funnel_chart_setting: 'legend',
  word_cloud_chart_setting: 'legend',
  spider_web_chart_setting: 'legend',
  parliament_chart_setting: 'legend'
};

export function drillColumnOf(setting: JsonObject): JsonObject | undefined {
  const key = DRILL_COLUMN[String(setting['class_name'])];
  const column = key ? setting[key] : undefined;
  return isRecord(column) && isRecord(getPath(column, ['function', 'field'])) ? column : undefined;
}

export function isDrilldownable(setting: JsonObject): boolean {
  return drillColumnOf(setting) !== undefined;
}

/** One step: the clicked value, and the dimension to show next. */
export interface DrilldownStep {
  value: string;
  /** Column name of the new dimension. */
  name: string;
  /** Its function (`drillFunction`). */
  to: JsonObject;
}

/** Group by `field`, with a date function for date fields (v1 `Group` / `DateHistogramFunctionBuilder`). */
export function drillFunction(field: JsonObject, dateLevel?: string): JsonObject {
  return { class_name: 'group', field, ...(dateLevel && { scalar_function: { class_name: dateLevel } }) };
}

/**
 * The stored filters with the drilled value added (v1 `ConditionUtils.buildDrilldownConditions`). Top-level filters
 * are OR'ed by the server, so they are kept as one OR beside the new condition, unless they already are one AND.
 */
export function drilldownConditions(filters: readonly unknown[], equal: JsonObject): JsonObject[] {
  const [first] = filters;
  if (filters.length === 0) return [{ class_name: 'and', conditions: [equal] }];
  if (filters.length === 1 && isRecord(first) && first['class_name'] === 'and') {
    return [{ ...first, conditions: [...asArray(first['conditions']), equal] }];
  }
  return [{ class_name: 'and', conditions: [{ class_name: 'or', conditions: [...filters] }, equal] }];
}

/** The setting one step down (v1 `buildQueryDrilldown`); `undefined` for charts that can't drill. */
export function drilldownSetting(setting: JsonObject, step: DrilldownStep): JsonObject | undefined {
  const key = DRILL_COLUMN[String(setting['class_name'])];
  const column = drillColumnOf(setting);
  const equal = equalCondition(column, step.value);
  if (!key || !column || !equal) return undefined;
  return {
    ...setting,
    [key]: { ...column, name: step.name, function: step.to },
    filters: drilldownConditions(asArray(setting['filters']), equal)
  };
}

function equalFields(conditions: readonly unknown[]): unknown[] {
  return conditions.flatMap(condition => {
    if (!isRecord(condition)) return [];
    if (condition['class_name'] === 'equal') return [condition['field']];
    return equalFields(asArray(condition['conditions']));
  });
}

/** The same column of the same table; types may be spelled differently by the schema and the stored setting. */
function sameField(a: unknown, b: unknown): boolean {
  const key = (field: unknown) => (isRecord(field) ? [field['db_name'], field['tbl_name'], field['field_name']] : [field]);
  return isEqual(key(a), key(b));
}

/** Fields already drilled through, and the current one: they aren't offered again (v1 `getDrilledFields`). */
export function isDrilledField(setting: JsonObject, field: unknown): boolean {
  const used = [...equalFields(asArray(setting['filters'])), getPath(drillColumnOf(setting), ['function', 'field'])];
  return used.some(item => sameField(item, field));
}
