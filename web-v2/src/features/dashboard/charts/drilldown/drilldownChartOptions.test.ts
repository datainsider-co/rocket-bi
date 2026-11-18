import type Highcharts from 'highcharts';
import { describe, expect, it, vi } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import { defaultVizOptions } from '@/core/chart-builder/defaultVizOptions';
import { visualizationResponseFromJson, type DrilldownResponse } from '@/core/query/VisualizationResponse';
import { vizFromSetting, type VizOptions } from '@/core/query/vizOptions';
// The local backend's reply for legends sales_channel, order_priority, region (levels cut to four).
import responses from '@/core/query/queryResponses.fixture.json';
import { buildDrilldownChartOptions, drilldownChartTypeOf } from './drilldownChartOptions';
import type { LevelStep } from './drilldownLevels.utils';

const THEME = ['#111111', '#222222'];
const response = visualizationResponseFromJson(responses.drilldown_chart_setting) as DrilldownResponse;
const empty: DrilldownResponse = { kind: 'drilldown', name: 'region', series: [], drilldown: [] };
const offline = { id: 'Offline', name: 'Offline' };
const offlineC = { id: 'Offline.C', name: 'C' };

const vizOf = (chartType: string) => vizFromSetting({ options: defaultVizOptions(chartType) });

type Formatter = (this: unknown) => string;
const call = (formatter: unknown, context: unknown) => (formatter as Formatter).call(context);
type Series = { type: string; name: string; colorByPoint: boolean; data: { name: string; y: number | null; custom?: { drilldown: string } }[] };
const seriesOf = (options: Highcharts.Options) => options.series as unknown as Series[];
type Click = (this: unknown) => void;
const clickOf = (options: Highcharts.Options) => options.plotOptions?.series?.point?.events?.click as unknown as Click;

describe('drilldownChartTypeOf', () => {
  it.each([
    [ChartType.ColumnDrilldown, 'column'],
    [ChartType.BarDrilldown, 'bar'],
    [ChartType.PieDrilldown, 'pie']
  ])("draws a new %s as a %s, by v1's default options", (chartType, type) => {
    expect(drilldownChartTypeOf(vizOf(chartType))).toBe(type);
  });

  it('draws columns when the options name no type, as charts stored before the per-type defaults do', () => {
    expect(drilldownChartTypeOf({ className: 'highcharts_drilldown_chart_setting', options: {} })).toBe('column');
  });

  it('is undefined for other charts, a plain pie and column included', () => {
    expect(drilldownChartTypeOf(vizOf(ChartType.Pie))).toBeUndefined();
    expect(drilldownChartTypeOf(vizOf(ChartType.Column))).toBeUndefined();
  });
});

