import { ChartType } from '@/core/chart-builder/chartType';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { filterControlKindOf } from './filter/filterTabs.utils';

const SERIES = new Set<string>([
  ChartType.Column,
  ChartType.Bar,
  ChartType.Lollipop,
  ChartType.Line,
  ChartType.Spline,
  ChartType.LineInverted,
  ChartType.Area,
  ChartType.AreaInverted
]);

const STACKED = new Set<string>([ChartType.StackedColumn, ChartType.StackedBar, ChartType.CircularBar, ChartType.WindRose]);

/** The pie family's tabs (v1 `PieSetting`, `DonutSetting`, `VariablepieSetting`, `FunnelSetting`, `PyramidSetting`). */
const PIES = new Set<string>([ChartType.Pie, ChartType.SemiPie, ChartType.Donut, ChartType.VariablePie, ChartType.Funnel, ChartType.Pyramid]);

/** Scatter and bubble (v1 `ScatterSetting`, `BubbleSetting`). */
const POINTS = new Set<string>([ChartType.Scatter, ChartType.Bubble]);

const TABLES = new Set<string>([ChartType.Table, ChartType.CollapseTable, ChartType.PivotTable]);

export type SettingsKind = 'series' | 'stacked' | 'point' | 'wordCloud' | 'pie' | 'parliament' | 'number' | 'table' | 'filter';

/** Which settings a chart type has (v1 picked the component by viz option class); `undefined` while v2 has none. */
export function settingsKindOf(chartType: string): SettingsKind | undefined {
  if (SERIES.has(chartType)) return 'series';
  if (STACKED.has(chartType)) return 'stacked';
  if (POINTS.has(chartType)) return 'point';
  if (PIES.has(chartType)) return 'pie';
  if (chartType === ChartType.Parliament) return 'parliament';
  if (chartType === ChartType.WordCloud) return 'wordCloud';
  if (chartType === ChartType.Number) return 'number';
  if (TABLES.has(chartType)) return 'table';
  return filterControlKindOf(chartType) ? 'filter' : undefined;
}

/** v1 puts the Legend tab first on pies, donuts and variable pies, after Title & Subtitle on funnels and pyramids. */
export function isLegendFirst(chartType: string): boolean {
  return chartType !== ChartType.Funnel && chartType !== ChartType.Pyramid;
}

/** v1 `SeriesGeneralTab` (stacking) shows on areas only. */
export function hasStackTab(chartType: string): boolean {
  return chartType === ChartType.Area;
}

/** The preview's series response, which the Display and Dual Y Axis tabs pick series from. */
export function seriesResponseOf(response: VisualizationResponse | undefined) {
  return response?.kind === 'series_one' ? response : undefined;
}
