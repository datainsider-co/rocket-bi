import { ChartType } from '@/core/chart-builder/chartType';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';

const SERIES = new Set<string>([ChartType.Column, ChartType.Bar, ChartType.Line, ChartType.Spline, ChartType.LineInverted, ChartType.Area, ChartType.AreaInverted]);

const PIES = new Set<string>([ChartType.Pie, ChartType.SemiPie, ChartType.Donut]);

export type SettingsKind = 'series' | 'pie' | 'number' | 'table';

/** Which settings a chart type has (v1 picked the component by viz option class); `undefined` while v2 has none. */
export function settingsKindOf(chartType: string): SettingsKind | undefined {
  if (SERIES.has(chartType)) return 'series';
  if (PIES.has(chartType)) return 'pie';
  if (chartType === ChartType.Number) return 'number';
  return chartType === ChartType.Table ? 'table' : undefined;
}

/** v1 `SeriesGeneralTab` (stacking) shows on areas only. */
export function hasStackTab(chartType: string): boolean {
  return chartType === ChartType.Area;
}

/** The preview's series response, which the Display and Dual Y Axis tabs pick series from. */
export function seriesResponseOf(response: VisualizationResponse | undefined) {
  return response?.kind === 'series_one' ? response : undefined;
}
