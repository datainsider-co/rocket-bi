import { describe, expect, it } from 'vitest';
import type { SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { buildParliamentChartOptions, maxDataPointOf, parliamentLimitError } from './parliamentChartOptions';

const THEME = ['#111111', '#222222'];
const response: SeriesTwoResponse = {
  kind: 'series_two',
  series: [{ name: 'party', data: [['Blue', 120], ['Red', 80]] }],
  total: 200
};

describe('buildParliamentChartOptions', () => {
  it('draws an item series in a half circle by default', () => {
    const options = buildParliamentChartOptions({ options: {}, response, themeColors: THEME });
    expect(options.chart?.type).toBe('item');
    expect(options.series?.[0]).toMatchObject({ type: 'item', name: 'party', startAngle: -100, endAngle: 100 });
    expect(options.series?.[0]).toMatchObject({ data: [{ name: 'Blue', y: 120 }, { name: 'Red', y: 80 }] });
  });

  it('leaves the size to Highcharts, so the dots stay inside the card', () => {
    const options = buildParliamentChartOptions({ options: {}, response, themeColors: THEME });
    expect(options.series?.[0]).not.toHaveProperty('size');
    expect(options.series?.[0]).not.toHaveProperty('center');
  });

  it('lays the dots out as stored', () => {
    const circle = buildParliamentChartOptions({ options: { displayType: 'circle' }, response, themeColors: THEME });
    expect(circle.series?.[0]).toMatchObject({ startAngle: 0, endAngle: 360 });
    const rectangle = buildParliamentChartOptions({ options: { displayType: 'rectangle' }, response, themeColors: THEME });
    expect(rectangle.series?.[0]).toMatchObject({ startAngle: undefined, endAngle: undefined });
    expect(rectangle.series?.[0]).not.toHaveProperty('center');
  });
});

describe('parliamentLimitError', () => {
  it('lets values up to the maximum through', () => {
    expect(parliamentLimitError({ maxDataPoint: 120 } as VizOptions, response)).toBeUndefined();
  });

  it('says so when a value is over the maximum', () => {
    expect(parliamentLimitError({ maxDataPoint: 100 } as VizOptions, response)).toBe('Parliament can not render quantity point greater 100, change in setting');
  });
});

describe('maxDataPointOf', () => {
  it("takes the chart's maximum, else v1's 1500", () => {
    expect(maxDataPointOf({ maxDataPoint: 1000 } as VizOptions)).toBe(1000);
    expect(maxDataPointOf({ maxDataPoint: '250' } as VizOptions)).toBe(250);
    expect(maxDataPointOf({})).toBe(1500);
    expect(maxDataPointOf({ maxDataPoint: 0 } as VizOptions)).toBe(1500);
  });
});
