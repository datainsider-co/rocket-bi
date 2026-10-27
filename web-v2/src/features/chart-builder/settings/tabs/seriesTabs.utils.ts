import { get } from 'lodash-es';
import { ChartType } from '@/core/chart-builder/chartType';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { vizKey, type VizOptions } from '@/core/query/vizOptions';
import { GRID_LINE_COLOR, SECONDARY_FONT, TEXT_COLOR, type SettingOption } from '../settingOptions';

/** The tabs of series charts (v1 `SeriesSetting`): legend, per-series display, axes, data labels and area stacking. */

// Legend (v1 `LegendTab`)

export const LEGEND_DEFAULTS = {
  enabled: true,
  verticalAlign: 'bottom',
  layout: 'horizontal',
  title: '',
  fontFamily: SECONDARY_FONT,
  align: 'center',
  color: TEXT_COLOR,
  fontSize: '12px',
  maxHeight: 60
} as const;

export type LegendStyle = 'fontFamily' | 'color' | 'fontSize';

/** v1 styles the legend's title and items alike. */
export function legendStyleChanges(style: LegendStyle, value: string): VizChanges {
  return { [`legend.title.style.${style}`]: value, [`legend.itemStyle.${style}`]: value };
}

/** v1: a manual height starts at 60px; turning it off lets Highcharts size the legend. */
export function legendHeightToggle(enabled: boolean): VizChanges {
  return { 'legend.maxHeight': enabled ? LEGEND_DEFAULTS.maxHeight : undefined };
}

/** v1 `LegendTab.handleRevert`, which keeps the layout and alignment. */
export function legendRevert(): VizChanges {
  const { fontFamily, color, fontSize, enabled, verticalAlign, title } = LEGEND_DEFAULTS;
  return {
    ...legendStyleChanges('fontFamily', fontFamily),
    ...legendStyleChanges('color', color),
    ...legendStyleChanges('fontSize', fontSize),
    'legend.enabled': enabled,
    'legend.verticalAlign': verticalAlign,
    'legend.title.text': title,
    'legend.maxHeight': undefined
  };
}

// Display: one series at a time (v1 `DisplayTab`)

/** The response's series to pick from, keyed like v1 (`vizKey`), sorted by name. */
export function seriesChoicesOf(response: SeriesOneResponse | undefined): SettingOption[] {
  const choices = (response?.series ?? []).map(series => ({ label: series.name, value: vizKey(series.name) }));
  return choices.toSorted((first, second) => first.label.localeCompare(second.label));
}

/** Where a series' own options live. */
export function seriesPath(key: string, path: string): string {
  return `plotOptions.series.response.${key}.${path}`;
}

/** The Highcharts type a series is drawn with: its own, else the chart's. */
export function seriesTypeOf(viz: VizOptions, key: string): string {
  const own: unknown = get(viz, seriesPath(key, 'type'));
  return typeof own === 'string' ? own : (viz.chart?.type ?? 'line');
}

/** v1 shows markers for every type but columns and bars. */
export function hasMarker(type: string): boolean {
  return type !== 'column' && type !== 'bar';
}

/** v1 shows the dash style for lines and areas. */
export function hasDash(type: string): boolean {
  return ['line', 'spline', 'area', 'areaspline'].includes(type);
}

/**
 * v1 `DisplayTab.handleRevert`. v1 also set the series' type to the chart type, which is not a Highcharts type for
 * inverted charts (`line_inverted`); v2 removes the series' own type, so it follows the chart's.
 */
export function displayRevert(key: string, name: string): VizChanges {
  return {
    [seriesPath(key, 'lineWidth')]: 2,
    [seriesPath(key, 'dashStyle')]: 'Solid',
    [seriesPath(key, 'marker.enabled')]: false,
    [seriesPath(key, 'type')]: undefined,
    [seriesPath(key, 'name')]: name,
    [seriesPath(key, 'yAxis')]: 0
  };
}

// Axes (v1 `XAxisTab`, `SeriesYAxisTab`, `SeriesDualYAxisTab`)

