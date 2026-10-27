import { asRecord, isRecord, type JsonObject } from '@/core/json/json';
import { toStoredKeys } from '@/core/query/vizOptions';
import { ChartType } from './chartType';

/**
 * The viz options a chart starts with (v1 `ChartOption.getDefaultChartOption`), stored the way v1 sent them. They
 * follow the v1 the local docker stack runs (checked in CB0), which differs from `web/`'s source for series charts
 * (legend at the bottom, `plot_options.area.stacking`); the types that v1 lacks (Spline, Line / Area Inverted Axes,
 * Semi Pie, Tab inner filter) follow the source. Written in v1's camelCase and keyed with the same `snakeCase` v1 used.
 */

const TEXT_COLOR = 'var(--text-color)';
const SECONDARY_TEXT_COLOR = 'var(--secondary-text-color)';
const BACKGROUND = 'var(--chart-background-color)';
const TOOLTIP_BACKGROUND = 'var(--tooltip-background-color)';
const GRID_LINE_COLOR = 'var(--grid-line-color)';
const TABLE_GRID_LINE_COLOR = 'var(--table-grid-line-color)';
const PRIMARY_FONT = 'var(--widget-primary-font-family, Roboto)';
const PRIMARY_WEIGHT = 'var(--widget-primary-font-weight, 500)';
const PRIMARY_STYLE = 'var(--widget-primary-font-style, normal)';
const SECONDARY_FONT = 'var(--widget-secondary-font-family, Roboto)';
const SECONDARY_WEIGHT = 'var(--widget-secondary-font-weight, 400)';
const SECONDARY_STYLE = 'var(--widget-secondary-font-style, normal)';
const SECONDARY_UNDERLINE = 'var(--widget-secondary-font-underlined, underline)';
const TAB_ACTIVE = 'var(--tab-filter-background-active)';
const TAB_INACTIVE = 'var(--tab-filter-background-de-active)';

interface TextInput {
  text?: string;
  align?: string;
  fontSize?: string;
}

/** v1 `ChartOption.getDefaultTitle`. */
const title = ({ text = 'Untitled chart', align = 'center', fontSize = '20px' }: TextInput = {}) => ({
  align,
  enabled: true,
  text,
  style: { color: TEXT_COLOR, fontFamily: PRIMARY_FONT, fontSize, fontWeight: PRIMARY_WEIGHT, fontStyle: PRIMARY_STYLE }
});

/** v1 `ChartOption.getSecondaryStyle`. */
const secondaryStyle = (fontSize = '11px') => ({ color: SECONDARY_TEXT_COLOR, fontFamily: SECONDARY_FONT, fontSize, fontWeight: SECONDARY_WEIGHT, fontStyle: SECONDARY_STYLE });

/** v1 `ChartOption.getDefaultSubtitle`. */
const subtitle = ({ text = '', align = 'center', fontSize = '11px' }: TextInput = {}) => ({
  align,
  enabled: true,
  text,
  style: { ...secondaryStyle(fontSize), textDecoration: SECONDARY_UNDERLINE }
});

const legendTitle = { text: '', enabled: true, style: { color: TEXT_COLOR } };

const bottomLegend = (enabled = true) => ({ enabled, verticalAlign: 'bottom', layout: 'horizontal', itemStyle: { color: TEXT_COLOR }, title: legendTitle });

const axis = (gridLineWidth: string, axisTitle = '', visible = true) => ({
  visible,
  labels: { style: { color: TEXT_COLOR } },
  title: { enabled: true, style: { color: TEXT_COLOR }, text: axisTitle },
  gridLineWidth,
  gridLineColor: GRID_LINE_COLOR
});

const seriesTooltip = { backgroundColor: TOOLTIP_BACKGROUND, style: { color: TEXT_COLOR, fontFamily: SECONDARY_FONT } };

const seriesBase = (chart: JsonObject, legend: JsonObject) => ({
  chart,
  legend,
  title: title(),
  subtitle: subtitle(),
  affectedByFilter: true,
  themeColor: { enabled: true },
  background: BACKGROUND,
  xAxis: [axis('0')],
  yAxis: [axis('0.5'), axis('0.5', 'Dual axis title', false)],
  tooltip: seriesTooltip
});

