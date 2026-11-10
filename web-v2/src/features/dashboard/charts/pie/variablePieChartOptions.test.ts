import type Highcharts from 'highcharts';
import { describe, expect, it } from 'vitest';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type GenericResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { buildVariablePieChartOptions } from './variablePieChartOptions';

const THEME = ['#111111', '#222222'];
const response = visualizationResponseFromJson(responses.generic_chart_setting) as GenericResponse;
const withoutWeight: GenericResponse = { kind: 'generic', headers: ['sales_channel', 'Units'], records: [['Offline', 587060]] };

type Formatter = (this: unknown) => string;
const call = (formatter: unknown, context: unknown) => (formatter as Formatter).call(context);

describe('buildVariablePieChartOptions', () => {
  it('draws each record as a slice, its weight as z', () => {
    const options = buildVariablePieChartOptions({ options: {}, response, themeColors: THEME });
    expect(options.chart?.type).toBe('variablepie');
    expect(options.series?.[0]).toEqual({
      type: 'variablepie',
      name: 'sales_channel',
      data: [
        { name: 'Offline', y: 587060, z: 5699.6117 },
        { name: 'Online', y: 441986, z: 4556.5567 }
      ]
    });
  });

  it('names the value and the weight in the tooltip by their columns', () => {
    const point = { name: 'Online', y: 441986, z: 4556.5567, color: '#123' };
    const tooltip = call(buildVariablePieChartOptions({ options: { precision: 0 }, response, themeColors: THEME }).tooltip?.formatter, point);
    expect(tooltip).toContain('Units: <b>442k</b>');
    expect(tooltip).toContain('Average units: <b>5k</b>');
    const noWeight = call(buildVariablePieChartOptions({ options: {}, response: withoutWeight, themeColors: THEME }).tooltip?.formatter, point);
    expect(noWeight).not.toContain('Average units');
  });

  it('reads its labels under series, where its Data Label tab writes them', () => {
    const viz = { plotOptions: { series: { dataLabels: { enabled: true, style: { color: 'red' }, displayUnit: 'none' } } } } as VizOptions;
    const options = buildVariablePieChartOptions({ options: viz, response, themeColors: THEME });
    const dataLabels = options.plotOptions?.variablepie?.dataLabels as Highcharts.DataLabelsOptions;
    expect(options.plotOptions?.series?.dataLabels).toMatchObject({ enabled: true });
    expect(call(dataLabels.formatter, { name: 'Online', y: 5 })).toBe('<div style="color:red">Online : 5.00</div>');
  });
});
