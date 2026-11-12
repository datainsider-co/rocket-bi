import { describe, expect, it } from 'vitest';
import type { GenericResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { buildRangeChartOptions, isRangeChart } from './rangeChartOptions';

const THEME = ['#111111', '#222222'];
const response: GenericResponse = {
  kind: 'generic',
  headers: ['region', 'Lowest', 'Highest'],
  records: [
    ['Asia', 10, 2500.5],
    ['Europe', null, 900]
  ]
};

type Formatter = (this: unknown) => string;
const call = (formatter: unknown, context: unknown) => (formatter as Formatter).call(context);
const viz = (type: string, extra: object = {}) => ({ chart: { type }, ...extra }) as VizOptions;

describe('isRangeChart', () => {
  it.each([
    ['arearange', true],
    ['columnrange', true],
    ['variablepie', false],
    [undefined, false]
  ])('%s: %s', (type, expected) => {
    expect(isRangeChart(type === undefined ? {} : viz(type))).toBe(expected);
  });
});

describe('buildRangeChartOptions', () => {
  it.each(['arearange', 'columnrange'] as const)('draws each record of a %s as a low and a high, under its category', type => {
    const options = buildRangeChartOptions({ options: viz(type), response, themeColors: THEME });
    expect(options.chart?.type).toBe(type);
    expect(options.xAxis).toMatchObject([{ categories: ['Asia', 'Europe'] }]);
    expect(options.series).toEqual([
      {
        type,
        name: 'region',
        data: [
          { name: 'Asia', low: 10, high: 2500.5 },
          { name: 'Europe', low: null, high: 900 }
        ]
      }
    ]);
    expect(options.colors).toEqual(THEME);
  });

  it('draws an area range when the stored type is anything else', () => {
    expect(buildRangeChartOptions({ options: {}, response, themeColors: THEME }).chart?.type).toBe('arearange');
  });

  it('keeps the stored options, such as the inverted axes of a column range', () => {
    const options = buildRangeChartOptions({ options: viz('columnrange', { chart: { type: 'columnrange', inverted: true } }), response, themeColors: THEME });
    expect(options.chart).toMatchObject({ type: 'columnrange', inverted: true });
  });

  it('says the range in the tooltip, named after the x axis column', () => {
    const options = buildRangeChartOptions({ options: viz('columnrange', { precision: 0 }), response, themeColors: THEME });
    const tooltip = call(options.tooltip?.formatter, { name: 'Asia <b>', low: 10, high: 2500.5, color: '#123' });
    expect(tooltip).toContain('Asia &lt;b&gt;');
    expect(tooltip).toContain('region: <b>10 - 3k</b>');
    expect(call(options.tooltip?.formatter, { category: 'Europe', color: '#123' })).toContain('region: <b>0 - 0</b>');
  });

  it('formats axis labels with the axis prefix and postfix, and data labels in their color', () => {
    const stored = viz('arearange', {
      precision: 0,
      yAxis: [{ prefix: { text: '$' }, postfix: { text: ' USD' } }],
      plotOptions: { series: { dataLabels: { style: { color: 'red' }, displayUnit: 'none' } } }
    });
    const options = buildRangeChartOptions({ options: stored, response, themeColors: THEME });
    const yAxis = options.yAxis as { labels: { formatter: unknown } }[];
    expect(call(yAxis[0]?.labels.formatter, { value: 1200 })).toBe('$1,200 USD');
    expect(call(yAxis[1]?.labels.formatter, { value: 5 })).toBe('5');
    expect(call(options.plotOptions?.series?.dataLabels && (options.plotOptions.series.dataLabels as { formatter: unknown }).formatter, { y: 7 })).toBe(
      '<div style="color: red">7</div>'
    );
  });

  it('does not change the stored options or the response', () => {
    const stored = viz('arearange', { yAxis: [{}] });
    const before = JSON.stringify([stored, response]);
    buildRangeChartOptions({ options: stored, response, themeColors: THEME });
    expect(JSON.stringify([stored, response])).toBe(before);
  });
});
