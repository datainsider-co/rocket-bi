import Highcharts, { Series, TooltipFormatterContextObject } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler, MethodProfiler } from '@/shared/profiler/annotation';
import { DIException } from '@core/domain/Exception';
import { ChartOption, TreeMapChartOption, TreeMapQuerySetting } from '@core/domain/Model';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { TreeMapResponse } from '@core/domain/Response';
import { RenderController } from '@chart/custom/RenderController';
import { DI } from '@core/modules';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { NumberFormatter, RangeData } from '@core/services/formatter';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'TreeMapChart' })
export default class TreeMapChart extends BaseHighChartWidget<TreeMapResponse, TreeMapChartOption, TreeMapQuerySetting> {
  @Ref()
  chart: any;

  protected renderController: RenderController<TreeMapResponse>;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const manualOptions = {
      colors: this.setting.colors,
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
      subtitle: {
        useHTML: true
      },
      plotOptions: {
        treemap: {
          dataLabels: {
            useHTML: true,
            formatter: function() {
              return dataLabelsFormatter((this as any) as Highcharts.PointLabelObject);
            },
            align: 'center'
          }
        }
      }
    };
    this.updateOptions(manualOptions);
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options.plotOptions?.treemap?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2
    );
    this.renderController = this.createRenderController();
  }

  @MethodProfiler({ name: 'cloneChartData' })
  private get cloneChartData() {
    return TreeMapResponse.fromObject(this.data);
  }

  @Watch('setting')
  onChartSettingChanged() {
    this.reRenderChart();
  }

  @Watch('data')
  onChartDataChanged() {
    this.reRenderChart();
  }

  @Watch('setting.options.plotOptions.treemap.dataLabels.displayUnit')
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

  updateGroupColor(chartData: TreeMapResponse, colors: string[]) {
    chartData.groupNames?.forEach((_, index) => {
      chartData.data[index].color = ListUtils.getElementCycleList(colors, index);
    });
  }

  toSeries(chartData: TreeMapResponse): any[] {
    const series = [];
    series.push({
      type: 'treemap',
      allowTraversingTree: true,
      turboThreshold: chartData.data.length + 1000,
      data: chartData.data
    });
    return series;
  }

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, TreeMapChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  beforeDestroy() {
    this.renderController.dispose();
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart?.getChart();
  }

  protected buildHighchart() {
    try {
      HighchartUtils.reset(this.getChart());
      this.updateGroupColor(this.data, this.setting.colors);
      const series: Series[] = this.load(this.cloneChartData);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignRightClick(series);
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsTreeMapChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: TreeMapResponse) {
    const series = this.toSeries(chartData);
    return HighchartUtils.addSeries(this.getChart(), series);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    const formattedData = this.numberFormatter.format(contextObject.point.value ?? 0);
    const fieldProperty = contextObject.key;

    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="color: ${textColor};font-family: ${fontFamily}; text-align: left;">
                ${fieldProperty}: <b>${formattedData}</b><br/>
            </div>`;
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const textColor = this.setting.options?.plotOptions?.treemap?.dataLabels?.style?.color ?? '#fff';
    return `<span class="text-truncate" style="color: ${textColor};">${point.key}</span>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }

  private createRenderController(): RenderController<TreeMapResponse> {
    const pageRenderService = DI.get(PageRenderService);
    const processRenderService = DI.get(RenderProcessService);
    return new RenderController(pageRenderService, processRenderService);
  }
}
