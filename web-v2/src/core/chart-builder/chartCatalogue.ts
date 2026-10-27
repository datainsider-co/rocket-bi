import type { JsonObject } from '@/core/json/json';
import { ChartType } from './chartType';
import { AggregationType, DateFunctionType, FunctionFamily, SortType, type FunctionData } from './FunctionData';
import { FieldKind, fieldKindOf } from './functions';

/** A function family and type, as a zone item stores them (v1 `FunctionFamilyInfo`); `type` is `''` without one. */
export interface FunctionInfo {
  readonly family: FunctionFamily;
  readonly type: string;
}

const groupBy: FunctionInfo = { family: FunctionFamily.GroupBy, type: '' };
const byYear: FunctionInfo = { family: FunctionFamily.DateHistogram, type: DateFunctionType.Year };
const sum: FunctionInfo = { family: FunctionFamily.Aggregation, type: AggregationType.Sum };
const countAll: FunctionInfo = { family: FunctionFamily.Aggregation, type: AggregationType.CountAll };
const none: FunctionInfo = { family: FunctionFamily.None, type: '' };

/** The function a field dropped into a zone starts with, per kind of column (v1 `defaultTextFunctionInfo`, ...). */
type ZoneDefaults = Readonly<Record<typeof FieldKind.Text | typeof FieldKind.Number | typeof FieldKind.Date, FunctionInfo>>;

const GROUP_DEFAULTS: ZoneDefaults = { text: groupBy, number: groupBy, date: byYear };
const AGGREGATION_DEFAULTS: ZoneDefaults = { text: countAll, number: sum, date: countAll };
const NONE_DEFAULTS: ZoneDefaults = { text: none, number: none, date: none };

/** One drop zone of a chart type (v1 `DraggableConfig`). `key` is the zone's key in `extra_data.configs`. */
export interface ZoneConfig {
  readonly key: string;
  readonly title: string;
  readonly maxItems?: number;
  readonly optional: boolean;
  /** The families an item's menu offers (v1 `preferFunctionTypes`). */
  readonly families: readonly FunctionFamily[];
  readonly defaults?: ZoneDefaults;
}

const F = FunctionFamily;

const zone = (key: string, title: string, families: FunctionFamily[], defaults: ZoneDefaults, extra: Partial<ZoneConfig> = {}): ZoneConfig => ({
  key,
  title,
  optional: false,
  families,
  defaults,
  ...extra
});

const groupZone = (key: string, title: string, extra: Partial<ZoneConfig> = {}) => zone(key, title, [F.GroupBy, F.DateHistogram], GROUP_DEFAULTS, { maxItems: 1, ...extra });
const aggregationZone = (key: string, title: string, extra: Partial<ZoneConfig> = {}) => zone(key, title, [F.Aggregation], AGGREGATION_DEFAULTS, extra);

/** v1 `DataBuilderConstantsV35.SERIES_CONFIGS`; Bar shows the same zones as Y-Axis then X-Axis (`BAR_SERIES_CONFIGS`). */
const seriesZones = (xTitle = 'X-Axis', yTitle = 'Y-Axis'): ZoneConfig[] => [
  groupZone('x_axis', xTitle),
  aggregationZone('y_axis', yTitle),
  groupZone('legend_optional', 'Legend', { optional: true })
];

const PIE_ZONES = [groupZone('legend', 'Legend'), aggregationZone('value', 'Value', { maxItems: 1 })];
const NUMBER_ZONES = [aggregationZone('value', 'Value', { maxItems: 1 })];
const TABLE_ZONES = [zone('columns', 'Columns', [F.GroupBy, F.DateHistogram, F.Aggregation, F.None], NONE_DEFAULTS)];
/** v1 `DROP_DOWN_CONFIGS`, for tab, choice, dropdown and tree filters. */
const VALUES_ZONES = [zone('values', 'Values', [F.GroupBy, F.Aggregation, F.DateHistogram], { text: groupBy, number: sum, date: byYear })];
/** v1 `VALUE_FILTER_CONFIGS`, for slicer, date select and input filters. */
const VALUE_ZONES = [zone('value', 'Value', [F.Aggregation, F.GroupBy], NONE_DEFAULTS, { maxItems: 1, optional: true })];

/** Where a chart type goes: a chart, a filter widget, or a chart's inner filter. */
export const ChartKind = {
  Chart: 'chart',
  Filter: 'filter',
  InnerFilter: 'inner_filter'
} as const;

export type ChartKind = (typeof ChartKind)[keyof typeof ChartKind];

