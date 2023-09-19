import { Component, Ref, Watch } from 'vue-property-decorator';
import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { ChartOption, ChartOptionData, HistogramChartOption, HistogramQuerySetting, TextSetting } from '@core/common/domain/model';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { merge } from 'lodash';
import { SeriesOneResponse } from '@core/common/domain/response';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { Log } from '@core/utils';
import { NumberFormatter, RangeData } from '@core/common/services';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'HighchartsHistogramChart' })
export default class HistogramChart extends BaseHighChartWidget<SeriesOneResponse, HistogramChartOption, HistogramQuerySetting> {
  @Ref()
  chart: any;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const plotSeriesOptions: Highcharts.PlotSeriesOptions = this.createRightClickAsOptions();
    const yAxisFormatter = this.yAxisFormatter;
    const xAxisFormatter = this.xAxisFormatter;
    const histogramLabel = {
      title: { text: '' },
      tickLength: 0,
      labels: {
        useHTML: true,
        formatter: function() {
          return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject);
        }
      }
    };
    const xAxisHistogramLabel = {
      title: { text: '' },
      tickLength: 0,
      labels: {
        useHTML: true,
        formatter: function() {
          return xAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject);
        }
      }
    };
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const tooltipFormatter = this.tooltipFormatter;
    const manualOptions = {
      chart: {
        type: 'column',
        renderTo: 'container'
      },
      colors: this.setting.colors,
      xAxis: [xAxisHistogramLabel],
      yAxis: [histogramLabel],
      plotOptions: {
        series: {
          ...plotSeriesOptions,
          borderColor: this.setting.getBackgroundColor(),
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
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2,
      this.setting.options.decimalPoint,
      this.setting.options.thousandSep
    );
    this.updateOptions(manualOptions);
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
    this.options = merge({}, ChartOption.CONFIG, HistogramChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  protected buildHighchart() {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      this.load(this.data);
      this.buildAxis(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsHistogramChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesOneResponse) {
    HighchartUtils.addSeries(this.getChart(), chartData.series);
  }

  //TODO: buildAxis is empty
  protected buildAxis(chartData: SeriesOneResponse) {
    const options: any = {};

    if (ListUtils.isNotEmpty(chartData.xAxis)) {
      options['xAxis'] = {
        // type: 'category',
        categories: chartData.xAxis
      };
    }
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private updateMetricNumber(options: ChartOptionData) {
    const metricNumber: string[] | undefined = HighchartUtils.toMetricNumbers(
      options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default
    );
    Highcharts.setOptions({
      plotOptions: {
        series: {
          dataLabels: {
            //@ts-ignore
            displayUnit: metricNumber
          }
        }
      }
    });
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const formattedData = this.numberFormatter.format(point.y ?? 0);
    const textColor = this.setting.options?.plotOptions?.series?.dataLabels?.style?.color ?? '#fff';
    return `<div style="color: ${textColor}"> ${formattedData}</div>`;
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    const formattedData = this.numberFormatter.format(contextObject.y as number);
    const field = contextObject.series.name;
    const fieldProperty = contextObject.key;
    const pointColor = contextObject.color;
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? ChartOption.getSecondaryFontFamily();
    return `<div style="color: ${textColor}; text-align: left; font-family: ${fontFamily}">
                <span>${fieldProperty}</span><br/>
                <span style="color:${pointColor}">●</span>
                ${field}: <b>${formattedData}</b><br/>
            </div>`;
  }

  private yAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject) {
    const yAxisSetting = this.setting.options.yAxis;
    const value = this.numberFormatter.format(axis.value as number);
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

  private xAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject) {
    const xAxisSetting = this.setting.options.xAxis;
    const value = axis.value;
    if (xAxisSetting && xAxisSetting[0]) {
      return this.customAxisLabel(value as string, xAxisSetting[0].prefix, xAxisSetting[0].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }
}
