import { Component, Ref, Watch } from 'vue-property-decorator';
import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { ChartOption, ChartOptionData, ParetoChartOption, ParetoQuerySetting, TextSetting } from '@core/common/domain/model';
import Pareto from 'highcharts/modules/pareto';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { SeriesOneResponse } from '@core/common/domain/response';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'HighchartsParetoChart' })
export default class HighchartsParetoChart extends BaseHighChartWidget<SeriesOneResponse, ParetoChartOption, ParetoQuerySetting> {
  static readonly BASE_SERIES_INDEX: number = 0;

  @Ref()
  chart: any;
  private numberFormatter!: NumberFormatter;

  constructor() {
    super();
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const paretoYAxisFormatter = this.paretoYAxisFormatter;

    const manualOptions: Highcharts.Options = {
      chart: {
        renderTo: 'container',
        type: 'column'
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
      subtitle: {
        useHTML: true
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
              return paretoYAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        }
      ],
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

  @Watch('setting')
  onChartSettingChanged() {
    this.reRenderChart();
  }

  @Watch('data')
  onChartDataChanged() {
    this.reRenderChart();
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
  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, ParetoChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  isHorizontalZoomIn(): boolean {
    return false;
  }

  isHorizontalZoomOut(): boolean {
    return false;
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  protected buildHighchart() {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      const paretoIndex = this.getParetoIndex(this.setting.baseTypes);
      this.load(this.data, paretoIndex);
      this.buildAxis(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsParetoChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesOneResponse, paretoIndex: number) {
    const series = this.toSeries(chartData, paretoIndex);
    HighchartUtils.addSeries(this.getChart(), series);
  }

  protected buildAxis(chartData: SeriesOneResponse) {
    const options: any = {};
    const xAxisFormatter = this.xAxisFormatter;
    if (ListUtils.isNotEmpty(chartData.xAxis)) {
      options['xAxis'] = [
        {
          type: 'category',
          categories: chartData.xAxis,
          labels: {
            useHTML: true,
            formatter: function() {
              return xAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        }
      ];
    }
    const paretoAxis = {
      title: { text: 'Pareto' },
      labels: {
        format: '{value}%'
      },
      opposite: true
    };
    if (ListUtils.isNotEmpty(chartData.yAxis)) {
      options['yAxis'] = [
        {
          type: 'category',
          categories: chartData.yAxis
        },
        paretoAxis
      ];
    } else {
      options['yAxis'] = [{}, paretoAxis];
    }
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    const formattedData = this.numberFormatter.format(contextObject.y);
    const field = contextObject.series.name;
    const fieldProperty = contextObject.key;
    const pointColor = contextObject.color;
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="color: ${textColor}; font-family: ${fontFamily}; text-align: left">
                <span>${field}</span><br/>
                <span style="color:${pointColor}">●</span>
                ${fieldProperty}: <b>${formattedData}</b><br/>
            </div>`;
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const textColor = this.setting.options?.plotOptions?.series?.dataLabels?.style?.color ?? '#fff';
    const formattedData = this.numberFormatter.format(point.y ?? 0);
    return `<div style="color: ${textColor}"> ${formattedData}</div>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private toSeries(chartData: SeriesOneResponse, paretoIndex: number) {
    const pareto = {
      type: 'pareto',
      name: 'Pareto',
      yAxis: 1,
      baseSeries: paretoIndex
    };
    const series = Array.from<any>(chartData.series);
    series.push(pareto);
    return series;
  }

  private getParetoIndex(baseTypes: Record<string, number>): number {
    if (baseTypes && baseTypes['pareto']) {
      return baseTypes['pareto'];
    }

    return HighchartsParetoChart.BASE_SERIES_INDEX;
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

  private paretoYAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject<any>) {
    const value = axis.value;
    return `
        <div>${value}</div>
    `;
  }
}
