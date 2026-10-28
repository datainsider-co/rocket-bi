import type Highcharts from 'highcharts';
import { describe, expect, it } from 'vitest';
import { asRecord } from '@/core/json/json';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { vizFromSetting, type VizOptions } from '@/core/query/vizOptions';
import sent from '@/core/chart-builder/builderRequests.fixture.json';
import { buildStackedChartOptions, DEFAULT_STACK, stackOf } from './stackedChartOptions';

const THEME = ['#111111', '#222222'];
/** Region by sales channel, broken down by order priority (local backend). */
const response = visualizationResponseFromJson(responses.stacked_series_chart_setting) as SeriesOneResponse;
const vizOf = (key: keyof typeof sent) => vizFromSetting(asRecord(sent[key].setting)).options;

type Formatter = (this: unknown) => string;

describe('stackOf', () => {
  const item = { name: 'Offline.C', data: [], stack: 'Offline' };

  it("keeps the server's stack: a legend value's breakdown values stack together", () => {
    expect(stackOf({}, item)).toBe('Offline');
  });

  it('puts a series without a stack into the shared one', () => {
    expect(stackOf({}, { name: 'total_cost', data: [] })).toBe(DEFAULT_STACK);
  });

  it('prefers the group picked in the Stack tab, by camelCase name', () => {
    expect(stackOf({ stackingGroup: { offlineC: 'mine' } }, item)).toBe('mine');
    expect(stackOf({ stackingGroup: { offlineC: '' } }, item)).toBe('Offline');
  });
});

describe('buildStackedChartOptions', () => {
  const options = buildStackedChartOptions({ options: vizOf('stack_column'), response, themeColors: THEME, timestampXAxis: false });

  it('draws every series with the chart type in its stack, stacked by value', () => {
    expect(options.chart?.type).toBe('column');
    expect(options.plotOptions?.series?.stacking).toBe('normal');
    expect(options.series?.map(series => { const { name, type, stack } = series as { name?: string; type?: string; stack?: string }; return [name, type, stack]; })).toEqual([
      ['Offline.C', 'column', 'Offline'],
      ['Offline.H', 'column', 'Offline'],
      ['Online.C', 'column', 'Online'],
      ['Online.H', 'column', 'Online']
    ]);
    expect((options.xAxis as Highcharts.XAxisOptions[])[0]).toMatchObject({ categories: response.xAxis });
  });

  it('applies a series name and a type set by label', () => {
    const viz: VizOptions = { ...vizOf('stack_column'), typesByLabel: { onlineH: 'area' }, plotOptions: { series: { response: { offlineC: { name: 'Offline, critical' } } } as never } };
    const [first, , , last] = buildStackedChartOptions({ options: viz, response, themeColors: THEME, timestampXAxis: false }).series ?? [];
    expect(first).toMatchObject({ name: 'Offline, critical', type: 'column' });
    expect(last).toMatchObject({ type: 'areaspline' });
  });

  it('lists every series of the category in one tooltip', () => {
    expect(options.tooltip?.shared).toBe(true);
    const points = [
      { y: 2192780.31, color: '#111', series: { name: 'Offline.C' } },
      { y: 1500, color: '#222', series: { name: 'Online.C' } }
    ];
    const formatter = options.tooltip?.formatter as Formatter;
    const html = formatter.call({ category: 'Asia', points });
    expect(html).toContain('Asia');
    expect(html).toContain('Offline.C: <b>2.19M</b>');
    expect(html).toContain('Online.C: <b>1.50k</b>');
  });

  it('keeps the circular bar on its polar pane', () => {
    const circular = buildStackedChartOptions({ options: vizOf('circular_bar'), response, themeColors: THEME, timestampXAxis: false });
    expect(circular.chart).toMatchObject({ type: 'column', polar: true, inverted: true });
    expect(circular.pane).toMatchObject({ size: '85%', innerSize: '20%', endAngle: 270 });
  });

  it('pairs timestamps with values on a datetime axis', () => {
    const timed: SeriesOneResponse = { kind: 'series_one', xAxis: ['1000'], yAxis: [], series: [{ name: 'a', data: [1] }] };
    const built = buildStackedChartOptions({ options: {}, response: timed, themeColors: THEME, timestampXAxis: true });
    expect(built.series?.[0]).toMatchObject({ data: [[1000, 1]], stack: DEFAULT_STACK, type: 'column' });
  });
});
