import { describe, expect, it } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { hasStackGroups, stackedAxisSettingsOf, stackGroupChange, stackGroupsOf, stackingValueOf } from './stackedTabs.utils';

const response: SeriesOneResponse = {
  kind: 'series_one',
  xAxis: ['Asia'],
  yAxis: [],
  series: [
    { name: 'Online.C', data: [1], stack: 'Online' },
    { name: 'Offline.C', data: [2], stack: 'Offline' },
    { name: 'total_cost', data: [3] }
  ]
};

describe('stackingValueOf', () => {
  it('reads the stacking, by value when unset', () => {
    expect(stackingValueOf({ plotOptions: { series: { stacking: 'percent' } } })).toBe('percent');
    expect(stackingValueOf({})).toBe('normal');
  });
});

describe('stackGroupsOf', () => {
  it("lists the series in the response's order with the stack each is drawn in", () => {
    expect(stackGroupsOf({ stackingGroup: { offlineC: 'Mine' } }, response)).toEqual([
      { key: 'onlineC', name: 'Online.C', stack: 'Online' },
      { key: 'offlineC', name: 'Offline.C', stack: 'Mine' },
      { key: 'totalCost', name: 'total_cost', stack: 'unGroup' }
    ]);
  });

  it('is empty without data', () => {
    expect(stackGroupsOf({}, undefined)).toEqual([]);
  });
});

describe('hasStackGroups', () => {
  it('needs more than one series', () => {
    expect(hasStackGroups(response)).toBe(true);
    expect(hasStackGroups({ ...response, series: response.series.slice(0, 1) })).toBe(false);
    expect(hasStackGroups(undefined)).toBe(false);
  });
});

describe('stackGroupChange', () => {
  it('moves the series into the typed group, trimmed', () => {
    expect(stackGroupChange('onlineC', ' A ')).toEqual({ 'stackingGroup.onlineC': 'A' });
  });

  it('gives the series back its own stack when emptied', () => {
    expect(stackGroupChange('onlineC', '  ')).toEqual({ 'stackingGroup.onlineC': undefined });
  });
});

describe('stackedAxisSettingsOf', () => {
  it('gives the circular bar x gridlines and no y range, the others the reverse', () => {
    expect(stackedAxisSettingsOf(ChartType.CircularBar)).toEqual({ xGrid: true, yRange: false });
    expect(stackedAxisSettingsOf(ChartType.StackedColumn)).toEqual({ xGrid: false, yRange: true });
  });
});
