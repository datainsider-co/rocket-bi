import Highcharts, { Series, TooltipFormatterContextObject } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { BulletChartOption, ChartOption, GaugeQuerySetting } from '@core/common/domain/model';
import { DIException } from '@core/common/domain/exception';
import { isNaN, isNumber, merge, toNumber } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { SeriesOneResponse } from '@core/common/domain/response';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';
import { FormatterMode } from '@chart/GaugeChart';

@Component({
  props: PropsBaseChart
})
export default class BulletGraph extends BaseHighChartWidget<SeriesOneResponse, BulletChartOption, GaugeQuerySetting> {
  @Ref()
  chart: any;

  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const formatter = this.formatter;
    const tooltipFormatter = this.tooltipFormatter;
    const manualOptions: Highcharts.Options = {
      chart: {
        inverted: true,
        type: 'bullet'
      },
      legend: {
        enabled: false
      },
      yAxis: {
        gridLineWidth: 0
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
        formatter: function(tooltip) {
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

  private get targetValue(): number {
    const targetValue = toNumber(this.setting.options.target);
    if (this.isPositiveNumber(targetValue)) {
      return targetValue;
    }
    return 0;
  }

  // private get maxValue(): number {
  //   const maxValue = toNumber(this.setting.options.yAxis?.max);
  //   if (this.isPositiveNumber(maxValue)) {
  //     return maxValue;
  //   } else {
  //     return 0;
  //   }
  // }
  //
  // private get minValue(): number {
  //   const minValue = toNumber(this.setting.options.yAxis?.min);
  //   if (isNaN(minValue)) {
  //     return 0;
  //   } else {
  //     return minValue;
  //   }
  // }

  private get hasTargetValue(): boolean {
    return this.isPositiveNumber(this.targetValue);
  }

  // private get displayTargetValue(): number {
  //   return Math.min(this.maxValue, this.targetValue);
  // }

  private get isPercentage(): boolean {
    return this.setting.options.percentage;
  }

  private get formatterMode(): FormatterMode {
    if (this.hasTargetValue && this.isPercentage) {
      return FormatterMode.target;
    } else if (!this.hasTargetValue && this.isPercentage) {
      return FormatterMode.max;
    } else {
      return FormatterMode.normal;
    }
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
    this.options = merge({}, ChartOption.CONFIG, BulletChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart?.getChart();
  }

  protected buildHighchart() {
    try {
      HighchartUtils.reset(this.getChart());
      const series: Series[] = this.load(this.data, this.setting);
      this.buildAxis(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignRightClick(series);
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsBulletChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesOneResponse, setting: BulletChartOption) {
    if (!ListUtils.hasOnlyOneItem(chartData.series) || !ListUtils.hasOnlyOneItem(chartData.series[0].data))
      throw new DIException('Bullet chart only support table with 1 row and 1 column');
    const y = chartData.series[0].data[0];
    const target = setting.options.plotOptions?.series?.targetOptions?.value ?? 7500;
    const series = [
      {
        data: [
          {
            name: chartData.series[0].name,
            y: y,
            target: target
          }
        ]
      }
    ];
    return HighchartUtils.addSeries(this.getChart(), series);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private isPositiveNumber(number: number): boolean {
    return isNumber(number) && !isNaN(number) && number > 0;
  }

  private formatter(point: Highcharts.PointLabelObject) {
    return this.normalFormat(point);
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    const formattedData = this.numberFormatter.format(contextObject.y as number);
    const tooltipLabel = contextObject.series.name;
    const pointColor = contextObject.color;
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? ChartOption.getSecondaryFontFamily();
    return `<div style="color: ${textColor}; font-family: ${fontFamily}">
<!--                <span style="color:${pointColor}">●</span>-->
                ${tooltipLabel}: <b>${formattedData}</b><br/>
            </div>`;
  }

  private targetPercentageFormat(point: Highcharts.PointLabelObject) {
    const currentValue = point.y ?? 0;
    const rateBaseOnTargetValue = currentValue / this.targetValue;
    const textColor = this.setting.options.textColor;
    const renderData = Math.round(rateBaseOnTargetValue * 100);
    return `<div style="color: ${textColor}">${renderData} %</div>`;
  }

  private normalFormat(point: Highcharts.PointLabelObject) {
    const formattedData = this.numberFormatter.format(point.y ?? 0);
    const textColor = this.setting.options.textColor;
    return `<div style="color: ${textColor}">${formattedData}</div>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private buildAxis(data: SeriesOneResponse) {
    const xAxisOptions = {
      xAxis: {
        categories: [data.series[0].name]
      },
      yAxis: {
        title: null
      }
    };
    HighchartUtils.updateChart(this.getChart(), xAxisOptions);
  }
  get chartClass(): string {
    if (this.backgroundColor) {
      if (this.isPreview) {
        return 'h-25 w-100 m-0 p-0 highcharts-container';
      } else {
        return 'h-100 w-100 m-0 p-0 highcharts-container';
      }
    }
    return 'h-100 w-100 m-0 p-0 secondary-chart-background-color highcharts-container';
  }
}
