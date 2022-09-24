import { Component, Ref, Watch } from 'vue-property-decorator';
import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { ChartOption, ChartOptionData, SpiderWebChartOption, SpiderWebQuerySetting, TextSetting } from '@core/domain/Model';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/annotation';
import { DIException } from '@core/domain/Exception';
import { SeriesOneResponse } from '@core/domain/Response';
import { RenderController } from '@chart/custom/RenderController';
import { DI } from '@core/modules';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { NumberFormatter, RangeData } from '@core/services/formatter';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/string.utils';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'SpiderWebChart' })
export default class SpiderWebChart extends BaseHighChartWidget<SeriesOneResponse, SpiderWebChartOption, SpiderWebQuerySetting> {
  @Ref()
  chart: any;

  // todo: fixme return correct default type
  protected renderController: RenderController<SeriesOneResponse>;
  private numberFormatter!: NumberFormatter;

  constructor() {
    super();
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const manualOptions: Highcharts.Options = {
      chart: {
        polar: true,
        type: 'line'
      },
      yAxis: [
        {
          gridLineInterpolation: 'polygon',
          labels: {
            useHTML: true,
            formatter: function() {
              return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        }
      ],
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
      this.setting.options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
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

  @Watch('textColor')
  onTextColorChanged() {
    if (this.isCustomDisplay()) {
      this.buildCustomChart();
    } else {
      this.updateTextColor(this.textColor, true);
    }
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

  beforeDestroy() {
    this.renderController.dispose();
  }

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, SpiderWebChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  protected buildHighchart() {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      this.load(this.data, this.setting.seriesTypesByLabelMap);
      this.buildAxis(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`SeriesChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: SeriesOneResponse, chartTypeWithLabelMap: Map<string, string>) {
    const seriesWithType = chartData.series.map(item => {
      const { name } = item;
      const type = chartTypeWithLabelMap.get(StringUtils.removeWhiteSpace(StringUtils.camelToCapitalizedStr(name)).replace('.', ''));
      return {
        ...item,
        type: type
      };
    });
    HighchartUtils.addSeries(this.getChart(), seriesWithType);
  }

  protected buildAxis(chartData: SeriesOneResponse) {
    const options: any = {};
    const xAxisFormatter = this.xAxisFormatter;

    if (ListUtils.isNotEmpty(chartData.xAxis)) {
      options['xAxis'] = [
        {
          // type: 'category',
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
    if (ListUtils.isNotEmpty(chartData.yAxis)) {
      options['yAxis'][0] = [
        {
          type: 'category',
          categories: chartData.yAxis
        }
      ];
    }
    if (chartData.haveComparison()) {
      options.plotOptions = {
        series: {
          grouping: false
        }
      };
    }
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const textColor = this.setting.options?.plotOptions?.series?.dataLabels?.style?.color ?? '#fff';
    const formattedData = this.numberFormatter.format(point.y ?? 0);
    return `<div style="color: ${textColor}"> ${formattedData}</div>`;
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    let result = '';
    if (contextObject.points) {
      contextObject.points.forEach(point => {
        const formattedData = this.numberFormatter.format(point.y);
        result =
          result +
          `<div class="d-flex" style="color: ${textColor}; font-family: ${fontFamily}">
                                <span style="color:${point.color}; padding-right: 5px;">●</span>
                                <div style="color: ${this.setting.options.textColor}">${point.series.name} : ${formattedData}</div>
                           </div> `;
      });
    }
    return result;
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

  private updateTextColor(color: string | undefined, reDraw: boolean): void {
    // if (color) {
    //   const newStyle = {
    //     color: color
    //   };
    //   const newColorOption = {
    //     legend: {
    //       itemStyle: newStyle
    //     },
    //     xAxis: [
    //       {
    //         title: {
    //           style: newStyle
    //         },
    //         labels: {
    //           style: newStyle
    //         }
    //       },
    //       {
    //         title: {
    //           style: newStyle
    //         },
    //         labels: {
    //           style: newStyle
    //         }
    //       }
    //     ],
    //     yAxis: [
    //       {
    //         title: {
    //           style: newStyle
    //         },
    //         labels: {
    //           style: newStyle
    //         }
    //       },
    //       {
    //         title: {
    //           style: newStyle
    //         },
    //         labels: {
    //           style: newStyle
    //         }
    //       }
    //     ]
    //   };
    //   HighchartUtils.updateChart(this.getChart(), newColorOption, reDraw);
    // }
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
}