describe('buildDrilldownChartOptions', () => {
  it("draws the first legend's points as one series named after the value, each point its own color", () => {
    const options = buildDrilldownChartOptions({ type: 'column', options: {}, response, themeColors: THEME, valueName: 'total_revenue' });
    expect(options.chart?.type).toBe('column');
    expect(options.colors).toEqual(THEME);
    expect(seriesOf(options)).toEqual([
      {
        type: 'column',
        name: 'total_revenue',
        colorByPoint: true,
        data: [
          { name: 'Offline', y: 127922581.88999999, custom: { drilldown: 'Offline' } },
          { name: 'Online', y: 122848776.47999996, custom: { drilldown: 'Online' } }
        ]
      }
    ]);
    expect(options.xAxis).toMatchObject([{ type: 'category', categories: ['Offline', 'Online'] }]);
  });

  it('draws the level the viewer clicked into, named as the server names it', () => {
    const options = buildDrilldownChartOptions({ type: 'bar', options: {}, response, steps: [offline], themeColors: THEME, valueName: 'total_revenue' });
    const [series] = seriesOf(options);
    expect(series).toMatchObject({ type: 'bar', name: 'Offline' });
    expect(series?.data.map(point => point.name)).toEqual(['C', 'H', 'L', 'M']);
    expect(options.xAxis).toMatchObject([{ categories: ['C', 'H', 'L', 'M'] }]);
  });

  it('drills on a click on a point with a level under it, and only then', () => {
    const onDrill = vi.fn<(step: LevelStep) => void>();
    const options = buildDrilldownChartOptions({ type: 'column', options: {}, response, steps: [offline], themeColors: THEME, onDrill });
    const [c, , l] = seriesOf(options)[0]?.data ?? [];
    clickOf(options).call({ name: 'L', options: l });
    expect(onDrill).not.toHaveBeenCalled();
    clickOf(options).call({ name: 'C', options: c });
    expect(onDrill).toHaveBeenCalledExactlyOnceWith({ id: 'Offline.C', name: 'C' });
  });

  it('shows a pointer while the level has points to click, and none on the last level', () => {
    const first = buildDrilldownChartOptions({ type: 'column', options: {}, response, themeColors: THEME });
    expect(first.plotOptions?.series?.cursor).toBe('pointer');
    const last = buildDrilldownChartOptions({ type: 'column', options: {}, response, steps: [offline, offlineC], themeColors: THEME });
    expect(last.plotOptions?.series?.cursor).toBe('default');
    expect(seriesOf(last)[0]?.data.every(point => point.custom === undefined)).toBe(true);
    // A click on the last level does nothing, without a handler either.
    expect(() => clickOf(first).call({ name: 'Offline', options: seriesOf(first)[0]?.data[0] })).not.toThrow();
  });

  it("writes values with the Other tab's format in the tooltip, the labels and the value axis", () => {
    const stored = { precision: 1, plotOptions: { series: { dataLabels: { enabled: true, style: { color: 'red' } } } }, yAxis: [{ prefix: { text: '$' } }] } as VizOptions;
    const options = buildDrilldownChartOptions({ type: 'column', options: stored, response, themeColors: THEME, valueName: 'total_revenue' });
    const tooltip = call(options.tooltip?.formatter, { name: 'A<b>', y: 127922581.89, color: '#111111', series: { name: 'total_revenue' } });
    expect(tooltip).toContain('<span>total_revenue</span>');
    expect(tooltip).toContain('A&lt;b&gt;: <b>127.9M</b>');
    const labels = options.plotOptions?.series?.dataLabels as { formatter: unknown };
    expect(call(labels.formatter, { y: 1500 })).toBe('<div style="color: red">1.5k</div>');
    const [yAxis] = options.yAxis as Highcharts.YAxisOptions[];
    expect(call(yAxis?.labels?.formatter, { value: 2_000_000 })).toBe('$2.0M');
    expect(call(options.tooltip?.formatter, { name: 'None', color: '#111111', series: { name: '' } })).toContain('None: <b>0.0</b>');
  });

  it("starts columns at zero and keeps v1's thin axis line", () => {
    const options = buildDrilldownChartOptions({ type: 'column', options: vizOf(ChartType.ColumnDrilldown).options, response, themeColors: THEME });
    expect(options.plotOptions?.series).not.toHaveProperty('threshold');
    expect(options.plotOptions?.series?.borderWidth).toBe(0);
    expect(options.xAxis).toMatchObject([{ lineWidth: 0.5, visible: true }]);
    expect(options.yAxis).toMatchObject([{ tickLength: 0, gridLineWidth: '0.5' }, { visible: false }]);
    expect(options.legend?.enabled).toBe(false);
  });

  it('draws the pie without axes, a click drilling instead of pulling the slice out', () => {
    const options = buildDrilldownChartOptions({ type: 'pie', options: vizOf(ChartType.PieDrilldown).options, response, themeColors: THEME, valueName: 'total_revenue' });
    expect(options.chart?.type).toBe('pie');
    expect(options).not.toHaveProperty('xAxis');
    expect(options).not.toHaveProperty('yAxis');
    expect(options.plotOptions?.pie).toMatchObject({ allowPointSelect: false, cursor: 'pointer', borderWidth: 0, dataLabels: { enabled: false } });
    expect(seriesOf(options)[0]).toMatchObject({ type: 'pie', name: 'total_revenue', colorByPoint: true });
  });

  it("shows the pie's labels once the Data Label tab turns them on, as name and value", () => {
    const stored = { plotOptions: { series: { dataLabels: { enabled: true, style: { color: 'blue' } } } } } as VizOptions;
    const options = buildDrilldownChartOptions({ type: 'pie', options: stored, response, steps: [offline, offlineC], themeColors: THEME });
    const labels = options.plotOptions?.pie?.dataLabels as { enabled: boolean; formatter: unknown };
    expect(labels.enabled).toBe(true);
    expect(call(labels.formatter, { name: 'Asia', y: 2192780.31 })).toBe('<div style="color:blue">Asia : 2.19M</div>');
    expect(options.plotOptions?.pie?.cursor).toBe('default');
  });

  it('draws an empty series for an empty response', () => {
    const options = buildDrilldownChartOptions({ type: 'column', options: {}, response: empty, themeColors: THEME });
    expect(seriesOf(options)).toEqual([{ type: 'column', name: '', colorByPoint: true, data: [] }]);
    expect(options.plotOptions?.series?.cursor).toBe('default');
  });

  it("takes the chart's own colors and title, and does not change the stored options or the response", () => {
    const stored = { title: { text: 'Channels', enabled: true }, themeColor: { enabled: false, colors: ['#abc'] }, xAxis: [{ visible: true }] } as VizOptions;
    const before = JSON.stringify([stored, response]);
    const options = buildDrilldownChartOptions({ type: 'pie', options: stored, response, themeColors: THEME });
    expect(options.title?.text).toBe('Channels');
    expect(options.colors).toEqual(['#abc']);
    expect(JSON.stringify([stored, response])).toBe(before);
  });
});
