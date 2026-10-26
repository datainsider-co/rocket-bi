import { asArray, isRecord, type JsonObject } from '@/core/json/json';
import type { FilterRequestJson } from './QueryRequest';

/** The column a filter filters on: `value` of old tab filters, the first of `values` otherwise (v1 `getFilterColumn`). */
export function filterColumnOf(setting: JsonObject): JsonObject | undefined {
  if (isRecord(setting['value'])) return setting['value'];
  const first = asArray(setting['values'])[0];
  return isRecord(first) ? first : undefined;
}

/** `column in (values)` on the column's field and scalar function (v1 `ConditionUtils.buildInCondition`). */
export function inCondition(column: JsonObject, values: readonly string[]): JsonObject | undefined {
  const fn = column['function'];
  if (!isRecord(fn) || !isRecord(fn['field'])) return undefined;
  return {
    class_name: 'in',
    field: fn['field'],
    possible_values: [...values],
    ...(isRecord(fn['scalar_function']) && { scalar_function: fn['scalar_function'] })
  };
}

/** `column = value` on the column's field and scalar function (v1 `ConditionUtils.buildEqualCondition`). */
export function equalCondition(column: unknown, value: string): JsonObject | undefined {
  const fn = isRecord(column) ? column['function'] : undefined;
  if (!isRecord(fn) || !isRecord(fn['field'])) return undefined;
  return {
    class_name: 'equal',
    field: fn['field'],
    value,
    ...(isRecord(fn['scalar_function']) && { scalar_function: fn['scalar_function'] })
  };
}

/**
 * The request a chart's inner filter adds to the chart's own query (v1 `ChartFilter.buildFilterRequest`). Its id is the
 * chart's; nothing when "Show all" is picked.
 */
export function innerFilterRequest(chartId: number, filterSetting: JsonObject, values: readonly string[]): FilterRequestJson | undefined {
  const column = filterColumnOf(filterSetting);
  const condition = values.length > 0 && column ? inCondition(column, values) : undefined;
  return condition && { filter_id: chartId, condition, is_apply_relatively: true, is_active: true };
}
