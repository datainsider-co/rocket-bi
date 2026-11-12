import { describe, expect, it } from 'vitest';
import type { WordCloudResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { buildWordCloudChartOptions } from './wordCloudChartOptions';

const THEME = ['#111111', '#222222'];
const response: WordCloudResponse = {
  kind: 'word_cloud',
  name: '',
  data: [
    { name: 'Albania', weight: 2104 },
    { name: 'Algeria', weight: 9681 }
  ]
};

type Formatter = (this: unknown) => string;
const call = (formatter: unknown, context: unknown) => (formatter as Formatter).call(context);

describe('buildWordCloudChartOptions', () => {
  it('draws one series of words, each with its weight', () => {
    const options = buildWordCloudChartOptions({ options: {}, response, themeColors: THEME });
    expect(options.chart?.type).toBe('wordcloud');
    expect(options.series).toEqual([{ type: 'wordcloud', name: '', data: response.data }]);
  });

  it('draws nothing for an empty response', () => {
    const empty = buildWordCloudChartOptions({ options: {}, response: { ...response, data: [] }, themeColors: THEME });
    expect(empty.series).toEqual([{ type: 'wordcloud', name: '', data: [] }]);
  });

  it("takes the theme's colors, or the chart's own", () => {
    expect(buildWordCloudChartOptions({ options: {}, response, themeColors: THEME }).colors).toEqual(THEME);
    const own = { themeColor: { enabled: false, colors: ['#abc'] } } as VizOptions;
    expect(buildWordCloudChartOptions({ options: own, response, themeColors: THEME }).colors).toEqual(['#abc']);
  });

  it('says the word and its weight in the tooltip', () => {
    const options = buildWordCloudChartOptions({ options: { precision: 0 }, response, themeColors: THEME });
    expect(call(options.tooltip?.formatter, { name: 'A<b>', weight: 9681 })).toContain('A&lt;b&gt;: <b>10k</b>');
    expect(call(options.tooltip?.formatter, { name: 'None' })).toContain('None: <b>0</b>');
  });

  it('shows the title, and does not change the stored options or the response', () => {
    const stored = { title: { text: 'Countries', enabled: true }, tooltip: { style: { color: 'red' } } } as VizOptions;
    const before = JSON.stringify([stored, response]);
    const options = buildWordCloudChartOptions({ options: stored, response, themeColors: THEME });
    expect(options.title?.text).toBe('Countries');
    expect(call(options.tooltip?.formatter, { name: 'x', weight: 1 })).toContain('color: red');
    expect(JSON.stringify([stored, response])).toBe(before);
  });
});
