import { asArray, asRecord, asString, getPath, type JsonObject } from '@/core/json/json';
import { MainDateFilterSetting } from '@/core/dashboard/DashboardSetting';
import type { Widget } from '@/core/dashboard/Widget';
import { ValueControlType } from '@/core/query/controlValues';
import { functionColumns, isFunctionControl } from '@/core/query/dynamicFunctions';
import { ChartType } from './chartType';
import { vizTitleOf } from './defaultVizOptions';

/** v1 `ChartInfoType`: how a chart can steer another one. */
export const ChartInfoType = {
  /** Its selection filters other charts (a `dynamic_condition`). Every chart is one, as in v1. */
  Normal: 'Normal',
  /** A tab filter with several columns: it picks the columns other charts show (a `dynamic_function`). */
  FunctionController: 'FunctionController'
} as const;

export type ChartInfoType = (typeof ChartInfoType)[keyof typeof ChartInfoType];

/** A widget other charts can be wired to in the builder (v1 `ChartControl`). */
export interface ChartControl {
  readonly id: number;
  readonly title: string;
  readonly chartType: string;
  readonly infoType: ChartInfoType;
  /**
   * v1 `ChartControlData`, stored as is in a zone item's `dynamic_function`: `id`, `display_name`, `chart_type`,
   * `chart_info_type`, and for a function controller its columns (`table_columns`) and the ones picked by default
   * (`default_table_columns`), each marked with the control's id.
   */
  readonly data: JsonObject;
}

/** The option keys a tab control picks by default, e.g. `country_1` (v1 `TabFilterQuerySetting.getDefaultTableColumns`). */
function defaultKeys(setting: JsonObject): string[] {
  return asArray(getPath(setting, ['options', 'options', 'default', 'setting', 'value'])).filter(key => typeof key === 'string');
}

function controlData(id: number, title: string, chartType: string, setting: JsonObject | undefined): JsonObject {
  const isFunction = !!setting && isFunctionControl(setting);
  const columns = isFunction ? functionColumns(setting).map(column => ({ ...column, dynamic_function_id: id })) : [];
  const picked = defaultKeys(setting ?? {}).flatMap(key => columns[Number(key.slice(key.lastIndexOf('_') + 1))] ?? []);
  return {
    id,
    display_name: title,
    chart_type: chartType,
    chart_info_type: isFunction ? ChartInfoType.FunctionController : ChartInfoType.Normal,
    table_columns: columns,
    default_table_columns: picked.length > 0 ? picked : columns.slice(0, 1)
  };
}

function controlOf(id: number, title: string, chartType: string, setting?: JsonObject): ChartControl {
  const data = controlData(id, title, chartType, setting);
  return { id, title, chartType, infoType: data['chart_info_type'] as ChartInfoType, data };
}

export interface ChartControlsInput {
  /** Whether the dashboard has a main date filter, a control too. */
  readonly mainDate: boolean;
  /** The chart being edited, which can't steer itself. */
  readonly excludeId?: number;
}

/**
 * The dashboard's chart controls, by title (v1 `DashboardStore.chartControls`): the main date filter and every chart.
 * A chart is titled by its viz options' title, else its name (v1 showed an empty title then).
 */
export function chartControlsOf(widgets: readonly Widget[], { mainDate, excludeId }: ChartControlsInput): ChartControl[] {
  const charts = widgets.flatMap(widget => {
    if (widget.kind !== 'chart' || widget.id === excludeId) return [];
    const chartType = asString(getPath(widget.json, ['extra_data', 'current_chart_type']));
    const title = vizTitleOf(asRecord(widget.setting['options'])) || widget.name;
    return [controlOf(widget.id, title, chartType, widget.setting)];
  });
  const date = mainDate ? [controlOf(MainDateFilterSetting.ID, 'Main Date Filter', ChartType.DateSelectFilter)] : [];
  return [...date, ...charts].sort((a, b) => a.title.localeCompare(b.title));
}

/** One value a control hands to a filter on it (v1 `ValueControlInfo`). */
export interface ControlValueInfo {
  readonly type: ValueControlType;
  readonly label: string;
}

/** Chart types whose options are no value controller (v1 `isEnableControl` false): number and tables. */
const NOT_CONTROLS = new Set<string>([ChartType.Number, ChartType.Table, 'table', 'pivot_table', 'flatten_pivot_table']);

const RANGE_TYPES: Readonly<Record<string, readonly [string, string]>> = {
  [ChartType.DateSelectFilter]: ['Start date', 'End date'],
  [ChartType.SlicerFilter]: ['Start value', 'End value']
};

/**
 * The values a chart control offers to a filter condition (v1 `getSupportedControls`): a date select (also the main
 * date filter) and a slicer give their range, any other chart its selected value. Numbers and tables give none, so
 * they are no controls there.
 */
export function controlValuesOf(chartType: string): readonly ControlValueInfo[] {
  if (NOT_CONTROLS.has(chartType)) return [];
  const range = RANGE_TYPES[chartType];
  if (!range) return [{ type: ValueControlType.SelectedValue, label: 'Selected value' }];
  return [
    { type: ValueControlType.MinValue, label: range[0] },
    { type: ValueControlType.MaxValue, label: range[1] }
  ];
}
