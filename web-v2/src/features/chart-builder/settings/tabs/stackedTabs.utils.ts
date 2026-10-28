import { get } from 'lodash-es';
import { ChartType } from '@/core/chart-builder/chartType';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { vizKey, type VizOptions } from '@/core/query/vizOptions';
import { stackOf } from '@/features/dashboard/charts/series/stackedChartOptions';
import type { SettingOption } from '../settingOptions';

/** The tabs of the stacked charts (v1 `StackSeriesSetting`, `CircularBarSetting`) that series charts don't have. */

/** v1 `StackTab.stackOptions`: what the stacks add up. */
export const STACKINGS: readonly SettingOption[] = [
  { label: 'Value', value: 'normal' },
  { label: 'Percentage', value: 'percent' }
];

export function stackingValueOf(viz: VizOptions): string {
  const stacking: unknown = get(viz, 'plotOptions.series.stacking');
  return typeof stacking === 'string' ? stacking : 'normal';
}

/** One series of the Stack tab: the stack it is drawn in. */
export interface StackGroupRow {
  readonly key: string;
  readonly name: string;
  readonly stack: string;
}

/** The response's series in its order, each with the stack the chart puts it in (v1 `StackTab.stackOf`). */
export function stackGroupsOf(viz: VizOptions, response: SeriesOneResponse | undefined): StackGroupRow[] {
  return (response?.series ?? []).map(item => ({ key: vizKey(item.name), name: item.name, stack: stackOf(viz, item) }));
}

/** v1 shows the Stack tab once there is more than one series to stack. */
export function hasStackGroups(response: SeriesOneResponse | undefined): boolean {
  return (response?.series.length ?? 0) > 1;
}

/**
 * A series moved into another stack (v1 `StackTab.handleStackSaved`). An empty group gives the series back its own
 * stack; v1 stored the empty text, which stacked every such series together.
 */
export function stackGroupChange(key: string, group: string): VizChanges {
  const trimmed = group.trim();
  return { [`stackingGroup.${key}`]: trimmed === '' ? undefined : trimmed };
}

/** Which axis settings a stacked chart has (v1 `XAxisTab.enableSettingGridLine`, `YAxisTab.isShowMinMaxConfig`). */
export function stackedAxisSettingsOf(chartType: string) {
  return { xGrid: chartType === ChartType.CircularBar, yRange: chartType !== ChartType.CircularBar };
}
