import { ChartType } from '@/shared';
import { MethodProfiler } from '@/shared/profiler/Annotation';
import { ChartUtils, DateTimeFormatter, HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RenderController } from '@chart/custom/RenderController';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { DIException } from '@core/common/domain/exception';
import { ChartOption, ChartOptionData, LineStockChartOption, SeriesQuerySetting } from '@core/common/domain/model';
import { SeriesOneResponse } from '@core/common/domain/response';
import { Di } from '@core/common/modules';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';
import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import Highstock from 'highcharts/highstock';
import { cloneDeep, get, merge } from 'lodash';
import { Component, Ref, Watch } from 'vue-property-decorator';

@Component({
  props: PropsBaseChart
})
export default class LineStockChart extends BaseHighChartWidget<SeriesOneResponse, LineStockChartOption, SeriesQuerySetting> {
  @Ref()
  chart: any;
  highcharts = Highstock;

  protected renderController: RenderController<SeriesOneResponse>;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const tooltipFormatter = this.tooltipFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const manualOptions: Highcharts.Options = {
      chart: {
        type: 'line'
      },
      xAxis: {
        type: 'category'
      },
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
      yAxis: [
        {
          labels: {
            formatter: function() {
              return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        },
        {
          labels: {
            formatter: function() {
              return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
            }
          }
        }
      ],
      subtitle: {
        useHTML: true
      },
      tooltip: {
        useHTML: true,
        split: false,
        shared: false,
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
    Log.debug('manualOptions:', manualOptions);
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2
    );
    this.updateOptions(manualOptions);
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

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, LineStockChartOption.DEFAULT_SETTING, this.options, this.setting.options, newOptions);
  }

  beforeDestroy() {
    this.renderController.dispose();
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart?.getChart();
  }

  @MethodProfiler({ name: 'LineStockChart.buildHighchart' })
  protected buildHighchart(): void {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      // this.buildDualAxis(this.data, this.setting.options);
      this.load(this.data, this.setting);
      this.buildAxis(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`LineStockChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected buildAxis(chartData: SeriesOneResponse) {
    const options: any = {};
    const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
    if (isTimeStampXAxis) {
      options['xAxis'] = {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%Y-%m-%d'
        }
      };
    } else if (ListUtils.isNotEmpty(chartData.xAxis)) {
      options['xAxis'] = {
        type: 'category',
        categories: chartData.xAxis
      };
    }
    if (ListUtils.isNotEmpty(chartData.yAxis)) {
      options['yAxis'][0] = [
        {
          type: 'category',
          categories: chartData.yAxis
        }
      ];
    }
    // if (chartData.haveComparison()) {
    //   options.plotOptions = {
    //     series: {
    //       grouping: false
    //     }
    //   };
    // }
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected load(chartData: SeriesOneResponse, setting: LineStockChartOption) {
    const cloneSeries = cloneDeep(chartData.series);
    const seriesWithType = cloneSeries.map(item => {
      const { name } = item;
      const normalizedName = StringUtils.toCamelCase(name);
      const itemSetting = get(setting, `options.plotOptions.series.response.${normalizedName}`, {});
      const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
      const result = isTimeStampXAxis ? item.withTimeStamp(chartData.xAxis ?? []) : item;
      Object.assign(result, itemSetting);
      //Hot fix lỗi stack sai trong Area:
      //Context: Khi có legend, response trên sever trả về sẽ bao gồm stack trong prop
      //Error: Stack bị chia làm 4 group thay vì 1 Group
      //Giải phạp tạm thời: xoá prop stack và nếu có stack thì sẽ stack thành 1 Group duy nhất
      //Example:
      ///[
      //     {
      //         "name": "Home Office",
      //         "data": [
      //             89133703.2,
      //             596462670.8,
      //             701273231.5
      //         ],
      //============ERROR HERE============
      //         "stack": "Home Office",
      //==================================
      //     },
      //     {
      //         "name": "Consumer",
      //         "data": [
      //             160794807.8,
      //             1295597383,
      //             1628349620.8
      //         ],
      //==================================
      //         "stack": "Consumer",
      //==================================
      //     },
      //     {
      //         "name": "Corporate",
      //         "data": [
      //             174450763.4,
      //             925259129.4,
      //             1015840954
      //         ],
      //============ERROR HERE============
      //         "stack": "Corporate",
      //==================================
      //     },
      //     {
      //         "name": "",
      //         "data": [
      //             null,
      //             -30764.8,
      //             null
      //         ],
      //============ERROR HERE============
      //         "stack": "",
      //==================================
      //     }
      // ]
      result['stack'] = undefined;
      return result;
    });

    HighchartUtils.addSeries(this.getChart(), seriesWithType);
  }

  protected resizeHighchart(): void {
    Log.debug('resizeHighchart in series', this.id);
    this.getChart()?.reflow();
  }

  private createRenderController(): RenderController<SeriesOneResponse> {
    const pageRenderService = Di.get(PageRenderService);
    const processRenderService = Di.get(RenderProcessService);
    return new RenderController(pageRenderService, processRenderService);
  }

  private updateMetricNumber(options: ChartOptionData) {
    const metrixNumber: string[] | undefined = HighchartUtils.toMetricNumbers(
      options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default ?? MetricNumberMode.Default
    );
    Highcharts.setOptions({
      lang: {
        numericSymbols: metrixNumber
      }
    });
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const textColor = this.setting.options?.plotOptions?.series?.dataLabels?.style?.color ?? '#fff';
    const formattedData = this.numberFormatter.format(point.y ?? 0);
    return `<div style="color: ${textColor}"> ${formattedData}</div>`;
  }

  private tooltipFormatter(point: TooltipFormatterContextObject) {
    const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
    const x = isTimeStampXAxis ? DateTimeFormatter.formatAsDDMMYYYYHms(point.x) : point.x;
    const name = point.series.name;
    const value = this.numberFormatter.format(point.y);
    const color = point.color;
    const textColor = this.setting.options.tooltip?.style?.color ?? '#fff';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? 'Roboto';
    const isComparePercentage = this.setting.options.plotOptions?.series?.compare === 'percent';
    const isCompareValue = this.setting.options.plotOptions?.series?.compare === 'value';
    let displayValue = '';
    if (isComparePercentage) {
      const change = get(point, 'point.change', 0);
      const formattedChange = change > 0 ? `+${this.numberFormatter.format(change)}` : this.numberFormatter.format(change);
      displayValue = `<span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b> (${formattedChange}%)`;
    } else if (isCompareValue) {
      const change = get(point, 'point.change', 0);
      const formattedChange = this.numberFormatter.format(change);
      displayValue = `<span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b> (${formattedChange})`;
    } else {
      displayValue = `<span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b>`;
    }
    return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${x}</span></br>
                ${displayValue}
            </div>`;
  }

  private yAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject<any>) {
    const value = this.numberFormatter.format(axis.value);
    const isComparePercentage = this.setting.options.plotOptions?.series?.compare === 'percent';
    if (isComparePercentage) {
      const positive = axis.value > 0 ? '+' : '';
      return `
        <div>${positive}${value}%</div>
    `;
    } else {
      return `
        <div> ${value}</div>
    `;
    }
  }
}