/** v1 `SeriesChartOption.getDefaultChartOption`, as the running v1 sends it. */
const series = (type: string) => ({
  ...seriesBase({ type }, bottomLegend()),
  plotOptions: {
    area: { stacking: 'value' },
    series: {
      lineWidth: 2,
      dashStyle: 'Solid',
      marker: { enabled: false },
      dataLabels: { enabled: false, style: { ...secondaryStyle(), color: TEXT_COLOR, textOutline: 0 } }
    }
  }
});

/** v1 `SeriesChartOption.getDefaultLineInvertedOption` / `getDefaultAreaInvertedOption` (source). */
const invertedSeries = (type: string) =>
  seriesBase(
    { type, inverted: true },
    { layout: 'vertical', align: 'right', verticalAlign: 'top', floating: true, enabled: true, itemStyle: { color: TEXT_COLOR }, title: legendTitle }
  );

const pieTooltip = { backgroundColor: TOOLTIP_BACKGROUND, style: secondaryStyle() };

/** v1 `PieChartOption.getDefaultChartOption` and `getDefaultSemiPieOption` (source). */
const pie = (semi: boolean) => ({
  legend: bottomLegend(!semi),
  themeColor: { enabled: true },
  tooltip: pieTooltip,
  title: title(),
  subtitle: subtitle(),
  plotOptions: {
    pie: {
      ...(semi && { startAngle: -90, endAngle: 90, center: ['50%', '100%'], size: '150%', innerSize: '50%' }),
      dataLabels: { enabled: true, style: { color: TEXT_COLOR } }
    }
  },
  ...(semi && { isSemiPie: true }),
  affectedByFilter: true,
  isCrossFilter: true,
  background: BACKGROUND
});

/** v1 `DonutChartOption.getDefaultChartOption`. */
const donut = () => ({
  legend: { ...bottomLegend(), align: 'center' },
  title: title(),
  subtitle: subtitle(),
  themeColor: { enabled: true },
  tooltip: pieTooltip,
  plotOptions: { pie: { innerSize: '50%', dataLabels: { enabled: false, style: { color: TEXT_COLOR } } } },
  affectedByFilter: true,
  isCrossFilter: true,
  background: BACKGROUND
});

const KPI_TEXT = '#11152D';
const KPI_BACKGROUND = '#BEE2CA';
const kpiAffix = (text?: string) => ({ enabled: true, isWordWrap: false, ...(text !== undefined && { text }), style: { color: KPI_TEXT, fontFamily: 'Montserrat', fontSize: '24px' } });

/** v1 `NumberChartOption.getDefaultChartOption`: the first KPI theme (`style_1`). */
const number = () => ({
  title: { ...title({ align: 'left', fontSize: '16px' }), style: { ...title({ fontSize: '16px' }).style, lineHeight: '18.75px' } },
  subtitle: { ...subtitle({ text: 'Subtitle description', align: 'left' }), style: { ...subtitle({ fontSize: '14px' }).style, lineHeight: '16.41px' } },
  plotOptions: { kpi: { dataLabels: { displayUnit: 'none' } } },
  style: { color: KPI_TEXT, fontFamily: SECONDARY_FONT, fontWeight: '600', fontSize: '42px', lineHeight: '42px' },
  align: 'left',
  prefix: kpiAffix(),
  postfix: kpiAffix('$'),
  background: KPI_BACKGROUND,
  icon: {
    enabled: true,
    color: KPI_BACKGROUND,
    iconClass: 'setting-icon-wallet-money-bold',
    background: KPI_TEXT,
    shape: 'rectangle',
    border: '4px',
    shadow: '0px 2px 4px 0px #0000001A'
  },
  percentage: { enabled: true, icon: { enabled: false }, display: 'percentage', position: 'top-left', colorByInherit: true },
  theme: 'style_1',
  affectedByFilter: true,
  precision: 0,
  tooltip: { fontFamily: SECONDARY_FONT, backgroundColor: BACKGROUND, valueColor: '#000000' },
  comparison: { enabled: false },
  dataRange: { enabled: false },
  trendLine: { enabled: false, trendBy: 'Month of', displayAs: 'line', color: '#007126', colorByPercentage: false }
});

const gridLine = (applied: boolean) => ({ color: TABLE_GRID_LINE_COLOR, thickness: '1px', applyBody: applied, applyHeader: applied, applyTotal: applied });

