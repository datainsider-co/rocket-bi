import Highcharts, { Point } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { ChartOption, ChartOptionData, PieChartOption, PieQuerySetting } from '@core/common/domain/model';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { SeriesTwoResponse } from '@core/common/domain/response';
import { HighchartUtils, MetricNumberMode } from '@/utils';
import { RenderController } from '@chart/custom/RenderController';
import { Di } from '@core/common/modules';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { JsonUtils, Log } from '@core/utils';
import { CrossFilterData } from '@/screens/dashboard-detail/stores';

export enum DataLabelFormatterMode {
  NameAndPercent = 'NameAndPercent',
  NameAndValue = 'NameAndValue',
  Name = 'Name'
}

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'PieChart' })
export default class PieChart extends BaseHighChartWidget<SeriesTwoResponse, PieChartOption, PieQuerySetting> {
  @Ref()
  chart: any;

  // todo: fixme return correct default type
  protected renderController: RenderController<SeriesTwoResponse>;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const selectSeriesItem = this.handleSelectSeriesItem;
    const drilldownListener = this.createRightClickAsOptions('name');
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const piePlotOptions = JsonUtils.mergeDeep(drilldownListener, {
      allowPointSelect: true,
      cursor: 'pointer',
      point: {
        events: {
          click: function() {
            selectSeriesItem(((this as any) as Point).name);
          }
        }
      }
    });

    const manualOptions: Highcharts.Options = {
      chart: {
        type: 'pie'
      },
      colors: this.setting.colors,
      // tooltip: {
      //   pointFormat: '{point.series.name}: <b>{point.y}</b>'
      // },
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
      accessibility: {
        point: {
          valueSuffix: '%'
        }
      },
      plotOptions: {
        pie: {
          ...piePlotOptions,
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
      this.setting.options?.plotOptions?.pie?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
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

  @Watch('setting.options.plotOptions.pie.dataLabels.displayUnit')
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
    this.options = merge({}, ChartOption.CONFIG, PieChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  handleSelectSeriesItem(value: string) {
    if (this.setting.options.isCrossFilter) {
      this.$root.$emit(DashboardEvents.ApplyCrossFilter, new CrossFilterData(this.chartInfo.id, value));
    }
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
        Log.error(`HighchartsPieChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesTwoResponse) {
    HighchartUtils.addSeries(this.getChart(), chartData.series);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
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

  private tooltipFormatter(point: Highcharts.TooltipFormatterContextObject): string {
    // Log.debug("Pie::Tooltip::Point:: ", point);
    const x = point.key;
    const name = point.series.name;
    const value = this.numberFormatter.format(point.y);
    const color = point.color;
    const textColor = this.setting.options.tooltip?.style?.color ?? '#fff';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${x}</span></br>
                <span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b>
            </div>`;
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const dataLabelsMode: DataLabelFormatterMode = this.setting.options?.plotOptions?.pie?.dataLabels?.labelFormat ?? DataLabelFormatterMode.NameAndValue;
    const textColor = this.setting.options?.plotOptions?.pie?.dataLabels?.style?.color ?? '#fff';
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

  private updateMetricNumber(options: ChartOptionData) {
    const metricNumber: string[] | undefined = HighchartUtils.toMetricNumbers(options?.plotOptions?.pie?.dataLabels?.displayUnit ?? MetricNumberMode.Default);
    Highcharts.setOptions({
      plotOptions: {
        pie: {
          dataLabels: {
            //@ts-ignore
            displayUnit: metricNumber
          }
        }
      }
    });
  }
}