export const AXIS_DEFAULTS = {
  font: SECONDARY_FONT,
  color: TEXT_COLOR,
  fontSize: '11px',
  gridLineColor: GRID_LINE_COLOR,
  gridLineDashStyle: 'Solid',
  /** v1 kept the grid width as text. */
  gridLineWidth: '0.5',
  min: 0,
  max: 10000,
  dualTitle: 'Untitled',
  affixMaxLength: 10
} as const;

/** The default axis titles: the names of the zones' fields (v1 `getDefaultText`). */
export function axisTitlesOf(setting: JsonObject | undefined) {
  const yAxis = asArray(setting?.['y_axis']);
  return {
    x: asString(asRecord(setting?.['x_axis'])['name']),
    y: asString(asRecord(yAxis[0])['name'], 'Untitled'),
    dual: asString(asRecord(yAxis[1])['name'], AXIS_DEFAULTS.dualTitle)
  };
}

export type AxisTitles = ReturnType<typeof axisTitlesOf>;

/** Bars swap the axes, and v1 swapped the tabs' names with them. */
export function axisTabNames(chartType: string): { x: string; y: string } {
  return chartType === ChartType.Bar ? { x: 'Y Axis', y: 'X Axis' } : { x: 'X Axis', y: 'Y Axis' };
}

function axisStyleDefaults(axis: string, title: string): VizChanges {
  return {
    [`${axis}.labels.style.fontFamily`]: AXIS_DEFAULTS.font,
    [`${axis}.labels.style.fontSize`]: AXIS_DEFAULTS.fontSize,
    [`${axis}.labels.style.color`]: AXIS_DEFAULTS.color,
    [`${axis}.title.enabled`]: true,
    [`${axis}.title.text`]: title,
    [`${axis}.title.style.fontFamily`]: AXIS_DEFAULTS.font,
    [`${axis}.title.style.fontSize`]: AXIS_DEFAULTS.fontSize,
    [`${axis}.title.style.color`]: AXIS_DEFAULTS.color,
    [`${axis}.gridLineColor`]: AXIS_DEFAULTS.gridLineColor,
    [`${axis}.gridLineDashStyle`]: AXIS_DEFAULTS.gridLineDashStyle,
    [`${axis}.prefix.text`]: '',
    [`${axis}.postfix.text`]: ''
  };
}

/** v1 `XAxisTab.handleRevert`: no grid on series charts' x axis. */
export function xAxisRevert(title: string): VizChanges {
  return { ...axisStyleDefaults('xAxis[0]', title), 'xAxis[0].visible': true, 'xAxis[0].gridLineWidth': '0' };
}

function rangeDefaults(axis: string): VizChanges {
  return {
    [`${axis}.condition.enabled`]: false,
    [`${axis}.condition.min.enabled`]: false,
    [`${axis}.condition.max.enabled`]: false,
    [`${axis}.condition.min.value`]: AXIS_DEFAULTS.min,
    [`${axis}.condition.max.value`]: AXIS_DEFAULTS.max
  };
}

/** v1 `SeriesYAxisTab.defaultMainAxisConfig` (v1 stored the range as text; v2 as numbers, which the chart reads). */
export function yAxisRevert(title: string): VizChanges {
  return {
    ...axisStyleDefaults('yAxis[0]', title),
    ...rangeDefaults('yAxis[0]'),
    'yAxis[0].visible': true,
    'yAxis[0].gridLineWidth': AXIS_DEFAULTS.gridLineWidth,
    'yAxis[0].labels.format': '{value}'
  };
}

/** v1 `SeriesDualYAxisTab.defaultDualAxisConfig`: the dual axis off, with its default style. */
export function dualAxisRevert(title: string): VizChanges {
  return {
    ...axisStyleDefaults('yAxis[1]', title),
    ...rangeDefaults('yAxis[1]'),
    'yAxis[1].visible': false,
    'yAxis[1].gridLineWidth': AXIS_DEFAULTS.gridLineWidth,
    'yAxis[1].opposite': true,
    'yAxis[1].id': 'dual-axis',
    'yAxis[1].labels.format': '{value}'
  };
}

