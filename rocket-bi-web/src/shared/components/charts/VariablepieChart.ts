import Highcharts, { GradientColorObject, PatternObject, Point } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import {
  ChartOption,
  ChartOptionData,
  GenericChartQuerySetting,
  ValueControlType,
  VariablepieChartOption,
  VariablepieQuerySetting
} from '@core/common/domain/model';
import { get, merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { GenericChartResponse, MapItem } from '@core/common/domain/response';
import { HighchartUtils, MetricNumberMode } from '@/utils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { JsonUtils, Log } from '@core/utils';
import { CrossFilterData } from '@/screens/dashboard-detail/stores';
import { DataLabelFormatterMode } from '@chart/PieChart';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'VariablepieChart' })
export default class VariablepieChart extends BaseHighChartWidget<GenericChartResponse, VariablepieChartOption, VariablepieQuerySetting> {
  @Ref()
  chart: any;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const selectItem = this.handleSelectItem;
    const drilldownListener = this.createRightClickAsOptions('name');
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const piePlotOptions = JsonUtils.mergeDeep(drilldownListener, {
      allowPointSelect: true,
      cursor: 'pointer',
      point: {
        events: {
          click: function() {
            const point = (this as any) as Point;
            selectItem(point.name, point.selected);
          }
        }
      }
    });

    const manualOptions: Highcharts.Options = {
      chart: {
        type: 'variablepie'
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
    this.options = merge({}, ChartOption.CONFIG, VariablepieChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  handleSelectItem(value: string, isSelected: boolean) {
    Log.debug('handleSelectSeriesItem::', value);
    if (this.setting.options.isCrossFilter) {
      const valueMap: Map<ValueControlType, string[]> | undefined = this.toValueMap(value, isSelected);
      this.applyDirectCrossFilter(valueMap);
    }
  }

  private toValueMap(value: string, isSelected: boolean): Map<ValueControlType, string[]> | undefined {
    if (isSelected) {
      return new Map<ValueControlType, string[]>([[ValueControlType.SelectedValue, [value]]]);
    } else {
      return void 0;
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
        Log.error(`HighchartsVariablepieChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: GenericChartResponse) {
    const series: any[] = [
      {
        name: this.query.columns[0].name,
        keys: ['name', 'y', 'z'],
        data: chartData.records
      }
    ];
    HighchartUtils.addSeries(this.getChart(), series);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private renderTooltipName(point: Highcharts.TooltipFormatterContextObject) {
    const color: string | GradientColorObject | PatternObject | undefined = point.color;
    const pointName: string = get(point, 'key', '').toString();
    return `<b><span style="color:${color}; margin-right: 5px;">●</span>${pointName}</b>`;
  }

  private renderToolTipValue(point: Highcharts.TooltipFormatterContextObject) {
    const valueName = this.query.columns[1].name ?? '';
    const value = this.numberFormatter.format(point.point?.y ?? 0);
    return `${valueName}: <b>${value}</b>`;
  }

  private renderToolTipWeight(point: Highcharts.TooltipFormatterContextObject) {
    Log.debug('renderToolTipWeight::', this.currentQuery.weight);
    if (this.query.columns[2]) {
      const valueName = this.query.columns[2].name ?? '';
      const value: any = get(point, 'point.z', 0);
      const formattedValue = this.numberFormatter.format(value);
      return `${valueName}: <b>${formattedValue}</b>`;
    }
    return '';
  }

  private tooltipFormatter(point: Highcharts.TooltipFormatterContextObject): string {
    Log.debug('tooltipFormatter::', this.currentQuery);
    const textColor = this.setting.options.tooltip?.style?.color ?? '#fff';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? ChartOption.getSecondaryFontFamily();
    const name = this.renderTooltipName(point);
    const value = this.renderToolTipValue(point);
    const weight = this.renderToolTipWeight(point);
    return `
    <div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
      ${name}
      </br>${value}
      </br>${weight}
    </div>
    `;
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
    const dataFormatted = this.numberFormatter.format(point.percentage);
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