export interface ChartTypeInfo {
  readonly type: ChartType;
  readonly title: string;
  /** v1's picker icon (`src`), a file of v1's `public/chart-icon`. */
  readonly icon: string;
  readonly kind: ChartKind;
  readonly zones: readonly ZoneConfig[];
  /** Whether the Sorting and Filters zones show (v1 `extraPanels`). */
  readonly extraZones: boolean;
}

const T = ChartType;
const K = ChartKind;

const chart = (type: ChartType, title: string, icon: string, zones: readonly ZoneConfig[]): ChartTypeInfo => ({ type, title, icon, kind: K.Chart, zones, extraZones: true });
const filter = (type: ChartType, title: string, icon: string, zones: readonly ZoneConfig[], extraZones = true): ChartTypeInfo => ({
  type,
  title,
  icon,
  kind: K.Filter,
  zones,
  extraZones
});

/** The chart types v2 builds, in v1's picker order (v1 `ALL_CHARTS`, `ALL_FILTERS`, `ALL_INNER_FILTERS`). */
export const CHART_TYPES: readonly ChartTypeInfo[] = [
  chart(T.Table, 'Table', 'ic_table.svg', TABLE_ZONES),
  chart(T.Number, 'Number', 'ic_number.svg', NUMBER_ZONES),
  chart(T.Line, 'Line', 'ic_line_chart.svg', seriesZones()),
  chart(T.Spline, 'Spline', 'ic_line_chart.svg', seriesZones()),
  chart(T.LineInverted, 'Line Inverted Axes', 'ic_line_chart.svg', seriesZones()),
  chart(T.Area, 'Area', 'ic_chart_area.svg', seriesZones()),
  chart(T.AreaInverted, 'Area Inverted Axes', 'ic_chart_area.svg', seriesZones()),
  chart(T.Column, 'Column', 'ic_column.svg', seriesZones()),
  chart(T.Bar, 'Bar', 'ic_bar.svg', seriesZones('Y-Axis', 'X-Axis')),
  chart(T.Pie, 'Pie', 'ic_pie.svg', PIE_ZONES),
  chart(T.SemiPie, 'Semi Pie', 'ic_pie.svg', PIE_ZONES),
  chart(T.Donut, 'Donut', 'ic_donut.svg', PIE_ZONES),
  filter(T.TabFilter, 'Tab', 'ic_tab_filter.svg', VALUES_ZONES),
  filter(T.SingleChoice, 'Single choice', 'ic_single_choice.svg', VALUES_ZONES),
  filter(T.MultiChoice, 'Multi choice', 'ic_multi_choice.svg', VALUES_ZONES),
  filter(T.DropDown, 'Dropdown', 'ic_dropdown.svg', VALUES_ZONES),
  filter(T.SlicerFilter, 'Slicer Filter', 'slicer-filter.svg', VALUE_ZONES, false),
  filter(T.DateSelectFilter, 'Date Filter', 'date-filter.svg', VALUE_ZONES, false),
  filter(T.InputFilter, 'Input', 'ic_input_filter.svg', VALUE_ZONES, false),
  filter(T.SingleTreeFilter, 'Single Tree Filter', 'ic_single_tree_filter.svg', VALUES_ZONES),
  filter(T.MultiTreeFilter, 'Multi Tree Filter', 'ic_multi_tree_filter.svg', VALUES_ZONES),
  { ...filter(T.DropDownInnerFilter, 'Dropdown', 'ic_dropdown.svg', VALUES_ZONES), kind: K.InnerFilter },
  { ...filter(T.TabInnerFilter, 'Tab Filter', 'ic_tab_filter.svg', VALUES_ZONES), kind: K.InnerFilter }
];

const BY_TYPE = new Map<string, ChartTypeInfo>(CHART_TYPES.map(info => [info.type, info]));

export function chartTypeInfoOf(chartType: string): ChartTypeInfo | undefined {
  return BY_TYPE.get(chartType);
}

