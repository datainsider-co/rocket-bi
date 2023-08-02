import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { ChartOption, ChartOptionData, DIMap, EqualValue, StackedChartOption, StackedQuerySetting, TextSetting } from '@core/common/domain/model';
import { get, merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { ChartUtils, HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { SeriesOneResponse } from '@core/common/domain/response';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'StackingSeriesChart' })
export default class StackingSeriesChart extends BaseHighChartWidget<SeriesOneResponse, StackedChartOption, StackedQuerySetting> {
  @Ref()
  chart: any;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const manualOptions: Highcharts.Options = {
      chart: {
        type: 'line'
      },
      xAxis: {
        type: 'category'
      },
      colors: this.setting.colors,
      plotOptions: {
        series: {
          ...this.createRightClickAsOptions(),
          dataLabels: {
            useHTML: true,
            formatter: function() {
              return dataLabelsFormatter((this as any) as Highcharts.PointLabelObject);
            }
          }
        }
      },
      yAxis: [
        {
          labels: {
            useHTML: true,
            formatter: function() {
              return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        },
        {
          labels: {
            useHTML: true,
            formatter: function() {
              return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        }
      ],
      subtitle: {
        useHTML: true
      },
      tooltip: {
        useHTML: true,
        // Ở Data builder:
        // Nếu để outside = true, thì sẽ không hiện tooltip.
        // Nếu để outside = false, thì không hiện được tooltip nằm trên cùng của chart do dataLabel và tooltip đều dùng use HTML = true, dẫn đến lỗi khi ở dashboard
        // Giải pháp tạm thời: Hardcode outside = false nếu ở Data builder; = true nếu ở dashboard/các trường hợp khác
        outside: !this.isPreview,
        formatter: function() {
          return tooltipFormatter((this as any) as Highcharts.TooltipFormatterContextObject);
        }
      }
    };
    this.updateOptions(manualOptions);
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2,
      this.setting.options.decimalPoint,
      this.setting.options.thousandSep
    );
  }

  private get cloneChartData() {
    return SeriesOneResponse.fromObject(this.data);
  }

  @Watch('setting')
  onChartSettingChanged() {
    this.reRenderChart();
  }

  @Watch('data')
  onChartDataChanged() {
    this.reRenderChart();
  }

  @Watch('textColor')
  onTextColorChanged() {
    this.updateTextColor(this.textColor, true);
  }

  @Watch('setting.options.plotOptions.series.dataLabels.displayUnit')
  onNumberMetricChanged(newMetricNumberMode: MetricNumberMode) {
    const newMetricNumber: string[] | undefined = HighchartUtils.toMetricNumbers(newMetricNumberMode);
    const newRanges: RangeData[] | undefined = HighchartUtils.buildRangeData(newMetricNumber);
    this.numberFormatter.setRanges(newRanges);
  }

  @Watch('setting.options.precision')
  onPrecisionChanged(precision: number) {
    this.numberFormatter.precision = precision;
  }

  @Watch('setting.options.decimalPoint')
  onDecimalPointChanged(decimalPoint: string) {
    this.numberFormatter.decimalPoint = decimalPoint;
  }

  @Watch('setting.options.thousandSep')
  onThousandSepChanged(thousandSep: string) {
    this.numberFormatter.thousandSep = thousandSep;
  }

  mounted() {
    this.reRenderChart();
  }

  updateSeriesStacking(stackingGroup: DIMap<string>) {
    if (stackingGroup) {
      const chart = this.chart.getChart();
      Object.keys(stackingGroup).forEach(k => {
        const series: Highcharts.Series = chart.series[+k];
        if (series) {
          series.update(
            {
              type: series.type as any,
              stack: stackingGroup[+k] as any
            },
            false
          );
        }
      });
    }
  }

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, StackedChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart?.getChart();
  }

  protected buildHighchart() {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      this.buildDualAxis(this.data, this.setting.options);
      this.load(this.data, this.setting);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.buildAxis(this.data);
      this.updateChartInfo();
      this.updateTextColor(this.textColor, false);
      HighchartUtils.drawChart(this.getChart());
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`SeriesChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  private getConditionValue(equalValue?: EqualValue): number | undefined {
    return equalValue?.enabled ? equalValue?.value : undefined;
  }

  protected buildAxis(data: SeriesOneResponse) {
    const options: any = {};
    const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
    const yAxisCondition = get(this.setting, 'options.yAxis[0].condition');
    const xAxisFormatter = this.xAxisFormatter;
    if (isTimeStampXAxis) {
      options['xAxis'] = {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%Y-%m-%d'
        }
      };
    } else if (ListUtils.isNotEmpty(data.xAxis)) {
      options['xAxis'] = [
        {
          // type: 'category',
          categories: data.xAxis,
          labels: {
            useHTML: true,
            formatter: function() {
              return xAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        }
      ];
    }
    if (ListUtils.isNotEmpty(data.yAxis)) {
      options['yAxis'][0] = [
        {
          type: 'category',
          categories: data.yAxis,
          min: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.min) : undefined,
          max: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.max) : undefined
        }
      ];
    } else {
      options['yAxis'] = [
        {
          min: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.min) : undefined,
          max: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.max) : undefined
        }
      ];
    }
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected load(chartData: SeriesOneResponse, setting: StackedChartOption) {
    const { stackingGroup, seriesTypesByLabelMap } = setting;
    Log.debug('load::Stacking group', stackingGroup, '::series types', seriesTypesByLabelMap);
    const seriesWithType = chartData.series.map(item => {
      const normalizedLabel = StringUtils.toCamelCase(item.name);
      const type = seriesTypesByLabelMap.get(normalizedLabel);
      const stackGroup = stackingGroup.get(normalizedLabel) ?? item.stack ?? 'unGroup';
      const itemSetting = get(setting, `options.plotOptions.series.response.${normalizedLabel}`, {});
      const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
      const result = isTimeStampXAxis ? item.withTimeStamp(chartData.xAxis ?? []) : item;
      Log.debug('load::', item.name, '=>', normalizedLabel, `={${type}, ${stackGroup}}`);
      return {
        ...result,
        ...itemSetting,
        type: type,
        stack: stackGroup
      };
    });
    HighchartUtils.addSeries(this.getChart(), seriesWithType);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const textColor = this.setting.options?.plotOptions?.series?.dataLabels?.style?.color ?? '#fff';
    const enabledMaxMin = this.setting.options?.plotOptions?.series?.dataLabels?.condition?.enabled ?? false;
    const haveMin = this.setting.options?.plotOptions?.series?.dataLabels?.condition?.min !== undefined;
    const haveMax = this.setting.options?.plotOptions?.series?.dataLabels?.condition?.max !== undefined;
    Log.debug('dataLabelsFormatter', enabledMaxMin, haveMin, haveMax);
    if (!enabledMaxMin) {
      const formattedData = this.numberFormatter.format(point.y ?? 0);
      return `<div style="color: ${textColor}"> ${formattedData}</div>`;
    } else if (enabledMaxMin && haveMin && !haveMax) {
      ///Render if has only min
      const min = this.setting.options!.plotOptions!.series!.dataLabels!.condition!.min;
      if (point.y && point.y >= min!) {
        const formattedData = this.numberFormatter.format(point.y ?? 0);
        return `<div style="color: ${textColor}"> ${formattedData}</div>`;
      } else {
        return '';
      }
    } else if (enabledMaxMin && !haveMin && haveMax) {
      ///Render if has only max
      const max = this.setting.options!.plotOptions!.series!.dataLabels!.condition!.max;
      if (point.y && point.y <= max!) {
        const formattedData = this.numberFormatter.format(point.y ?? 0);
        return `<div style="color: ${textColor}"> ${formattedData}</div>`;
      } else {
        return '';
      }
    } else {
      ///Render if has max, min
      const min = this.setting.options!.plotOptions!.series!.dataLabels!.condition!.min;
      const max = this.setting.options!.plotOptions!.series!.dataLabels!.condition!.max;
      if (point.y && point.y >= min! && point.y <= max!) {
        const formattedData = this.numberFormatter.format(point.y ?? 0);
        return `<div style="color: ${textColor}"> ${formattedData}</div>`;
      } else {
        return '';
      }
    }
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    let result = '';
    if (contextObject.points) {
      contextObject.points.forEach(point => {
        const formattedData = this.numberFormatter.format(point.y);
        result = result + `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${formattedData}</b><br/>`;
      });
    }
    return `<div style="color: ${textColor}; font-family: ${fontFamily}; text-align: left">
                ${result}
            </div>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private updateTextColor(color: string | undefined, reDraw: boolean): void {
    // if (color) {
    //   const newStyle = {
    //     color: color
    //   };
    //   const newColorOption = {
    //     legend: {
    //       itemStyle: newStyle
    //     },
    //     xAxis: {
    //       title: {
    //         style: newStyle
    //       },
    //       labels: {
    //         style: newStyle
    //       }
    //     },
    //     yAxis: [
    //       {
    //         title: {
    //           style: newStyle
    //         },
    //         labels: {
    //           style: newStyle
    //         }
    //       }
    //     ],
    //     plotOptions: {
    //       series: {
    //         dataLabels: {
    //           style: newStyle
    //         }
    //       }
    //     }
    //   };
    //   HighchartUtils.updateChart(this.getChart(), newColorOption, reDraw);
    // }
  }

  private setSeriesToPrimaryAxis(chartData: SeriesOneResponse) {
    chartData.series.forEach(series => (series.yAxis = 0));
  }

  private deleteDualAxis() {
    this.getChart()
      ?.get('dual-axis')
      ?.remove();
  }

  private buildDualAxis(chartData: SeriesOneResponse, options: any) {
    if (options?.dualAxis != undefined) {
      const hasDualAxis = options.dualAxis != -1;
      if (hasDualAxis) {
        chartData.series[options.dualAxis].yAxis = 1;
        options.yAxis[1].title = {
          text: chartData.series[options.dualAxis].name
        };
      } else {
        const existDualAxis = this.getChart()?.yAxis?.length == 2;
        if (existDualAxis) {
          this.setSeriesToPrimaryAxis(chartData);
          this.deleteDualAxis();
        }
      }
    }
  }

  private updateMetricNumber(options: ChartOptionData) {
    const metrixNumber: string[] | undefined = HighchartUtils.toMetricNumbers(options.metricNumbers ?? MetricNumberMode.Default);
    Highcharts.setOptions({
      lang: {
        numericSymbols: metrixNumber
      }
    });
  }
  private yAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject<any>) {
    const yAxisSetting = this.setting.options.yAxis;
    const value = this.numberFormatter.format(axis.value);
    if (yAxisSetting && yAxisSetting[0]) {
      return this.customAxisLabel(value, yAxisSetting[0].prefix, yAxisSetting[0].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }

  private customAxisLabel(value: string, prefix?: TextSetting, postfix?: TextSetting) {
    return `
        <div class="d-flex align-items-center">
          <div>${prefix?.text ?? ''}</div>${value}<div>${postfix?.text ?? ''}</div>
        </div>
      `;
  }

  private xAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject<any>) {
    const xAxisSetting = this.setting.options.xAxis;
    const value = axis.value;
    if (xAxisSetting && xAxisSetting[0]) {
      return this.customAxisLabel(value, xAxisSetting[0].prefix, xAxisSetting[0].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }
}
