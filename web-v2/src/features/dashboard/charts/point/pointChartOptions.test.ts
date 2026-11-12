import { describe, expect, it } from 'vitest';
import type { SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { buildPointChartOptions, pointOf } from './pointChartOptions';

const THEME = ['#111111', '#222222'];
const NAMES = { x: 'Price', y: 'Units', value: 'Profit <b>' };
const response: SeriesTwoResponse = {
  kind: 'series_two',
  total: 0,
  series: [
    { name: 'Online', data: [], points: [[651.21, 9247, 3.5], [205.7, null, 1]] },
    { name: '', data: [], points: [['n/a', 4279, 2]] }
  ]
};

type Formatter = (this: unknown) => string;
const call = (formatter: unknown, context: unknown) => (formatter as Formatter).call(context);
const build = (type: 'scatter' | 'bubble', options: VizOptions = {}) => buildPointChartOptions({ type, options, response, themeColors: THEME, names: NAMES });

describe('pointOf', () => {
  it('reads x and y for a scatter, and the size too for a bubble', () => {
    expect(pointOf('scatter', [1, 2, 3])).toEqual([1, 2]);
    expect(pointOf('bubble', [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('gives null for what is not a number', () => {
    expect(pointOf('bubble', ['a', null])).toEqual([null, null]);
    expect(pointOf('scatter', [Number.NaN, 5])).toEqual([null, 5]);
  });
});

describe('buildPointChartOptions', () => {
  it('draws a series per legend value, each point a pair of numbers', () => {
    const options = build('scatter');
    expect(options.chart).toMatchObject({ type: 'scatter', zooming: { type: 'xy' } });
    expect(options.series).toEqual([
      { type: 'scatter', name: 'Online', data: [[651.21, 9247], [205.7, null]] },
      { type: 'scatter', name: '', data: [[null, 4279]] }
    ]);
    expect(options.colors).toEqual(THEME);
  });

  it('sizes each bubble by its third number', () => {
    const options = build('bubble');
    expect(options.chart).toMatchObject({ type: 'bubble', plotBorderWidth: 0.5 });
    expect(options.series?.[0]).toMatchObject({ type: 'bubble', data: [[651.21, 9247, 3.5], [205.7, null, 1]] });
    expect((options.yAxis as object[])[0]).toMatchObject({ startOnTick: false, endOnTick: false });
  });

  it('names each number by its column in the tooltip, the size for a bubble only', () => {
    const point = { x: 651.21, y: 9247, z: 3.5, color: '#123', series: { name: 'On<line' } };
    const scatter = call(build('scatter', { precision: 0 }).tooltip?.formatter, point);
    expect(scatter).toContain('On&lt;line');
    expect(scatter).toContain('Price: <b>651</b>');
    expect(scatter).toContain('Units: <b>9k</b>');
    expect(scatter).not.toContain('Profit');
    expect(call(build('bubble', { precision: 0 }).tooltip?.formatter, point)).toContain('Profit &lt;b&gt;: <b>4</b>');
  });

  it('formats both axes with their prefix and postfix', () => {
    const options = build('scatter', { precision: 0, xAxis: [{ prefix: { text: '$' } }], yAxis: [{ postfix: { text: ' pcs' } }] } as VizOptions);
    const labelsOf = (axis: unknown) => (axis as { labels: { formatter: unknown } }[])[0]?.labels.formatter;
    expect(call(labelsOf(options.xAxis), { value: 1200 })).toBe('$1k');
    expect(call(labelsOf(options.yAxis), { value: 5 })).toBe('5 pcs');
  });

  it('keeps the stored options over the defaults, and does not change them', () => {
    const stored = { xAxis: [{ gridLineWidth: 2 }], legend: { enabled: false } } as VizOptions;
    const before = JSON.stringify([stored, response]);
    const options = build('scatter', stored);
    expect((options.xAxis as object[])[0]).toMatchObject({ gridLineWidth: 2, lineWidth: 0.5 });
    expect(options.legend).toMatchObject({ enabled: false });
    expect(JSON.stringify([stored, response])).toBe(before);
  });
});
