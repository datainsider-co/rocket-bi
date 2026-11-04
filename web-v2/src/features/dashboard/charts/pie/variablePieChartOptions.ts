import type Highcharts from 'highcharts';
import { escape, merge } from 'lodash-es';
import type { GenericResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, chartColors, titleText } from '../highchartsBase';
import { colorDot, labelSettingsOf, pointLabel, pointNumberFormat, tooltipHtml } from './pointText';

/**
 * Where a variable pie's Data Label and display unit settings live. v1's tabs wrote them under `series` and its chart
 * read them under `pie`, so they never applied; v2 reads them where they are written.
 */
export const VARIABLE_PIE_LABELS = 'plotOptions.series.dataLabels';

const toNumber = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

interface VariablePieOptionsInput {
  options: VizOptions;
  response: GenericResponse;
  themeColors: readonly string[];
}

/**
 * Variable pie charts (v1 `VariablepieChart`): each record is a slice's name, its value and, when the chart has a
 * Weight, how far the slice reaches out (`z`). The tooltip names the value and the weight by their columns.
 */
export function buildVariablePieChartOptions({ options, response, themeColors }: VariablePieOptionsInput): Highcharts.Options {
  const labels = labelSettingsOf(options, VARIABLE_PIE_LABELS);
  const format = pointNumberFormat(options, labels.displayUnit);
  const [legendName = '', valueName = '', weightName] = response.headers;

  const manual: Highcharts.Options = {
    chart: { type: 'variablepie' },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    accessibility: { point: { valueSuffix: '%' } },
    tooltip: {
      useHTML: true,
      outside: true,
      formatter(this: Highcharts.Point) {
        const weight = (this as Highcharts.Point & { z?: number }).z;
        return tooltipHtml(options, [
          `<b>${colorDot(this.color)}${escape(this.name)}</b>`,
          `${escape(valueName)}: <b>${format(this.y ?? 0)}</b>`,
          ...(weightName === undefined ? [] : [`${escape(weightName)}: <b>${format(weight ?? 0)}</b>`])
        ]);
      }
    },
    plotOptions: {
      variablepie: {
        cursor: 'pointer',
        dataLabels: {
          useHTML: true,
          formatter(this: Highcharts.Point) {
            return pointLabel(this, labels, format);
          }
        }
      }
    },
    series: [
      {
        type: 'variablepie',
        name: legendName,
        data: response.records.map(([name, y, z]) => ({ name: String(name ?? ''), y: toNumber(y), z: toNumber(z) }))
      }
    ]
  };

  return merge({}, BASE_CONFIG, options, manual) as Highcharts.Options;
}
