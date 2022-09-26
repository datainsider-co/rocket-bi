import { Component, Ref, Watch } from 'vue-property-decorator';
import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { DIException } from '@core/domain/Exception';
import { BellCurve2QuerySetting, BellCurveChartOption2, ChartOption, ChartOptionData, TextSetting } from '@core/domain/Model';
import { SeriesOneResponse } from '@core/domain/Response';
import { HighchartUtils, MetricNumberMode } from '@/utils';
import { RenderController } from '@chart/custom/RenderController';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { DI } from '@core/modules';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { Log } from '@core/utils';
import { NumberFormatter, RangeData } from '@core/services/formatter';

@Component({
  props: PropsBaseChart
})
export default class BellCurve2Chart extends BaseHighChartWidget<SeriesOneResponse, BellCurveChartOption2, BellCurve2QuerySetting> {
  public static readonly BASE_SERIES_INDEX = 0;

  @Ref()
  chart: any;

  // todo: fixme return correct default type
  protected renderController: RenderController<SeriesOneResponse>;
  private numberFormatter!: NumberFormatter;

  constructor() {
    super();
    const plotSeriesOptions: Highcharts.PlotSeriesOptions = this.createRightClickAsOptions();
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const tooltipFormatter = this.tooltipFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const xAxisFormatter = this.xAxisFormatter;
    const bellCurveXAxisLabel = {
      title: { text: 'Bell Curve' },
      opposite: true,
      labels: {
        useHTML: true,
        formatter: function() {
          return xAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
        }
      }
    };
    const bellCurveYAxisLabel = {
      title: { text: 'Bell Curve' },
      opposite: true,
      labels: {
        useHTML: true,
        formatter: function() {
          return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
        }
      }
    };
    const defaultXAxisLabel = {
      title: { text: '' },
      labels: {
        useHTML: true,
        formatter: function() {
          return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
        }
      }
    };
    const defaultYAxisLabel = {
      title: { text: '' },
      labels: {
        useHTML: true,
        formatter: function() {
          return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
        }
      }
    };
    const manualOptions: Highcharts.Options = {
      colors: this.setting.colors,
      xAxis: [defaultXAxisLabel, bellCurveXAxisLabel],
      yAxis: [defaultYAxisLabel, bellCurveYAxisLabel],
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
        bellcurve: {
          ...plotSeriesOptions
        },
        series: {
          dataLabels: {
            useHTML: true,
            formatter: function() {
              return dataLabelsFormatter((this as any) as Highcharts.PointLabelObject);
            }
          }
        }
      }
    };
    this.updateOptions(manualOptions);
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2
    );
    this.renderController = this.createRenderController();
  }

  tooltipPointFormat(contextObject: TooltipFormatterContextObject) {
    const field = contextObject.series.name;
    const pointColor = contextObject.color;
    const formattedXAxis = this.numberFormatter.format(contextObject.x);
    const formattedYAxis = this.numberFormatter.format(contextObject.y);
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="color: ${textColor}; font-family: ${fontFamily}; text-align: left">
                <span style="color:${pointColor}">●</span>  <span>${field}</span><br/>
                x: <b>${formattedXAxis}</b><br/>
                y: <b>${formattedYAxis}</b><br/>
            </div>`;
  }

  bellCurveFormat(contextObject: TooltipFormatterContextObject) {
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    const bellCurveName = contextObject.series.name;
    const pointColor = contextObject.color;
    const formattedData = this.numberFormatter.format(contextObject.x);
    const bellCurveValue = contextObject.y;
    return `<div style="color: ${textColor}; font-family: ${fontFamily}; text-align: left">
                <span style="color:${pointColor}">●</span>
                <b>${formattedData}</b><br/>
               ${bellCurveName}: <b>${bellCurveValue}</b><br/>
            </div>`;
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

  mounted() {
    this.reRenderChart();
  }

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, BellCurveChartOption2.DEFAULT_SETTING, this.options, newOptions);
  }

  beforeDestroy() {
    this.renderController.dispose();
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  protected buildHighchart() {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      const bellCurveIndex = this.getBellCurveIndex(this.setting.baseTypes);
      this.load(this.data, bellCurveIndex);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsBellCurveChart:: buildChart:: ${e.toString()}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesOneResponse, bellCurveIndex: number) {
    const series = this.toSeries(chartData, bellCurveIndex);
    Log.debug('series from bell 2', series);
    HighchartUtils.addSeries(this.getChart(), series);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }

  private createRenderController(): RenderController<SeriesOneResponse> {
    const pageRenderService = DI.get(PageRenderService);
    const processRenderService = DI.get(RenderProcessService);
    return new RenderController(pageRenderService, processRenderService);
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    if (contextObject.point.name) {
      return this.tooltipPointFormat(contextObject);
    } else {
      return this.bellCurveFormat(contextObject);
    }
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const textColor = this.setting.options?.plotOptions?.series?.dataLabels?.style?.color ?? '#fff';
    const formattedData = this.numberFormatter.format(point.y ?? 0);
    return `<div style="color: ${textColor}"> ${formattedData}</div>`;
  }

  private toSeries(chartData: SeriesOneResponse, bellCurveIndex: number) {
    const bell: any = {
      name: 'Bell curve',
      type: 'bellcurve',
      xAxis: 1,
      yAxis: 1,
      baseSeries: bellCurveIndex,
      zIndex: -1
    };
    const series = Array.from<any>(chartData.series);
    const scatterSeries = series[0];
    scatterSeries.visible = false;
    series.push(bell);
    return series;
  }

  private getBellCurveIndex(baseTypes: Record<string, number>): number {
    if (baseTypes && baseTypes['bellCurve']) {
      return baseTypes['bellCurve'];
    }

    return BellCurve2Chart.BASE_SERIES_INDEX;
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
    if (yAxisSetting && yAxisSetting[1]) {
      return this.customAxisLabel(value, yAxisSetting[1].prefix, yAxisSetting[1].postfix);
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
    const value = this.numberFormatter.format(axis.value);
    if (xAxisSetting && xAxisSetting[1]) {
      return this.customAxisLabel(value, xAxisSetting[1].prefix, xAxisSetting[1].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }
}
