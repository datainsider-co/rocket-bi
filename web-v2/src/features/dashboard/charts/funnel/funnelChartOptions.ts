import type Highcharts from 'highcharts';
import { merge } from 'lodash-es';
import type { SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, chartColors, titleText } from '../highchartsBase';
import { labelSettingsOf, pointLabel, pointNumberFormat, pointTooltip } from '../pie/pointText';

export type FunnelType = 'funnel' | 'pyramid';

/** v1 `FunnelChartOption.DEFAULT_SETTING` and `PyramidChartOption.DEFAULT_SETTING`. */
const defaultsOf = (type: FunnelType) => ({
  plotOptions: { [type]: { borderWidth: 0, borderColor: 'black', showInLegend: true, dataLabels: { enabled: false } } }
});

/** The shape v1 fixed in each chart (stored options carry the same keys at their root, where Highcharts never reads them). */
const SHAPES: Readonly<Record<FunnelType, Highcharts.PlotFunnelOptions>> = {
  funnel: { center: ['40%', '50%'], height: '90%', neckWidth: '20%', neckHeight: '25%', width: '60%' },
  pyramid: { center: ['40%', '50%'], width: '80%' }
};

interface FunnelOptionsInput {
  type: FunnelType;
  options: VizOptions;
  response: SeriesTwoResponse;
  themeColors: readonly string[];
}

/**
 * Funnel and pyramid charts (v1 `FunnelChart`, `PyramidChart`). The funnel's tooltip is headed by the series and the
 * pyramid's by the point, as in v1.
 */
export function buildFunnelChartOptions({ type, options, response, themeColors }: FunnelOptionsInput): Highcharts.Options {
  const labels = labelSettingsOf(options, `plotOptions.${type}.dataLabels`);
  const format = pointNumberFormat(options, labels.displayUnit);

  const manual: Highcharts.Options = {
    chart: { type },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    tooltip: {
      useHTML: true,
      outside: true,
      formatter(this: Highcharts.Point) {
        const value = format(this.y ?? 0);
        return type === 'funnel'
          ? pointTooltip(options, this.series.name, this.color, this.name, value)
          : pointTooltip(options, this.name, this.color, this.series.name, value);
      }
    },
    plotOptions: {
      [type]: {
        ...SHAPES[type],
        dataLabels: {
          useHTML: true,
          formatter(this: Highcharts.Point) {
            return pointLabel(this, labels, format);
          }
        }
      }
    },
    series: response.series.map(series => ({ type, name: series.name, data: series.data.map(([name, y]) => ({ name, y })) }))
  };

  return merge({}, BASE_CONFIG, defaultsOf(type), options, manual) as Highcharts.Options;
}
