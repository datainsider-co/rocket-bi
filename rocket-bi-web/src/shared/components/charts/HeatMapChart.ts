import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { ChartOption, HeatMapChartOption, HeatMapQuerySetting, TextSetting } from '@core/common/domain/model';
import { merge, toNumber } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { SeriesTwoResponse } from '@core/common/domain/response';
import { HighchartUtils, MetricNumberMode } from '@/utils';
import { RenderController } from '@chart/custom/RenderController';
import { Di } from '@core/common/modules';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'HeatMapChart' })
export default class HeatMapChart extends BaseHighChartWidget<SeriesTwoResponse, HeatMapChartOption, HeatMapQuerySetting> {
  @Ref()
  chart: any;
  // todo: fixme return correct default type
  protected renderController: RenderController<SeriesTwoResponse>;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const plotSeriesOptions: Highcharts.PlotSeriesOptions = this.createRightClickAsOptions();

    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const manualOptions = {
      chart: {
        type: 'heatmap'
      },
      plotOptions: {
        heatmap: {
          ...plotSeriesOptions,
          turboThreshold: this.data.series[0].data.length + 1000,
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
    this.updateOptions(manualOptions);
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options.plotOptions?.heatmap?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2
    );
    this.renderController = this.createRenderController();
  }

  @Watch('setting')
  onChartSettingChanged() {
    this.reRenderChart();
  }

  @Watch('data')
  onChartDataChanged() {
    this.reRenderChart();
  }

  @Watch('setting.options.plotOptions.heatmap.dataLabels.displayUnit')
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

  beforeDestroy() {
    this.renderController.dispose();
  }

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, HeatMapChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  protected buildHighchart(): void {
    try {
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
        Log.error(`HighchartsHeatMapChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected buildAxis(chartData: SeriesTwoResponse) {
    const options: any = {};
    const xAxisFormatter = this.xAxisFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    if (chartData.xAxis) {
      options['xAxis'] = {
        type: 'category',
        categories: chartData.xAxis,
        labels: {
          useHTML: true,
          formatter: function() {
            return xAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
          }
        }
      };
    }
    if (chartData.yAxis) {
      options['yAxis'] = {
        type: 'category',
        categories: chartData.yAxis,
        labels: {
          useHTML: true,
          formatter: function() {
            return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
          }
        }
      };
    }
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected load(chartData: SeriesTwoResponse) {
    HighchartUtils.addSeries(this.getChart(), chartData.series);
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    const formattedData = this.numberFormatter.format(contextObject.point.value ?? 0);
    const pointColor = contextObject.color;
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    Log.debug('HeatMap::tooltip::', contextObject);
    const xAxisLabel = contextObject.series.xAxis.categories[contextObject.point.x];
    const yAxisLabel = contextObject.series.yAxis.categories[toNumber(contextObject.point.y)];
    return `<div style="color: ${textColor}; font-family: ${fontFamily}; text-align: left">
                <div style="font-size: 10px"><span style="color:${pointColor}">●</span> ${contextObject.series.name}</div>
                ${xAxisLabel}, ${yAxisLabel}: <b>${formattedData}</b><br/>
            </div>`;
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const formattedData = this.numberFormatter.format(point.point.value ?? 0);
    const textColor = this.setting.options.plotOptions?.heatmap?.dataLabels?.style?.color ?? '#fff';
    return `<div style="color: ${textColor}; text-align: left">
                <b>${formattedData}</b><br/>
            </div>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }

  private createRenderController(): RenderController<SeriesTwoResponse> {
    const pageRenderService = Di.get(PageRenderService);
    const processRenderService = Di.get(RenderProcessService);
    return new RenderController(pageRenderService, processRenderService);
  }

  private yAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject<any>) {
    const yAxisSetting = this.setting.options.yAxis;
    const value = axis.value;
    if (yAxisSetting && yAxisSetting[0]) {
      return this.customAxisLabel(value, yAxisSetting[0].prefix, yAxisSetting[0].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }

  private customAxisLabel(value: number | string, prefix?: TextSetting, postfix?: TextSetting) {
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
