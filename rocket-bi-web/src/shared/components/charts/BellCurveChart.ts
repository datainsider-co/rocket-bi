import { Component, Ref, Watch } from 'vue-property-decorator';
import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { DIException } from '@core/domain/Exception';
import { BellCurveChartOption, BellCurveQuerySetting, ChartOption, ChartOptionData } from '@core/domain/Model';
import { SeriesTwoResponse } from '@core/domain/Response';
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
export default class BellCurveChart extends BaseHighChartWidget<SeriesTwoResponse, BellCurveChartOption, BellCurveQuerySetting> {
  public static readonly BASE_SERIES_INDEX = 0;

  @Ref()
  chart: any;

  // todo: fixme return correct default type
  protected renderController: RenderController<SeriesTwoResponse>;
  private numberFormatter!: NumberFormatter;

  constructor() {
    super();
    const tooltipFormatter = this.tooltipFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const bellCurveLabel = {
      title: { text: 'Bell Curve' },
      opposite: true,
      labels: {
        formatter: function() {
          return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
        }
      }
    };
    const defaultLabel = {
      title: { text: '' },
      labels: {
        formatter: function() {
          return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
        }
      }
    };
    const manualOptions: Highcharts.Options = {
      xAxis: [defaultLabel, bellCurveLabel],
      yAxis: [defaultLabel, bellCurveLabel],
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
      this.setting.options.metricNumbers ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2
    );
    this.renderController = this.createRenderController();
  }

  tooltipPointFormat(contextObject: TooltipFormatterContextObject) {
    const field = contextObject.series.name;
    const pointColor = contextObject.color;
    const formattedXAxis = this.numberFormatter.format(contextObject.x);
    const formattedYAxis = this.numberFormatter.format(contextObject.y);
    return `<div style=" text-align: left">
                <span style="color:${pointColor}">●</span>  <span>${field}</span><br/>
                x: <b>${formattedXAxis}</b><br/>
                y: <b>${formattedYAxis}</b><br/>
            </div>`;
  }

  bellCurveFormat(contextObject: TooltipFormatterContextObject) {
    const bellCurveName = contextObject.series.name;
    const textColor = this.setting.options.textColor;
    const pointColor = contextObject.color;
    const formattedData = this.numberFormatter.format(contextObject.x);
    const bellCurveValue = contextObject.y;
    return `<div style="color: ${textColor}; text-align: left">
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

  @Watch('setting.options.metricNumbers')
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
    this.options = merge({}, ChartOption.CONFIG, BellCurveChartOption.DEFAULT_SETTING, this.options, newOptions);
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
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsBellCurveChart:: buildChart:: ${e.toString()}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesTwoResponse, bellCurveIndex: number) {
    const series = this.toSeries(chartData, bellCurveIndex);
    HighchartUtils.addSeries(this.getChart(), series);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    if (contextObject.point.name) {
      return this.tooltipPointFormat(contextObject);
    } else {
      return this.bellCurveFormat(contextObject);
    }
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }

  private createRenderController(): RenderController<SeriesTwoResponse> {
    const pageRenderService = DI.get(PageRenderService);
    const processRenderService = DI.get(RenderProcessService);
    return new RenderController(pageRenderService, processRenderService);
  }

  private toSeries(chartData: SeriesTwoResponse, bellCurveIndex: number) {
    const bell: any = {
      name: 'Bell curve',
      type: 'bellcurve',
      xAxis: 1,
      yAxis: 1,
      baseSeries: bellCurveIndex,
      zIndex: -1
    };
    const series = Array.from<any>(chartData.series);
    series.push(bell);
    return series;
  }

  private getBellCurveIndex(baseTypes: Record<string, number>): number {
    if (baseTypes && baseTypes['bellCurve']) {
      return baseTypes['bellCurve'];
    }

    return BellCurveChart.BASE_SERIES_INDEX;
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
    const value = this.numberFormatter.format(axis.value);
    return `
        <div> ${value}</div>
    `;
  }
}
