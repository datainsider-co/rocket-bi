import type Highcharts from 'highcharts';
import { describe, expect, it } from 'vitest';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type SeriesOneResponse, type SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import { vizFromSetting, type VizOptions } from '@/core/query/vizOptions';
import { isInsideCondition } from './highchartsBase';
import { buildPieChartOptions } from './pie/pieChartOptions';
import { buildSeriesChartOptions } from './series/seriesChartOptions';

const THEME = ['#111111', '#222222'];
const vizOf = (id: number) => vizFromSetting(fixture.widgets.find(widget => widget.id === id)!.setting as Record<string, unknown>).options;
const seriesResponse = visualizationResponseFromJson(responses.series_chart_setting) as SeriesOneResponse;
const pieResponse = visualizationResponseFromJson(responses.pie_chart_setting) as SeriesTwoResponse;

type Formatter = (this: unknown) => string;
const callFormatter = (formatter: unknown, context: unknown) => (formatter as Formatter).call(context);

describe('buildSeriesChartOptions', () => {
  const options = buildSeriesChartOptions({ options: vizOf(4), response: seriesResponse, themeColors: THEME, timestampXAxis: false });

  it('draws one series per response series with the stored chart type', () => {
    expect(options.chart?.type).toBe('column');
    expect(options.series).toHaveLength(1);
    expect(options.series?.[0]).toMatchObject({ name: 'Revenue', type: 'column', data: seriesResponse.series[0]?.data, stack: undefined });
  });

  it('puts the response categories on the x axis', () => {
    const [xAxis] = options.xAxis as Highcharts.XAxisOptions[];
    expect(xAxis).toMatchObject({ type: 'category', categories: seriesResponse.xAxis, visible: true, gridLineWidth: '0' });
  });

  it('uses the theme palette, the stored title and v1 defaults', () => {
    expect(options.colors).toEqual(THEME);
    expect(options.title).toMatchObject({ text: 'Revenue by region', style: { color: 'var(--text-color)' } });
    expect(options.credits).toEqual({ enabled: false });
    expect(options.chart).toMatchObject({ backgroundColor: '', zoomType: 'x' });
  });

  it('formats labels and tooltips with display units', () => {
    const dataLabels = options.plotOptions?.series?.dataLabels as Highcharts.DataLabelsOptions;
    expect(callFormatter(dataLabels.formatter, { y: 34330243.25 })).toContain('34.33M');
    const tooltip = callFormatter(options.tooltip?.formatter, { category: 'Asia', y: 1500, color: '#111', series: { name: 'Revenue' } });
    expect(tooltip).toContain('Asia');
    expect(tooltip).toContain('Revenue: <b>1.50k</b>');
  });

  it('applies per series settings and types looked up by camelCase name', () => {
    const viz: VizOptions = { chart: { type: 'column' }, typesByLabel: { revenue: 'line' }, plotOptions: { series: { response: { revenue: { color: '#f00' } } } as never } };
    const [series] = buildSeriesChartOptions({ options: viz, response: seriesResponse, themeColors: THEME, timestampXAxis: false }).series ?? [];
    expect(series).toMatchObject({ type: 'line', color: '#f00' });
  });

  it('pairs timestamps with values on a datetime axis', () => {
    const response: SeriesOneResponse = { kind: 'series_one', xAxis: ['1000', '2000'], yAxis: [], series: [{ name: 'a', data: [1, 2] }] };
    const built = buildSeriesChartOptions({ options: {}, response, themeColors: THEME, timestampXAxis: true });
    expect(built.xAxis).toMatchObject({ type: 'datetime' });
    expect(built.series?.[0]).toMatchObject({ data: [[1000, 1], [2000, 2]] });
  });

  it('turns stacking none off and adds a dual axis on request', () => {
    const viz: VizOptions = { dualAxis: 1, yAxis: [{ title: { text: 'Main' }, visible: true }], plotOptions: { series: { stacking: 'none' as never } } };
    const built = buildSeriesChartOptions({ options: viz, response: seriesResponse, themeColors: THEME, timestampXAxis: false });
    expect(built.plotOptions?.series?.stacking).toBeUndefined();
    expect((built.yAxis as Highcharts.YAxisOptions[])[1]).toMatchObject({ opposite: true, id: 'dual-axis', visible: true });
  });
});

describe('buildPieChartOptions', () => {
  const options = buildPieChartOptions({ options: vizOf(6), response: pieResponse, themeColors: THEME });

  it('draws the response points', () => {
    expect(options.series?.[0]).toMatchObject({ type: 'pie', name: 'sales_channel', data: [['Offline', 587060], ['Online', 441986]] });
    expect(options.title).toMatchObject({ text: 'Units by channel' });
    expect(options.legend).toMatchObject({ enabled: true });
  });

  it('labels points with name and value by default', () => {
    const dataLabels = options.plotOptions?.pie?.dataLabels as Highcharts.DataLabelsOptions;
    expect(callFormatter(dataLabels.formatter, { name: 'Online', y: 441986 })).toContain('Online : 441.99k');
  });

  it('can label with the percentage', () => {
    const viz: VizOptions = { plotOptions: { pie: { dataLabels: { labelFormat: 'name_and_percent' } as never } } };
    const built = buildPieChartOptions({ options: viz, response: pieResponse, themeColors: THEME });
    const dataLabels = built.plotOptions?.pie?.dataLabels as Highcharts.DataLabelsOptions;
    expect(callFormatter(dataLabels.formatter, { name: 'Online', percentage: 42.951 })).toContain('Online : 42.95 %');
  });
});

describe('isInsideCondition', () => {
  it('shows every value without a condition', () => {
    expect(isInsideCondition(5, undefined)).toBe(true);
    expect(isInsideCondition(5, { enabled: false, min: { enabled: true, value: 10 } })).toBe(true);
  });

  it('keeps values within both bounds', () => {
    const condition = { enabled: true, min: { enabled: true, value: 10, equal: true }, max: { enabled: true, value: 20 } };
    expect(isInsideCondition(10, condition)).toBe(true);
    expect(isInsideCondition(9, condition)).toBe(false);
    expect(isInsideCondition(20, condition)).toBe(false);
  });
});
