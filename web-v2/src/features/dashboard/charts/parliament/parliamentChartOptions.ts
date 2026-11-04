import type Highcharts from 'highcharts';
import { merge } from 'lodash-es';
import type { SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, chartColors, titleText } from '../highchartsBase';
import { labelSettingsOf, pointLabel, pointNumberFormat, pointTooltip } from '../pie/pointText';

/** v1 `ParliamentDisplayType`: how the dots are laid out. */
export const ParliamentLayout = {
  Parliament: 'parliament',
  Rectangle: 'rectangle',
  Circle: 'circle'
} as const;

/**
 * v1 `ParliamentChart.DISPLAY_AS_*_OPTIONS`, set on each series, by their angles. v1 also fixed a center and a size
 * (`230%` for the parliament, `140%` for the circle) that drew the dots over the title and past the card's sides;
 * Highcharts fits them to the plot instead.
 */
const LAYOUTS: Readonly<Record<string, Highcharts.SeriesItemOptions>> = {
  [ParliamentLayout.Circle]: { type: 'item', startAngle: 0, endAngle: 360 },
  [ParliamentLayout.Rectangle]: { type: 'item', startAngle: undefined, endAngle: undefined },
  [ParliamentLayout.Parliament]: { type: 'item', startAngle: -100, endAngle: 100 }
};

/** v1 `ParliamentChartOption.DEFAULT_MAX_DATA_POINT`, when the chart has no maximum of its own. */
const DEFAULT_MAX_DATA_POINT = 1500;

/** v1 `ParliamentChartOption.DEFAULT_SETTING`. */
const PARLIAMENT_DEFAULTS = {
  plotOptions: {
    item: {
      borderWidth: 0,
      borderColor: 'black',
      dataLabels: {
        borderWidth: 0,
        textOutline: '0px contrast',
        useHTML: true,
        style: { border: '0px transparent', borderColor: 'none', textShadow: false, outline: 'none' }
      }
    }
  }
};

export function maxDataPointOf(options: VizOptions): number {
  const max = Number(options['maxDataPoint']);
  return Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX_DATA_POINT;
}

/**
 * Why the chart can't be drawn: a value above its maximum would be that many dots (v1 `ParliamentChart.validateData`).
 * `undefined` when it can.
 */
export function parliamentLimitError(options: VizOptions, response: SeriesTwoResponse): string | undefined {
  const max = maxDataPointOf(options);
  const tooMany = response.series.some(series => series.data.some(([, value]) => value > max));
  return tooMany ? `Parliament can not render quantity point greater ${max}, change in setting` : undefined;
}

interface ParliamentOptionsInput {
  options: VizOptions;
  response: SeriesTwoResponse;
  themeColors: readonly string[];
}

/** Parliament charts (v1 `ParliamentChart`): a Highcharts item series, a dot per unit of each value. */
export function buildParliamentChartOptions({ options, response, themeColors }: ParliamentOptionsInput): Highcharts.Options {
  const labels = labelSettingsOf(options, 'plotOptions.item.dataLabels');
  const format = pointNumberFormat(options, labels.displayUnit);
  const layout = LAYOUTS[String(options['displayType'])] ?? LAYOUTS[ParliamentLayout.Parliament];

  const manual: Highcharts.Options = {
    chart: { type: 'item' },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    accessibility: { point: { valueSuffix: '%' } },
    tooltip: {
      useHTML: true,
      outside: true,
      formatter(this: Highcharts.Point) {
        return pointTooltip(options, this.series.name, this.color, this.name, format(this.y ?? 0));
      }
    },
    plotOptions: {
      item: {
        dataLabels: {
          useHTML: true,
          formatter(this: Highcharts.Point) {
            return pointLabel(this, labels, format);
          }
        }
      }
    },
    series: response.series.map(series => ({ ...layout, name: series.name, data: series.data.map(([name, y]) => ({ name, y })) }))
  };

  return merge({}, BASE_CONFIG, PARLIAMENT_DEFAULTS, options, manual) as Highcharts.Options;
}
