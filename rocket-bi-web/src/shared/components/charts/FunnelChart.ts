import { Component, Ref, Watch } from 'vue-property-decorator';
import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { ChartOption, ChartOptionData, FunnelChartOption, FunnelQuerySetting } from '@core/common/domain/model';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { SeriesTwoResponse } from '@core/common/domain/response';
import { HighchartUtils, MetricNumberMode } from '@/utils';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { DataLabelFormatterMode } from '@chart/PieChart';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'FunnelChart' })
export default class FunnelChart extends BaseHighChartWidget<SeriesTwoResponse, FunnelChartOption, FunnelQuerySetting> {
  static readonly CATEGORY_INDEX = 0;
  static readonly VALUE_INDEX = 1;
  @Ref()
  chart: any;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const plotFunnelOptions: Highcharts.PlotSeriesOptions = this.createRightClickAsOptions('name');
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const manualOptions: Highcharts.Options = {
      chart: {
        type: 'funnel'
      },
      colors: this.setting.colors,
      plotOptions: {
        funnel: {
          ...(plotFunnelOptions as Highcharts.PlotFunnelOptions),
          dataLabels: {
            useHTML: true,
            formatter: function() {
              return dataLabelsFormatter((this as any) as Highcharts.PointLabelObject);
            }
          },
          center: ['40%', '50%'],
          height: '90%',
          neckWidth: '20%',
          neckHeight: '25%',
          width: '60%'
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
    this.updateOptions(manualOptions);
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options.plotOptions?.funnel?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
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

  @Watch('setting.options.plotOptions.funnel.dataLabels.displayUnit')
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
    this.options = merge({}, ChartOption.CONFIG, FunnelChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  protected buildHighchart() {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      this.load(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsFunnelChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesTwoResponse) {
    // const series = this.toSeries(chartData);
    HighchartUtils.addSeries(this.getChart(), chartData.series);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const dataLabelsMode: DataLabelFormatterMode = this.setting.options?.plotOptions?.funnel?.dataLabels?.labelFormat ?? DataLabelFormatterMode.NameAndValue;
    const textColor = this.setting.options?.plotOptions?.funnel?.dataLabels?.style?.color ?? '#fff';
    switch (dataLabelsMode) {
      case DataLabelFormatterMode.NameAndPercent:
        return this.nameAndPercentFormat(point, textColor);
      case DataLabelFormatterMode.NameAndValue:
        return this.nameAndValueFormat(point, textColor);
      case DataLabelFormatterMode.Name:
        return this.nameFormat(point, textColor);
    }
  }

  private nameAndPercentFormat(point: Highcharts.PointLabelObject, textColor: string): string {
    const dataFormatted = NumberFormatter.round(point.percentage);
    const labelName = point.key;
    return `<div style="color:${textColor}">${labelName} : ${dataFormatted} %</div>`;
  }

  private nameAndValueFormat(point: Highcharts.PointLabelObject, textColor: string): string {
    const dataFormatted = this.numberFormatter.format(point.y ?? 0);
    const labelName = point.key;
    return `<div style="color:${textColor}">${labelName} : ${dataFormatted}</div>`;
  }

  private nameFormat(point: Highcharts.PointLabelObject, textColor: string): string {
    const labelName = point.key;
    return `<div style="color:${textColor}">${labelName}</div>`;
  }

  private tooltipFormatter(point: TooltipFormatterContextObject) {
    const formattedValue = this.numberFormatter.format(point.y as number);
    const name = point.series.name;
    const x = point.key;
    const color = point.color;
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? ChartOption.getSecondaryFontFamily();
    return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${name}</span></br>
                <span style="color:${color}; padding-right: 5px;">●</span>${x}: <b>${formattedValue}</b>
            </div>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private updateMetricNumber(options: ChartOptionData) {
    const metricNumber: string[] | undefined = HighchartUtils.toMetricNumbers(
      options?.plotOptions?.funnel?.dataLabels?.displayUnit ?? MetricNumberMode.Default
    );
    Highcharts.setOptions({
      plotOptions: {
        funnel: {
          dataLabels: {
            //@ts-ignore
            displayUnit: metricNumber
          }
        }
      }
    });
  }
}