/** v1: hiding the y axis drops its min / max too. */
export function yAxisToggle(visible: boolean): VizChanges {
  return visible ? { 'yAxis[0].visible': true } : { 'yAxis[0].visible': false, 'yAxis[0].condition.enabled': false };
}

/**
 * v1 `SeriesDualYAxisTab.handleDualAxisChanged`: turning the dual axis on moves the second series onto it; turning it
 * off moves every series back to the main axis and drops its min / max.
 */
export function dualAxisToggle(visible: boolean, seriesKeys: readonly string[]): VizChanges {
  if (visible) {
    const second = seriesKeys[1];
    return { 'yAxis[1].visible': true, ...(second !== undefined && { [seriesPath(second, 'yAxis')]: 1 }) };
  }
  return {
    'yAxis[1].visible': false,
    'yAxis[1].condition.enabled': false,
    ...Object.fromEntries(seriesKeys.map(key => [seriesPath(key, 'yAxis'), 0]))
  };
}

/** v1: gridlines on are 0.5px wide, off are 0. */
export function gridToggle(axis: string, enabled: boolean): VizChanges {
  return { [`${axis}.gridLineWidth`]: enabled ? AXIS_DEFAULTS.gridLineWidth : '0' };
}

/** A min or max bound turned on keeps the value shown, so the chart uses what the tab displays. */
export function boundToggle(path: string, enabled: boolean, shown: number): VizChanges {
  return enabled ? { [`${path}.enabled`]: true, [`${path}.value`]: shown } : { [`${path}.enabled`]: false };
}

// Data labels (v1 `DataLabelTab`)

export const DATA_LABEL_DEFAULTS = {
  enabled: false,
  labelFormat: 'name_and_value',
  fontFamily: SECONDARY_FONT,
  color: TEXT_COLOR,
  fontSize: '12px',
  distance: 30,
  min: 0,
  max: 100
} as const;

const PIES = new Set<string>([ChartType.Pie, ChartType.SemiPie, ChartType.Donut]);

/** Where the chart's data labels live (v1 `DataLabelTab.seriesKey`). */
export function dataLabelPath(chartType: string): string {
  return PIES.has(chartType) ? 'plotOptions.pie.dataLabels' : 'plotOptions.series.dataLabels';
}

/** Which data label settings a chart has: label format and distance on pies, a min / max condition on series. */
export function dataLabelSettingsOf(chartType: string) {
  const pie = PIES.has(chartType);
  return { labelFormat: pie, distance: pie, condition: !pie };
}

/** v1 `DataLabelTab.handleRevert`. */
export function dataLabelRevert(chartType: string): VizChanges {
  const path = dataLabelPath(chartType);
  const shown = dataLabelSettingsOf(chartType);
  return {
    [`${path}.enabled`]: DATA_LABEL_DEFAULTS.enabled,
    [`${path}.style.fontSize`]: DATA_LABEL_DEFAULTS.fontSize,
    [`${path}.style.color`]: DATA_LABEL_DEFAULTS.color,
    [`${path}.style.fontFamily`]: DATA_LABEL_DEFAULTS.fontFamily,
    [`${path}.displayUnit`]: 'default',
    ...(shown.labelFormat && { [`${path}.labelFormat`]: DATA_LABEL_DEFAULTS.labelFormat }),
    ...(shown.distance && { [`${path}.distance`]: DATA_LABEL_DEFAULTS.distance }),
    ...(shown.condition && {
      [`${path}.condition.enabled`]: false,
      [`${path}.condition.min`]: { enabled: false, value: DATA_LABEL_DEFAULTS.min },
      [`${path}.condition.max`]: { enabled: false, value: DATA_LABEL_DEFAULTS.max }
    })
  };
}

// Stack, areas only (v1 `SeriesGeneralTab`)

export type Stacking = 'none' | 'value' | 'percent';

export function stackingOf(viz: VizOptions): Stacking {
  const stacking: unknown = get(viz, 'plotOptions.area.stacking');
  return stacking === 'value' || stacking === 'percent' ? stacking : 'none';
}

export function stackChanges(stacking: Stacking): VizChanges {
  return { 'plotOptions.area.stacking': stacking === 'none' ? undefined : stacking };
}