/** v1 `FlattenTableChartOption.getDefaultChartOption`. */
const table = () => ({
  title: title({ text: 'Untitled Chart' }),
  subtitle: subtitle(),
  grid: { horizontal: { ...gridLine(true), rowPadding: '0px' }, vertical: gridLine(false) },
  affectedByFilter: true,
  tooltip: { fontFamily: SECONDARY_FONT, backgroundColor: TOOLTIP_BACKGROUND, valueColor: SECONDARY_TEXT_COLOR },
  value: {
    color: TEXT_COLOR,
    backgroundColor: 'var(--row-even-background-color)',
    align: 'left',
    alternateBackgroundColor: 'var(--row-odd-background-color)',
    alternateColor: TEXT_COLOR,
    enableUrlIcon: false,
    style: { ...secondaryStyle('12px'), isWordWrap: false }
  },
  header: {
    align: 'left',
    backgroundColor: 'var(--header-background-color)',
    color: TEXT_COLOR,
    isWordWrap: false,
    isAutoWidthSize: false,
    style: { color: TEXT_COLOR, isWordWrap: false, fontFamily: PRIMARY_FONT, fontWeight: PRIMARY_WEIGHT, fontStyle: PRIMARY_STYLE, fontSize: '12px' }
  },
  toggleIcon: { color: TEXT_COLOR, backgroundColor: 'var(--toggle-color)' },
  background: BACKGROUND
});

const noDefault = { enabled: true, setting: { value: null } };

/** v1 `TabFilterOption.getDefaultWidgetOptions`. */
const tabFilter = (displayAs: string) => ({
  title: title({ fontSize: '14px' }),
  subtitle: subtitle(),
  displayAs,
  affectedByFilter: false,
  textColor: TEXT_COLOR,
  activeColor: TAB_ACTIVE,
  deActiveColor: TAB_INACTIVE,
  background: BACKGROUND,
  default: noDefault
});

/** v1 `TabFilterOption.getDefaultInnerFilterOptions`: no title, a search box. */
const innerFilter = (displayAs: string) => ({
  title: { align: 'center', enabled: false, text: '', style: { color: TEXT_COLOR, fontFamily: PRIMARY_FONT, fontWeight: PRIMARY_WEIGHT, fontStyle: PRIMARY_STYLE, fontSize: '20px' } },
  subtitle: { align: 'center', enabled: false, text: '', style: { color: TEXT_COLOR, fontFamily: SECONDARY_FONT, fontSize: '11px' } },
  displayAs,
  affectedByFilter: false,
  textColor: TEXT_COLOR,
  activeColor: TAB_ACTIVE,
  deActiveColor: TAB_INACTIVE,
  choiceActiveColor: 'var(--choice-filter-background-active)',
  choiceDeActiveColor: 'var(--choice-filter-background-de-active)',
  background: BACKGROUND,
  default: noDefault,
  search: { enabled: true, placeholder: 'Search...' }
});

/** v1 `TreeFilterOption.getDefaultChartOption`. */
const treeFilter = (displayAs: string) => ({
  title: title({ text: 'Tree Filter', fontSize: '14px' }),
  subtitle: subtitle(),
  displayAs,
  search: { enabled: false },
  affectedByFilter: true,
  textColor: TEXT_COLOR,
  activeColor: TAB_ACTIVE,
  deActiveColor: '#9799AC',
  background: BACKGROUND,
  default: noDefault,
  choice: { borderColor: TEXT_COLOR, style: secondaryStyle() },
  switchColor: TEXT_COLOR
});

const valueFilterColors = { textColor: TEXT_COLOR, activeColor: TAB_ACTIVE, deActiveColor: TAB_INACTIVE, background: BACKGROUND };

/** v1 `SlicerFilterOption.getDefaultChartOption`. */
const slicer = () => ({
  title: title({ text: 'Slicer', align: 'left', fontSize: '14px' }),
  subtitle: subtitle(),
  affectedByFilter: true,
  ...valueFilterColors,
  from: { equal: false },
  to: { equal: false, value: 1000000 },
  default: { enabled: true },
  step: 1,
  dynamicSettings: { isNumber: true }
});

/** v1 `DateSelectFilterOption.getDefaultChartOption`. */
const dateSelect = () => ({
  title: title({ text: 'Date', align: 'left', fontSize: '14px' }),
  subtitle: subtitle({ align: 'left' }),
  affectedByFilter: true,
  ...valueFilterColors,
  condition: 'all time'
});

