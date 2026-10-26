import { isEqual } from 'lodash-es';
import { asArray, getPath, isRecord, type JsonObject } from '@/core/json/json';

/**
 * "Change Date Function" (v1 `ZoomStore`, `Zoomable`): a chart grouping by a date can switch the date function of that
 * column (Year, Month of Year, ...), and of its sorts on the same field. The chart must allow it (`is_enable_zoom`).
 */

/** v1's single zoom hierarchy (`ZoomStore.initZoomLevels`): scalar function → label, in v1's order. */
export const ZOOM_LEVELS: readonly { level: string; label: string }[] = [
  { level: 'to_year', label: 'Year' },
  { level: 'to_quarter', label: 'Quarter of Year' },
  { level: 'to_month', label: 'Month of Year' },
  { level: 'to_week', label: 'Week of Year' },
  { level: 'to_day_of_year', label: 'Day of Year' },
  { level: 'to_day_of_month', label: 'Day of Month' },
  { level: 'to_day_of_week', label: 'Day of Week' },
  { level: 'to_hour', label: 'Hour of Day' },
  { level: 'to_minute', label: 'Minute of Hour' },
  { level: 'to_second', label: 'Second of Minute' },
  { level: 'to_year_num', label: 'Yearly of' },
  { level: 'to_quarter_num', label: 'Quarter of' },
  { level: 'to_month_num', label: 'Month of' },
  { level: 'to_week_num', label: 'Week of' },
  { level: 'to_day_num', label: 'Day of' },
  { level: 'to_hour_num', label: 'Hour of' },
  { level: 'to_minute_num', label: 'Minute of' },
  { level: 'to_second_num', label: 'Second of' },
  { level: 'datetime_to_seconds', label: 'Second' },
  { level: 'datetime_to_millis', label: 'Millisecond' },
  { level: 'datetime_to_nanos', label: 'Nanosecond' }
];

const LEVELS = new Set(ZOOM_LEVELS.map(item => item.level));

/** The column a chart class zooms on (v1 `zoomData` per query setting). */
const ZOOM_COLUMN: Readonly<Record<string, string>> = {
  series_chart_setting: 'x_axis',
  scatter_chart_setting: 'x_axis',
  pie_chart_setting: 'legend',
  pyramid_chart_setting: 'legend',
  funnel_chart_setting: 'legend',
  word_cloud_chart_setting: 'legend',
  spider_web_chart_setting: 'legend'
};

function zoomColumn(setting: JsonObject): JsonObject | undefined {
  const key = ZOOM_COLUMN[String(setting['class_name'])];
  const column = key ? setting[key] : undefined;
  return isRecord(column) ? column : undefined;
}

/** The current level: the zoom column's date function, when it is one of the levels. */
export function zoomLevelOf(setting: JsonObject): string | undefined {
  const level = getPath(zoomColumn(setting), ['function', 'scalar_function', 'class_name']);
  return typeof level === 'string' && LEVELS.has(level) ? level : undefined;
}

/** v1 `isDisableZoom`: the chart enables zoom and groups by a date function. */
export function canZoom(setting: JsonObject): boolean {
  return getPath(setting, ['options', 'options', 'is_enable_zoom']) === true && zoomLevelOf(setting) !== undefined;
}

/**
 * The setting grouped by another date function (v1 `setZoomData`). The scalar keeps its other keys except the
 * server's `result_type`, which belongs to the old function; sorts on the same field follow.
 */
export function applyZoom(setting: JsonObject, level: string): JsonObject {
  const key = ZOOM_COLUMN[String(setting['class_name'])];
  const column = zoomColumn(setting);
  const fn = column?.['function'];
  if (!key || !column || !isRecord(fn) || !isRecord(fn['scalar_function'])) return setting;
  const { result_type: _old, ...scalar } = fn['scalar_function'];
  const nextScalar = { ...scalar, class_name: level };
  const sorts = asArray(setting['sorts']).map(sort => {
    const sortFn = isRecord(sort) ? sort['function'] : undefined;
    return isRecord(sort) && isRecord(sortFn) && isEqual(sortFn['field'], fn['field'])
      ? { ...sort, function: { ...sortFn, scalar_function: nextScalar } }
      : sort;
  });
  return { ...setting, [key]: { ...column, function: { ...fn, scalar_function: nextScalar } }, sorts };
}
