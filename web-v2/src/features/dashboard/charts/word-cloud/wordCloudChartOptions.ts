import type Highcharts from 'highcharts';
import { escape, merge } from 'lodash-es';
import type { WordCloudResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, chartColors, titleText } from '../highchartsBase';
import { tooltipHtml } from '../pie/pointText';
import { seriesNumberFormat } from '../series/seriesChartOptions';

interface WordCloudOptionsInput {
  options: VizOptions;
  response: WordCloudResponse;
  themeColors: readonly string[];
}

type WordPoint = Highcharts.Point & { weight?: number };

/**
 * Word clouds (v1 `WordCloudChart`): one series, each word sized by its weight, the tooltip saying the weight. The
 * words take the chart's colors in turn; v1 set them under `chart.colors`, which Highcharts ignores, so its Data Color
 * tab never applied.
 */
export function buildWordCloudChartOptions({ options, response, themeColors }: WordCloudOptionsInput): Highcharts.Options {
  const format = seriesNumberFormat(options);
  const manual: Highcharts.Options = {
    chart: { type: 'wordcloud' },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    tooltip: {
      useHTML: true,
      outside: true,
      formatter(this: WordPoint) {
        return tooltipHtml(options, [`${escape(this.name)}: <b>${format(this.weight ?? 0)}</b>`]);
      }
    },
    series: [{ type: 'wordcloud', name: response.name, data: response.data.map(word => ({ name: word.name, weight: word.weight })) }]
  };
  return merge({}, BASE_CONFIG, options, manual) as Highcharts.Options;
}