/** v1 `InputFilterOption.getDefaultChartOption`. */
const inputFilter = () => ({
  title: title({ align: 'left', fontSize: '14px' }),
  subtitle: subtitle({ align: 'left' }),
  placeHolder: 'Typing...',
  affectedByFilter: true,
  textColor: TEXT_COLOR,
  background: BACKGROUND
});

const T = ChartType;

interface Defaults {
  readonly className: string;
  readonly options: () => object;
  /** Keys v1 serialised next to `options` from its class's own fields. */
  readonly extra?: JsonObject;
}

const seriesDefaults = (options: () => object): Defaults => ({
  className: 'highcharts_series_chart_setting',
  options,
  extra: { stacking_group: {}, series_types_by_label_map: {} }
});

const DEFAULTS: Readonly<Record<ChartType, Defaults>> = {
  [T.Line]: seriesDefaults(() => series(T.Line)),
  [T.Spline]: seriesDefaults(() => series(T.Spline)),
  [T.Area]: seriesDefaults(() => series(T.Area)),
  [T.Column]: seriesDefaults(() => series(T.Column)),
  [T.Bar]: seriesDefaults(() => series(T.Bar)),
  [T.LineInverted]: seriesDefaults(() => invertedSeries('line')),
  [T.AreaInverted]: seriesDefaults(() => invertedSeries('area')),
  [T.Pie]: { className: 'highcharts_pie_chart_setting', options: () => pie(false) },
  [T.SemiPie]: { className: 'highcharts_pie_chart_setting', options: () => pie(true) },
  [T.Donut]: { className: 'donut_chart_setting', options: donut },
  [T.Number]: { className: 'number_chart_setting', options: number },
  [T.Table]: { className: 'flatten_table_setting', options: table },
  [T.TabFilter]: { className: 'tab_filter_chart_setting', options: () => tabFilter('normal') },
  [T.SingleChoice]: { className: 'tab_filter_chart_setting', options: () => tabFilter('single_choice') },
  [T.MultiChoice]: { className: 'tab_filter_chart_setting', options: () => tabFilter('multi_choice') },
  [T.DropDown]: { className: 'tab_filter_chart_setting', options: () => tabFilter('drop_down') },
  [T.DropDownInnerFilter]: { className: 'tab_filter_chart_setting', options: () => innerFilter('drop_down') },
  [T.TabInnerFilter]: { className: 'tab_filter_chart_setting', options: () => innerFilter('normal') },
  [T.SingleTreeFilter]: { className: 'tree_filter_chart_setting', options: () => treeFilter('single_choice') },
  [T.MultiTreeFilter]: { className: 'tree_filter_chart_setting', options: () => treeFilter('multi_choice') },
  [T.SlicerFilter]: { className: 'slice_filter_setting', options: slicer },
  [T.DateSelectFilter]: { className: 'date_select_filter_setting', options: dateSelect },
  [T.InputFilter]: { className: 'input_filter_setting', options: inputFilter }
};

/** The stored viz options (`setting.options`) a chart of this type starts with, or `undefined` for a type v2 can't build. */
export function defaultVizOptions(chartType: string): JsonObject | undefined {
  if (!Object.hasOwn(DEFAULTS, chartType)) return undefined;
  const { className, options, extra } = DEFAULTS[chartType as ChartType];
  return { options: toStoredKeys(options()), class_name: className, ...extra };
}

/** The chart's title in stored viz options, a string or `title.text` (v1 `ChartOption.getTitle`). */
export function vizTitleOf(stored: JsonObject): string {
  const titleSetting = asRecord(stored['options'])['title'];
  if (typeof titleSetting === 'string') return titleSetting;
  return isRecord(titleSetting) && typeof titleSetting['text'] === 'string' ? titleSetting['text'] : '';
}

/**
 * The viz options after a chart type change (v1 `ConfigBuilderStore.mergeChartOption`): the new type's defaults,
 * keeping the old title when it has one (v1 `ChartOption.mergeWith`).
 */
export function vizOptionsForType(chartType: string, previous: JsonObject): JsonObject | undefined {
  const next = defaultVizOptions(chartType);
  const previousTitle = vizTitleOf(previous);
  if (!next || !previousTitle) return next;
  const options = asRecord(next['options']);
  const titleSetting = options['title'];
  return {
    ...next,
    options: { ...options, title: isRecord(titleSetting) ? { ...titleSetting, text: previousTitle } : previousTitle }
  };
}
