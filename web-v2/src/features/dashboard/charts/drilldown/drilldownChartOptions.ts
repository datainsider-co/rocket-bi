import type Highcharts from 'highcharts';
import { merge, omit } from 'lodash-es';
import type { DrilldownResponse } from '@/core/query/VisualizationResponse';
import type { ChartViz, VizOptions } from '@/core/query/vizOptions';
import { BASE_CONFIG, HTML_LABEL_FONT_SIZE, axisLabel, chartColors, labelFontSize, titleText } from '../highchartsBase';
import { labelSettingsOf, pointLabel, pointTooltip } from '../pie/pointText';
import { seriesNumberFormat } from '../series/seriesChartOptions';
import { ChartVizClass } from '../vizClass';
import { drilldownLevelOf, type LevelStep } from './drilldownLevels.utils';

export type DrilldownChartType = 'column' | 'bar' | 'pie';

/**
 * How a drilldown chart is drawn: the pie by its class, columns and bars (one class) by the stored `chart.type`, which
 * charts older than v1's per-type defaults lack and v1 drew as columns.
 */
export function drilldownChartTypeOf(viz: ChartViz): DrilldownChartType | undefined {
  if (viz.className === ChartVizClass.DrilldownPie) return 'pie';
  if (viz.className !== ChartVizClass.Drilldown) return undefined;
  return viz.options.chart?.type === 'bar' ? 'bar' : 'column';
}

/**
 * v1 `DrilldownChartOption.DEFAULT_SETTING`, without its `threshold: null`: that let the value axis start above zero,
 * so two columns a percent apart looked many times each other's height. Columns and bars start at zero, like v2's others.
 */
const AXES_DEFAULTS = {
  xAxis: [{ lineWidth: 0.5, lineColor: 'var(--grid-line-color)' }],
  yAxis: [{ tickLength: 0 }],
  plotOptions: { series: { borderWidth: 0 } }
};

/** v1 `DrilldownPieChartOption.DEFAULT_SETTING`. */
const PIE_DEFAULTS = { plotOptions: { pie: { borderWidth: 0, borderColor: 'black' } } };

/** Where the Data Label tab writes (v1 `DrilldownSetting`), for the pie too. */
const LABELS_PATH = 'plotOptions.series.dataLabels';

/** A point's own options: the level under it, when the response has one. */
type DrillPointOptions = Highcharts.PointOptionsObject & { custom?: { drilldown?: string } };

export interface DrilldownOptionsInput {
  type: DrilldownChartType;
  options: VizOptions;
  response: DrilldownResponse;
  /** The levels the viewer clicked into, valid for the response (`useDrilldownLevels`); none draws the first legend. */
  steps?: readonly LevelStep[];
  themeColors: readonly string[];
  /** The value's name, which the first level's series takes (v1 `query.value.name`). */
  valueName?: string;
  /** A click on a point that has a level under it. */
  onDrill?: (step: LevelStep) => void;
}

/**
 * Drilldown column, bar and pie (v1 `DrilldownChart`, `DrilldownPieChart`): one series of the current level's points,
 * each its own color. v1 handed every level to Highcharts' drilldown module; here the level is an input, so the chart
 * is the same after any redraw. Values take the Other tab's number format, which v1 never read (it showed raw numbers),
 * and the pie shows its data labels, which v1's pie defaults always turned off.
 */
export function buildDrilldownChartOptions({ type, options, response, steps = [], themeColors, valueName = '', onDrill }: DrilldownOptionsInput): Highcharts.Options {
  const level = drilldownLevelOf(response, steps);
  const drillable = level.points.some(point => point.drilldown !== undefined);
  const format = seriesNumberFormat(options);
  const labels = labelSettingsOf(options, LABELS_PATH);
  const labelsOn = (labels as { enabled?: boolean }).enabled === true;
  const labelStyle = { fontSize: labelFontSize(labels.style, HTML_LABEL_FONT_SIZE.dataLabel) };
  const yAxis = (Array.isArray(options.yAxis) ? options.yAxis : []) as unknown[];
  const xAxis = (Array.isArray(options.xAxis) ? options.xAxis : []) as unknown[];
  const cursor = drillable ? 'pointer' : 'default';
  const isPie = type === 'pie';

  const axes: Highcharts.Options = {
    xAxis: [
      {
        type: 'category',
        categories: level.points.map(point => point.name),
        labels: {
          formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
            return axisLabel(String(this.value), xAxis[0]);
          }
        }
      }
    ],
    yAxis: [
      {
        labels: {
          formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
            return axisLabel(format(Number(this.value)), yAxis[0]);
          }
        }
      }
    ]
  };

  const manual: Highcharts.Options = {
    chart: { type },
    colors: chartColors(options, themeColors),
    title: { text: titleText(options.title) ?? '' },
    subtitle: { text: titleText(options.subtitle) ?? '', useHTML: true },
    ...(!isPie && axes),
    tooltip: {
      useHTML: true,
      outside: true,
      formatter(this: Highcharts.Point) {
        return pointTooltip(options, this.series.name, this.color, this.name, format(this.y ?? 0));
      }
    },
    plotOptions: {
      series: {
        cursor,
        point: {
          events: {
            click(this: Highcharts.Point) {
              const id = (this.options as DrillPointOptions).custom?.drilldown;
              if (id !== undefined) onDrill?.({ id, name: this.name });
            }
          }
        },
        dataLabels: {
          useHTML: true,
          style: labelStyle,
          formatter(this: Highcharts.Point) {
            return `<div style="color: ${labels.style?.color ?? '#fff'}">${format(this.y ?? 0)}</div>`;
          }
        }
      },
      ...(isPie && {
        pie: {
          cursor,
          // A click drills; `BASE_CONFIG` lets pies pull a clicked slice out instead.
          allowPointSelect: false,
          dataLabels: {
            enabled: labelsOn,
            useHTML: true,
            style: labelStyle,
            formatter(this: Highcharts.Point) {
              return pointLabel(this, labels, format);
            }
          }
        }
      })
    },
    series: [
      {
        type,
        name: level.name ?? valueName,
        colorByPoint: true,
        data: level.points.map(({ name, y, drilldown }): DrillPointOptions => ({ name, y, ...(drilldown !== undefined && { custom: { drilldown } }) }))
      }
    ]
  };

  // The stored options hold axes for the pie too (v1's defaults), which it has no use for.
  const stored = isPie ? omit(options, ['xAxis', 'yAxis']) : options;
  return merge({}, BASE_CONFIG, isPie ? PIE_DEFAULTS : AXES_DEFAULTS, stored, manual) as Highcharts.Options;
}