/** v1's icons (`ALL_ICON_MAP`) for the chart types v2 doesn't build yet, which dashboards still hold. */
const OTHER_ICONS: Readonly<Record<string, string>> = {
  table: 'ic_collapse_table.svg',
  pivot_table: 'ic_pivot_table.svg',
  flatten_pivot_table: 'ic_pivot_table.svg',
  arearange: 'ic_chart_area.svg',
  column_range: 'ic_column.svg',
  lollipop: 'ic_lollipop.svg',
  Parliament: 'ic_parliament.svg',
  variablepie: 'ic_variable_pie.svg',
  scatter: 'ic_scatter.svg',
  bubble_chart: 'ic_bubble.svg',
  funnel: 'ic_funnel.svg',
  pyramid: 'ic_pyramid.svg',
  pareto: 'ic_pareto.svg',
  bell_curve: 'ic_bell_curve.svg',
  gauge: 'ic_gauge.svg',
  bullet: 'ic_bullet_chart.svg',
  heatmap: 'ic_heatmap.svg',
  wordcloud: 'ic_word_cloud.svg',
  tree_map: 'ic_tree_map.svg',
  stack_column: 'ic_stack_column.svg',
  stack_bar: 'ic_stack_bar.svg',
  circular_bar: 'ic_circular_bar.svg',
  histogram: 'ic_histogram.svg',
  map: 'ic_map.svg',
  spider_web: 'ic-spider-chart.svg',
  sankey: 'ic_sankey.svg',
  wind_rose: 'ic_win_rose_chart.svg',
  line_stock: 'ic_linestock.svg'
};

/** v1's generic icon, for chart controls and unknown types (v1 `ChartUtils.getControlIconSrc`). */
export const CONTROL_ICON = 'chart_control.svg';

/** The picker icon of any chart type v1 made. */
export function chartIconOf(chartType: string): string {
  return chartTypeInfoOf(chartType)?.icon ?? OTHER_ICONS[chartType] ?? CONTROL_ICON;
}

/** The Sorting zone: sorted ascending from the start, no defaults of its own. */
export const SORTING_ZONE: ZoneConfig = { key: 'sorting', title: 'Sorting', optional: true, families: [] };

/**
 * The function a field starts with in a zone (v1 `FunctionFamilyBuilder`): the zone's default for the column's kind,
 * otherwise group by text, aggregate numbers, group dates by year. A measure always uses its expression.
 */
export function defaultFunctionOf(field: JsonObject, zoneConfig?: ZoneConfig): FunctionInfo {
  const kind = fieldKindOf(field);
  if (kind === FieldKind.Expression) return { family: F.Aggregation, type: AggregationType.Expression };
  if (kind === FieldKind.Control) return { family: F.Dynamic, type: '' };
  return zoneConfig?.defaults?.[kind] ?? { text: groupBy, number: sum, date: byYear }[kind];
}

/** What each kind of column turns into when its family is picked in an item's menu (v1 `FunctionFamilyBuilder.withSelectedFunction`). */
const FAMILY_FUNCTIONS: Readonly<Record<typeof FieldKind.Text | typeof FieldKind.Number | typeof FieldKind.Date, Partial<Record<string, FunctionInfo>>>> = {
  text: { [F.GroupBy]: groupBy, [F.Aggregation]: countAll, [F.None]: none, [F.DateHistogram]: byYear },
  number: { [F.GroupBy]: groupBy, [F.Aggregation]: sum, [F.None]: none, [F.DateHistogram]: byYear },
  date: { [F.GroupBy]: groupBy, [F.Aggregation]: countAll, [F.None]: none, [F.DateHistogram]: byYear }
};

/**
 * The function an item gets when the user picks `family` in its menu: the family's first type for the column's kind.
 * A family the menu doesn't offer falls back to the kind's default, as in v1.
 */
export function functionInfoForFamily(field: JsonObject, family: string): FunctionInfo {
  const kind = fieldKindOf(field);
  if (kind === FieldKind.Expression || kind === FieldKind.Control) return defaultFunctionOf(field);
  return FAMILY_FUNCTIONS[kind][family] ?? defaultFunctionOf(field);
}

export interface NewItemInput {
  readonly id: number;
  readonly field: JsonObject;
  /** The column's name, also the item's first display name. */
  readonly columnName: string;
  readonly tableName: string;
  readonly isNested?: boolean;
  /** A chart control's data (v1 `ChartControlData`), when the field is that control. */
  readonly dynamicFunction?: JsonObject;
  readonly zone: ZoneConfig;
}

/** A field just dropped into a zone (v1 `FunctionNodeBuilder` + `ConfigDataUtils.toFunctionData`). */
export function newFunctionData({ id, field, columnName, tableName, isNested = false, dynamicFunction, zone: zoneConfig }: NewItemInput): FunctionData {
  const { family, type } = defaultFunctionOf(field, zoneConfig);
  return {
    id,
    field,
    functionFamily: family,
    functionType: type,
    name: columnName,
    sorting: zoneConfig.key === SORTING_ZONE.key ? SortType.Ascending : SortType.Unsorted,
    tableName,
    columnName,
    displayAsColumn: false,
    isNested,
    numElemsShown: 10,
    isShowNElements: false,
    ...(dynamicFunction && { dynamicFunction })
  };
}
