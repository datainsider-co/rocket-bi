import type Highcharts from 'highcharts';
import { merge } from 'lodash-es';
import type { SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, chartColors, titleText } from '../highchartsBase';
import { labelSettingsOf, pointLabel, pointNumberFormat, pointTooltip } from './pointText';

export { PieLabelFormat } from './pointText';

/** v1 `PieChartOption.DEFAULT_SETTING`. */
const PIE_DEFAULTS = {
  plotOptions: {
    pie: {
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

interface PieOptionsInput {
  options: VizOptions;
  response: SeriesTwoResponse;
  themeColors: readonly string[];
  /** Slices selected as a cross filter; shown pulled out. */
  selected?: readonly string[];
  /** Clicking a slice selects it, clicking it again clears the selection (v1 `PieChart.handleSelectItem`). */
  onSelect?: (selected: string[]) => void;
}

/** Pie charts (v1 `PieChart.vue`). */
export function buildPieChartOptions({ options, response, themeColors, selected = [], onSelect }: PieOptionsInput): Highcharts.Options {
  const labels = labelSettingsOf(options, 'plotOptions.pie.dataLabels');
  const format = pointNumberFormat(options, labels.displayUnit);

  const manual: Highcharts.Options = {
    chart: { type: 'pie' },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    accessibility: { point: { valueSuffix: '%' } },
    tooltip: {
      useHTML: true,
      outside: true,
      formatter(this: Highcharts.Point) {
        return pointTooltip(options, this.name, this.color, this.series.name, format(this.y ?? 0));
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderRadius: 0,
        point: {
          events: {
            click(this: Highcharts.Point) {
              onSelect?.(selected.includes(this.name) ? [] : [this.name]);
            }
          }
        },
        dataLabels: {
          useHTML: true,
          formatter(this: Highcharts.Point) {
            return pointLabel(this, labels, format);
          }
        }
      }
    },
    series: response.series.map(series => ({
      type: 'pie',
      name: series.name,
      data: series.data.map(([name, y]) => ({ name, y, selected: selected.includes(name), sliced: selected.includes(name) }))
    }))
  };

  return merge({}, BASE_CONFIG, PIE_DEFAULTS, options, manual) as Highcharts.Options;
}
