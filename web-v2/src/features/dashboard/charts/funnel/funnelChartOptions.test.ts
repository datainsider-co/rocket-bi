import type Highcharts from 'highcharts';
import { describe, expect, it } from 'vitest';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { buildFunnelChartOptions } from './funnelChartOptions';

const THEME = ['#111111', '#222222'];
const response = visualizationResponseFromJson(responses.pie_chart_setting) as SeriesTwoResponse;

type Formatter = (this: unknown) => string;
const call = (formatter: unknown, context: unknown) => (formatter as Formatter).call(context);

describe('buildFunnelChartOptions', () => {
  it('draws the response points as a funnel in its v1 shape, in the theme colors', () => {
    const options = buildFunnelChartOptions({ type: 'funnel', options: {}, response, themeColors: THEME });
    expect(options.chart?.type).toBe('funnel');
    expect(options.colors).toEqual(THEME);
    expect(options.plotOptions?.funnel).toMatchObject({ neckWidth: '20%', neckHeight: '25%', width: '60%', showInLegend: true });
    expect(options.series?.[0]).toEqual({ type: 'funnel', name: 'sales_channel', data: [{ name: 'Offline', y: 587060 }, { name: 'Online', y: 441986 }] });
  });

  it("reads the pyramid's labels under pyramid, with the stored options over the defaults", () => {
    const viz = { plotOptions: { pyramid: { dataLabels: { enabled: true, inside: true, labelFormat: 'name', displayUnit: 'thousand' } } } } as VizOptions;
    const options = buildFunnelChartOptions({ type: 'pyramid', options: viz, response, themeColors: THEME });
    const dataLabels = options.plotOptions?.pyramid?.dataLabels as Highcharts.DataLabelsOptions;
    expect(options.plotOptions?.pyramid).toMatchObject({ width: '80%' });
    expect(dataLabels).toMatchObject({ enabled: true, inside: true });
    expect(call(dataLabels.formatter, { name: 'Online', y: 441986 })).toBe('<div style="color:#fff">Online</div>');
  });

  it('heads the tooltip with the series on funnels and with the point on pyramids, like v1', () => {
    const point = { name: 'Online', y: 2, color: '#123', series: { name: 'sales_channel' } };
    const funnelTooltip = call(buildFunnelChartOptions({ type: 'funnel', options: {}, response, themeColors: THEME }).tooltip?.formatter, point);
    const pyramidTooltip = call(buildFunnelChartOptions({ type: 'pyramid', options: {}, response, themeColors: THEME }).tooltip?.formatter, point);
    expect(funnelTooltip).toContain('<span>sales_channel</span>');
    expect(funnelTooltip).toContain('Online: <b>2.00</b>');
    expect(pyramidTooltip).toContain('<span>Online</span>');
    expect(pyramidTooltip).toContain('sales_channel: <b>2.00</b>');
  });
});
