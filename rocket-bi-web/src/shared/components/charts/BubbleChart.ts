import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { BubbleChartOption, BubbleQuerySetting, ChartOption, ChartOptionData, TextSetting } from '@core/common/domain/model';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { DIException } from '@core/common/domain/exception';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { SeriesOneResponse, SeriesTwoResponse } from '@core/common/domain/response';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
export default class HighchartsBubbleChart extends BaseHighChartWidget<SeriesTwoResponse, BubbleChartOption, BubbleQuerySetting> {
  @Ref()
  chart: any;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const plotSeriesOptions: Highcharts.PlotSeriesOptions = this.createRightClickAsOptions();
    const tooltipFormatter = this.tooltipFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const xAxisFormatter = this.xAxisFormatter;
    const manualOptions = {
      colors: this.setting.colors,
      chart: {
        type: 'bubble',
        plotBorderWidth: 0.5,
        zoomType: 'xy'
      },
      xAxis: [
        {
          labels: {
            useHTML: true,
            formatter: function() {
              return xAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject);
            }
          }
        }
      ],
      yAxis: [
        {
          startOnTick: false,
          endOnTick: false,
          labels: {
            useHTML: true,
            formatter: function() {
              return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject);
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
      },
      plotOptions: {
        bubble: {
          ...plotSeriesOptions
        }
      }
    } as Highcharts.Options;
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
    this.options = merge({}, ChartOption.CONFIG, BubbleChartOption.DEFAULT_SETTING, this.options, newOptions);
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
        Log.error(`HighchartsBubbleChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected displayForecastData(forecastData: SeriesOneResponse) {
    HighchartUtils.reset(this.getChart());
    this.load(forecastData);
    this.buildAxis(forecastData);
    HighchartUtils.drawChart(this.getChart());
  }

  protected load(chartData: SeriesTwoResponse) {
    HighchartUtils.addSeries(this.getChart(), chartData.series);
  }

  protected buildAxis(chartData: SeriesTwoResponse) {
    const options: any = {};
    if (ListUtils.isNotEmpty(chartData.xAxis)) {
      options['xAxis'] = {
        // type: 'category',
        categories: chartData.xAxis
      };
    }
    if (ListUtils.isNotEmpty(chartData.yAxis)) {
      options['yAxis'] = {
        type: 'category',
        categories: chartData.yAxis
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
    const metrixNumber: string[] | undefined = HighchartUtils.toMetricNumbers(options.metricNumbers ?? MetricNumberMode.Default);
    Highcharts.setOptions({
      lang: {
        numericSymbols: metrixNumber
      }
    });
  }

  private tooltipFormatter(point: TooltipFormatterContextObject) {
    // Log.debug('Bubble::tooltip::', point);
    const formattedDataXAxis = this.numberFormatter.formatWithType(point.x as number, this.query.xAxis.function.field.fieldType);
    const formattedDataYAxis = this.numberFormatter.formatWithType(point.y as number, this.query.yAxis.function.field.fieldType);
    const formattedSize = this.numberFormatter.format(point.point.options.z ?? 0);
    const xAxisLabel = this.query.xAxis.name;
    const yAxisLabel = this.query.yAxis.name;
    const valueLabel = this.query.value.name;
    const textColor = this.setting.options.tooltip?.style?.color ?? '#fff';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? ChartOption.getSecondaryFontFamily();
    const color = point.color;
    const legend = point.series.name;
    return `<div style="color: ${textColor}; font-family: ${fontFamily}; text-align: left;">
              <div><span style="color:${color}; padding-right: 5px;">●</span>${legend}</div>
              <span>${xAxisLabel}: <b>${formattedDataXAxis}</b></span></br>
              <span>${yAxisLabel}: <b>${formattedDataYAxis}</b></span></br>
              <span>${valueLabel}: <b>${formattedSize}</b></span>
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
    const value = this.numberFormatter.format(axis.value as number);
    if (xAxisSetting && xAxisSetting[0]) {
      return this.customAxisLabel(value, xAxisSetting[0].prefix, xAxisSetting[0].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }
}
