/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 3:01 PM
 */

import { Component, Ref, Watch } from 'vue-property-decorator';
import { ClassProfiler } from '@/shared/profiler/annotation';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart';
import { ChartOption, DIException, ParliamentChartOption, ParliamentDisplayType, ParliamentQuerySetting, SeriesTwoResponse } from '@core/domain';
import { RenderController } from '@chart/custom/RenderController';
import Highcharts, { Series } from 'highcharts';
import { isNumber, merge } from 'lodash';
import { HighchartUtils, MetricNumberMode } from '@/utils';
import { NumberFormatter, RangeData } from '@core/services';
import { DI } from '@core/modules';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { InvalidDataException } from '@core/domain/Exception/InvalidDataException';
import { Log } from '@core/utils';
import { DataLabelFormatterMode } from '@chart/PieChart';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'ParliamentChart' })
export default class ParliamentChart extends BaseHighChartWidget<SeriesTwoResponse, ParliamentChartOption, ParliamentQuerySetting> {
  private static DISPLAY_AS_CIRCLE_OPTIONS = {
    center: ['50%', '50%'],
    size: '100%',
    startAngle: 0,
    endAngle: 360
  };
  private static DISPLAY_AS_RECTANGLE_OPTIONS = {
    startAngle: null,
    endAngle: null
  };
  private static DISPLAY_AS_PARLIAMENT_OPTIONS = {
    center: ['50%', '65%'],
    size: '100%',
    startAngle: -100,
    endAngle: 100
  };
  @Ref()
  chart: any;

  // todo: fixme return correct default type
  protected renderController: RenderController<SeriesTwoResponse>;
  private numberFormatter!: NumberFormatter;

  constructor() {
    super();
    const manualOptions: Highcharts.Options = this.getDefaultOptions();
    this.options = merge({}, ChartOption.CONFIG, ParliamentChartOption.DEFAULT_SETTING, this.options, manualOptions);
    this.renderController = this.createRenderController();
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options.metricNumbers ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2
    );
  }

  mounted() {
    this.reRenderChart();
  }

  beforeDestroy() {
    this.renderController.dispose();
  }

  @Watch('setting')
  onChartSettingChanged() {
    this.reRenderChart();
  }

  @Watch('data')
  onChartDataChanged() {
    this.reRenderChart();
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  protected buildHighchart() {
    try {
      HighchartUtils.reset(this.getChart());
      this.validateData(this.data, this.setting);
      const series: Series[] = this.load(this.data, this.setting);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignRightClick(series);
      this.assignDrilldownClick();
    } catch (ex) {
      this.handleException(ex);
    }
  }

  protected load(chartData: SeriesTwoResponse, vizSetting: ParliamentChartOption) {
    const displayOptions = this.getDisplayOptions(vizSetting);
    const series = chartData.series.map(series => {
      return {
        ...series,
        ...displayOptions
      };
    });
    return HighchartUtils.addSeries(this.getChart(), series);
  }

  protected buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }

  protected createRenderController(): RenderController<SeriesTwoResponse> {
    const pageRenderService = DI.get(PageRenderService);
    const processRenderService = DI.get(RenderProcessService);
    return new RenderController(pageRenderService, processRenderService);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private getDefaultOptions(): Highcharts.Options {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    return {
      chart: {
        type: 'item'
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
          return that.tooltipFormatter((this as any) as Highcharts.TooltipFormatterContextObject);
        }
      },
      accessibility: {
        point: {
          valueSuffix: '%'
        }
      },

      plotOptions: {
        item: {
          dataLabels: {
            useHTML: true,
            formatter: function() {
              return that.dataLabelsFormatter((this as any) as Highcharts.PointLabelObject);
            }
          }
        },
        series: {
          dataLabels: {
            enabled: true
          }
        }
      }
    };
  }

  private validateData(data: SeriesTwoResponse, setting: ParliamentChartOption) {
    const maxDataPoint: number = setting.getMaxDataPoint();
    for (let index = 0; index < data.series.length; ++index) {
      const series = data.series[index];
      for (let dataIndex = 0; dataIndex < series.data.length; ++dataIndex) {
        const data = series.data[dataIndex];
        const pointValue = data[1];
        if (isNumber(pointValue) && pointValue > maxDataPoint) {
          throw new InvalidDataException(`Parliament can not render quantity point greater ${maxDataPoint}, change in setting`);
        }
      }
    }
  }

  private handleException(ex: any) {
    if (InvalidDataException.isInvalidDataException(ex)) {
      throw ex;
    } else {
      Log.debug('handleException::', ex);
      throw new DIException('Error when display chart. Please try again!');
    }
  }

  private getDisplayOptions(vizSetting: ParliamentChartOption): any {
    switch (vizSetting.getDisplayType()) {
      case ParliamentDisplayType.Circle:
        return ParliamentChart.DISPLAY_AS_CIRCLE_OPTIONS;
      case ParliamentDisplayType.Rectangle:
        return ParliamentChart.DISPLAY_AS_RECTANGLE_OPTIONS;
      default:
        return ParliamentChart.DISPLAY_AS_PARLIAMENT_OPTIONS;
    }
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const dataLabelsMode: DataLabelFormatterMode = this.setting.options?.plotOptions?.item?.dataLabels?.labelFormat ?? DataLabelFormatterMode.NameAndValue;
    const textColor = this.setting.options?.plotOptions?.item?.dataLabels?.style?.color ?? '#fff';
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
    const dataFormatted = Math.round(point.percentage);
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

  private tooltipFormatter(point: Highcharts.TooltipFormatterContextObject): string {
    // Log.debug("Parliament::Tooltip::Point:: ", point);
    const x = point.series.name;
    const name = point.key;
    const value = this.numberFormatter.format(point.y);
    const color = point.color;
    const textColor = this.setting.options.tooltip?.style?.color ?? '#fff';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${x}</span></br>
                <span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b>
            </div>`;
  }
}
