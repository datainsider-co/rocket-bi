import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import { isComparisonOn, isTrendLineOn, kpiComparisonOf, kpiTrendOf, trendChartOptions } from './kpiComparison.utils';

const viz = (options: object) => options as VizOptions;
const format = (value: number) => value.toFixed(1);
const on = { dataRange: { enabled: true }, comparison: { enabled: true }, trendLine: { enabled: true } };

describe('isComparisonOn / isTrendLineOn', () => {
  it('needs a date range', () => {
    expect(isComparisonOn(viz({ comparison: { enabled: true } }))).toBe(false);
    expect(isTrendLineOn(viz({ trendLine: { enabled: true } }))).toBe(false);
    expect(isComparisonOn(viz(on))).toBe(true);
    expect(isTrendLineOn(viz(on))).toBe(true);
  });
});

describe('kpiComparisonOf', () => {
  it('shows the signed change in percent, in the increase color', () => {
    expect(kpiComparisonOf(viz(on), 150, 100, format)).toEqual({
      percentage: 50,
      isDecrease: false,
      text: '+50%',
      color: '#07BC40',
      barText: '50% (100.0)',
      barColor: '#4dcf36',
      barIcon: 'di-icon-up'
    });
  });

  it('shows a decrease in its color, rounded to two decimals', () => {
    const comparison = kpiComparisonOf(viz({ ...on, percentage: { decreaseColor: '#f00' } }), 2091134.49, 2923450.18, format);
    expect(comparison).toMatchObject({ percentage: -28.47, isDecrease: true, text: '-28.47%', color: '#f00', barIcon: 'di-icon-down', barColor: '#ea6b6b' });
  });

  it('shows the formatted compared value when asked', () => {
    expect(kpiComparisonOf(viz({ ...on, percentage: { display: 'value' } }), 150, 100, format)?.text).toBe('+100.0');
  });

  it("takes the value's color when inherited", () => {
    expect(kpiComparisonOf(viz({ ...on, style: { color: '#123' }, percentage: { colorByInherit: true } }), 50, 100, format)?.color).toBe('#123');
  });

  it.each([
    ['comparison off', viz({ dataRange: { enabled: true } }), 1, 2],
    ['no value', viz(on), undefined, 2],
    ['no compared value', viz(on), 1, undefined],
    ['a compared value of 0', viz(on), 1, 0]
  ])('shows nothing with %s', (_name, options, value, compared) => {
    expect(kpiComparisonOf(options, value, compared, format)).toBeUndefined();
  });
});

describe('kpiTrendOf', () => {
  const comparison = kpiComparisonOf(viz(on), 50, 100, format);

  it('waits for its data', () => {
    expect(kpiTrendOf(viz(on), undefined, comparison, true)).toBeUndefined();
    expect(kpiTrendOf(viz({ dataRange: { enabled: true } }), [1], comparison, true)).toBeUndefined();
  });

  it('draws themed trends in their color', () => {
    expect(kpiTrendOf(viz({ ...on, trendLine: { enabled: true, color: '#abc', displayAs: 'area' } }), [1, 2], comparison, true)).toEqual({ data: [1, 2], displayAs: 'area', color: '#abc' });
  });

  it("takes the comparison's color when asked", () => {
    expect(kpiTrendOf(viz({ ...on, trendLine: { enabled: true, colorByPercentage: true } }), [1], comparison, true)?.color).toBe(comparison?.color);
  });

  it('draws the plain trend in green, or red when decreasing', () => {
    expect(kpiTrendOf(viz(on), [1], comparison, false)).toEqual({ data: [1], displayAs: 'line', color: '#ea6b6b' });
    expect(kpiTrendOf(viz(on), [1], undefined, false)?.color).toBe('#4dcf36');
  });
});

describe('trendChartOptions', () => {
  it('draws a bare spline', () => {
    const options = trendChartOptions({ data: [1, null, 3], displayAs: 'line', color: '#abc' });
    expect(options.series).toEqual([{ type: 'spline', data: [1, null, 3], color: '#abc' }]);
    expect(options).toMatchObject({ legend: { enabled: false }, tooltip: { enabled: false }, xAxis: { visible: false }, yAxis: { visible: false } });
  });

  it('fills an area', () => {
    const options = trendChartOptions({ data: [1], displayAs: 'area', color: '#abc' });
    expect(options.chart?.type).toBe('areaspline');
    expect(options.plotOptions?.series).toMatchObject({ fillOpacity: 0.2 });
  });
});
