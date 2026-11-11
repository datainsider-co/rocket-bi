import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import { hasComparisonArea, isComparisonOn, isTrendLineOn, kpiComparisonOf, kpiTrendOf, trendChartOptions } from './kpiComparison.utils';

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

describe('hasComparisonArea', () => {
  it('is on with a date range, with or without a comparison', () => {
    expect(hasComparisonArea(viz({ dataRange: { enabled: true } }))).toBe(true);
    expect(hasComparisonArea(viz(on))).toBe(true);
  });

  it('is off without a date range', () => {
    expect(hasComparisonArea(viz({ comparison: { enabled: true } }))).toBe(false);
    expect(hasComparisonArea(viz({}))).toBe(false);
  });
});

describe('kpiComparisonOf', () => {
  it('shows the signed change in percent, in the increase color', () => {
    expect(kpiComparisonOf(viz(on), 150, 100, format)).toEqual({
      percentage: 50,
      isDecrease: false,
      text: '+50%',
      color: '#07BC40',
      bar: { displayAs: 'default', icon: 'di-icon-up', color: '#4dcf36', percentage: '50%', value: '100.0' }
    });
  });

  it('shows a decrease in its color, rounded to two decimals', () => {
    const comparison = kpiComparisonOf(viz({ ...on, percentage: { decreaseColor: '#f00' } }), 2091134.49, 2923450.18, format);
    expect(comparison).toMatchObject({ percentage: -28.47, isDecrease: true, text: '-28.47%', color: '#f00', bar: { icon: 'di-icon-down', color: '#ea6b6b', percentage: '28.47%' } });
  });

  it('shows the formatted compared value when asked', () => {
    expect(kpiComparisonOf(viz({ ...on, percentage: { display: 'value' } }), 150, 100, format)?.text).toBe('+100.0');
  });

  it('takes the stored trend icons, their colors and the compare style', () => {
    const comparison = { enabled: true, compareStyle: 'text', uptrendIcon: 'di-icon-a', uptrendIconColor: '#0f0', downtrendIcon: 'di-icon-b', downtrendIconColor: '#f00' };
    expect(kpiComparisonOf(viz({ ...on, comparison }), 150, 100, format)?.bar).toMatchObject({ displayAs: 'text', icon: 'di-icon-a', color: '#0f0' });
    expect(kpiComparisonOf(viz({ ...on, comparison }), 50, 100, format)?.bar).toMatchObject({ icon: 'di-icon-b', color: '#f00' });
  });

  it('falls back to the default compare style on an unknown one', () => {
    expect(kpiComparisonOf(viz({ ...on, comparison: { enabled: true, compareStyle: 'other' } }), 150, 100, format)?.bar.displayAs).toBe('default');
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
    expect(kpiTrendOf(viz(on), [1], comparison, false)).toEqual({ data: [1], displayAs: 'line', color: '#ea6b6b', plain: { fill: '#ffeded' } });
    expect(kpiTrendOf(viz(on), [1], undefined, false)).toMatchObject({ color: '#4dcf36', plain: { fill: '#eaffe7' } });
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

  it('draws a plain trend as a line over categories', () => {
    const options = trendChartOptions({ data: [1, 2, 3], displayAs: 'line', color: '#abc', plain: { fill: '#def' } });
    expect(options.series).toEqual([{ type: 'line', data: [1, 2, 3], color: '#abc' }]);
    expect(options.xAxis).toEqual({ visible: false, min: -0.5, max: 2.5 });
    expect(options.plotOptions?.series).not.toHaveProperty('fillColor');
  });

  it('fills a plain area in its pale color', () => {
    const options = trendChartOptions({ data: [1], displayAs: 'area', color: '#abc', plain: { fill: '#def' } });
    expect(options.chart?.type).toBe('area');
    expect(options.plotOptions?.series).toMatchObject({ fillColor: '#def' });
  });
});
