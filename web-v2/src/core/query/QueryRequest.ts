import { asArray, asString, getPath, type JsonObject } from '@/core/json/json';
import { pivotCurrentSetting } from './pivotQuery';

/** v1 `AbstractTableQuerySetting` and friends: settings the server pages (`from` / `size`). */
const PAGED_SETTINGS = new Set([
  'table_chart_setting',
  'group_table_chart_setting',
  'raw_query_setting',
  'pivot_table_chart_setting',
  'flatten_pivot_table_chart_setting',
  'scatter_chart_setting',
  'bubble_chart_setting',
  'bell_curve_chart_setting'
]);

/** v1's first page of a table. */
export const DEFAULT_PAGE_SIZE = 20;

export interface Paging {
  from: number;
  size: number;
}

/** Backend `FilterRequest`; `condition` is a backend `Condition` as JSON. */
export interface FilterRequestJson {
  filter_id: number;
  condition: JsonObject;
  is_apply_relatively?: boolean;
  is_active?: boolean;
}

export interface QueryRequestInput {
  setting: JsonObject;
  filterRequests?: readonly FilterRequestJson[];
  /** Tables page; everything else asks for all rows (-1). */
  paging?: Paging;
  dashboardId?: number;
  chartId?: number;
  parameters?: Readonly<Record<string, string>>;
  /** A number chart's comparison (`compareRequestOf`). */
  compareRequest?: JsonObject;
}

export function settingClassName(setting: JsonObject): string {
  return asString(setting['class_name']);
}

export function isPagedSetting(setting: JsonObject): boolean {
  return PAGED_SETTINGS.has(settingClassName(setting));
}

/**
 * Whether the server can answer the setting (v1 `QuerySetting.canQuery`). Inputs query their min/max only when they
 * have both columns (slicer, date select); a plain input has one, a parameter input none. A tab control with several
 * columns picks columns and has nothing to query; a tree filter queries its first level.
 */
export function canQuerySetting(setting: JsonObject): boolean {
  const columns = asArray(setting['values']).length;
  switch (settingClassName(setting)) {
    case 'input_control_chart_setting':
      return columns === 2;
    case 'tab_control_chart_setting':
      return getPath(setting, ['options', 'class_name']) === 'tree_filter_chart_setting' || columns === 1;
    default:
      return true;
  }
}

/**
 * Body of `POST chart/query` (backend `ChartRequest`). Like v1, the viz options are left out (`options: {}`): the
 * server doesn't need them to query. A pivot table with columns asks for its first row group only.
 */
export function toQueryRequestJson({ setting, filterRequests = [], paging, dashboardId, chartId, parameters = {}, compareRequest }: QueryRequestInput): JsonObject {
  const page = paging ?? (isPagedSetting(setting) ? { from: 0, size: DEFAULT_PAGE_SIZE } : { from: -1, size: -1 });
  return {
    query_setting: { ...pivotCurrentSetting(setting), options: {} },
    filter_requests: filterRequests,
    ...(compareRequest && { compare_request: compareRequest }),
    from: page.from,
    size: page.size,
    use_boost: false,
    ...(dashboardId !== undefined && { dashboard_id: dashboardId }),
    ...(chartId !== undefined && { chart_id: chartId }),
    parameters
  };
}
