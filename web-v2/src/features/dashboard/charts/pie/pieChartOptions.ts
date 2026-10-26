import type Highcharts from 'highcharts';
import { merge } from 'lodash-es';
import type { SeriesTwoResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { createNumberFormat } from '../numberFormat';
import { BASE_CONFIG, chartColors, titleText } from '../highchartsBase';

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

/** v1 `DataLabelFormatterMode`. */
export const PieLabelFormat = {
  NameAndPercent: 'name_and_percent',
  NameAndValue: 'name_and_value',
  Name: 'name'
} as const;

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
  const pie = (options.plotOptions?.pie ?? {}) as { dataLabels?: { displayUnit?: string; labelFormat?: string; style?: { color?: string } } };
  const format = createNumberFormat({
    displayUnit: pie.dataLabels?.displayUnit,
    precision: options.precision,
    decimalPoint: options.decimalPoint,
    thousandSep: options.thousandSep
  });
  const labelFormat = pie.dataLabels?.labelFormat ?? PieLabelFormat.NameAndValue;
  const labelColor = pie.dataLabels?.style?.color ?? '#fff';
  const tooltipStyle = (options.tooltip?.style ?? {}) as { color?: string; fontFamily?: string };

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
        return `<div style="text-align: left; color: ${tooltipStyle.color ?? '#fff'}; font-family: ${tooltipStyle.fontFamily ?? 'var(--widget-secondary-font-family, Roboto)'}">
            <span>${this.name}</span><br/>
            <span style="color:${String(this.color)}; padding-right: 5px;">●</span>${this.series.name}: <b>${format(this.y ?? 0)}</b>
          </div>`;
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
            switch (labelFormat) {
              case PieLabelFormat.NameAndPercent:
                return `<div style="color:${labelColor}">${this.name} : ${format(this.percentage ?? 0)} %</div>`;
              case PieLabelFormat.Name:
                return `<div style="color:${labelColor}">${this.name}</div>`;
              default:
                return `<div style="color:${labelColor}">${this.name} : ${format(this.y ?? 0)}</div>`;
            }
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
