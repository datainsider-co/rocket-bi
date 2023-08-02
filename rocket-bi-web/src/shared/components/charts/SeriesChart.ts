import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { ChartOption, ChartOptionData, EqualValue, MinMaxCondition, SeriesChartOption, SeriesQuerySetting, TextSetting } from '@core/common/domain/model';
import { cloneDeep, get, merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { MethodProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { ChartUtils, DateTimeFormatter, HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { SeriesOneResponse } from '@core/common/domain/response';
import { CompareMode } from '@core/common/domain/request/query/CompareMode';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';
import { ChartType } from '@/shared';

@Component({
  props: PropsBaseChart
})
export default class SeriesChart extends BaseHighChartWidget<SeriesOneResponse, SeriesChartOption, SeriesQuerySetting> {
  @Ref()
  chart: any;

  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const tooltipFormatter = this.tooltipFormatter;
    const yAxisFormatter = this.yAxisFormatter;
    const dualYAxisFormatter = this.dualYAxisFormatter;
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
              return dualYAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject<any>);
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
      this.setting.options.precision ?? 2,
      this.setting.options.decimalPoint,
      this.setting.options.thousandSep
    );
    this.updateOptions(manualOptions);
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
    this.options = merge({}, ChartOption.CONFIG, SeriesChartOption.DEFAULT_SETTING, this.options, this.setting.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart?.getChart();
  }

  @MethodProfiler({ name: 'SeriesChart.buildHighchart' })
  protected buildHighchart(): void {
    try {
      this.updateMetricNumber(this.setting.options);
      HighchartUtils.reset(this.getChart());
      // this.buildDualAxis(this.data, this.setting.options);
      if (this.data.haveComparison()) {
        this.loadWithCompareResponse(this.data, this.setting);
      } else {
        this.load(this.data, this.setting);
      }
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.buildAxis(this.data);
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

  private getConditionValue(equalValue?: EqualValue): number | undefined {
    return equalValue?.enabled ? equalValue?.value : undefined;
  }

  protected buildAxis(chartData: SeriesOneResponse) {
    const options: any = {};
    const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
    Log.debug('buildAxis::isTimeStampXAxis', this.query.xAxis.function.scalarFunction?.className);
    const yAxisCondition = get(this.setting, 'options.yAxis[0].condition');
    const dualYAxisCondition = get(this.setting, 'options.yAxis[1].condition');
    const xAxisFormatter = this.xAxisFormatter;
    if (isTimeStampXAxis) {
      options['xAxis'] = {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%Y-%m-%d'
        }
      };
    } else if (ListUtils.isNotEmpty(chartData.xAxis)) {
      options['xAxis'] = [
        {
          type: 'category',
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
          categories: chartData.yAxis,
          min: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.min) : undefined,
          max: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.max) : undefined
        },
        {
          min: dualYAxisCondition?.enabled ? this.getConditionValue(dualYAxisCondition.min) : undefined,
          max: dualYAxisCondition?.enabled ? this.getConditionValue(dualYAxisCondition.max) : undefined
        }
      ];
    } else {
      options['yAxis'] = [
        {
          min: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.min) : undefined,
          max: yAxisCondition?.enabled ? this.getConditionValue(yAxisCondition.max) : undefined
        },
        {
          min: dualYAxisCondition?.enabled ? this.getConditionValue(dualYAxisCondition.min) : undefined,
          max: dualYAxisCondition?.enabled ? this.getConditionValue(dualYAxisCondition.max) : undefined
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
    Log.debug('buildAxis:: options', options);
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected loadWithCompareResponse(chartData: SeriesOneResponse, setting: SeriesChartOption): void {
    const compareResponse = chartData.compareResponses?.get(CompareMode.RawValues);
    const series: Record<string, any>[] = [];
    compareResponse?.series.forEach((value, index) => {
      const id = value.name;
      chartData.series[index].id = id;
      value.linkedTo = id;
      value.pointPlacement = -0.2;
      value.color = setting.options.comparisonColor;
      value.yAxis = chartData.series[index].yAxis;
      series.push(value, chartData.series[index]);
    });
    HighchartUtils.addSeries(this.getChart(), series);
  }

  protected load(chartData: SeriesOneResponse, setting: SeriesChartOption) {
    const { seriesTypesByLabelMap } = setting;
    const cloneSeries = cloneDeep(chartData.series);
    const seriesWithType = cloneSeries
      // .sort((legend, nextLegend) => StringUtils.compare(legend.name, nextLegend.name))
      .map(item => {
        const { name } = item;
        const normalizedName = StringUtils.toCamelCase(name);
        const type = seriesTypesByLabelMap.get(normalizedName) ?? this.setting?.options?.chart?.type ?? 'line';
        const itemSetting = get(setting, `options.plotOptions.series.response.${normalizedName}`, {});
        const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
        const result = isTimeStampXAxis ? item.withTimeStamp(chartData.xAxis ?? []) : item;
        Object.assign(result, { type: type }, itemSetting);
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
        // Update Marker nếu đang chart type là Line và data chỉ có 1 value
        if (type === ChartType.Line && item.data.length === 1) {
          result['marker'] = { enabled: true };
        }
        return result;
      });
    Log.debug('SeriesChart::load::', seriesWithType);
    HighchartUtils.addSeries(this.getChart(), seriesWithType);
  }

  protected resizeHighchart(): void {
    Log.debug('resizeHighchart in series', this.id);
    this.getChart()?.reflow();
  }
  private setSeriesToPrimaryAxis(chartData: SeriesOneResponse) {
    chartData.series.forEach(series => (series.yAxis = 0));
  }

  private deleteDualAxis() {
    this.getChart()
      ?.get('dual-axis')
      ?.remove();
  }

  private buildDualAxis(chartData: SeriesOneResponse, options: any) {
    // if (options?.dualAxis != undefined) {
    //   const hasDualAxis = options.dualAxis != -1;
    //   if (hasDualAxis) {
    //     chartData.series[options.dualAxis].yAxis = 1;
    //     options.yAxis[1].title = {
    //       text: chartData.series[options.dualAxis].name
    //     };
    //   } else {
    //     const existDualAxis = this.getChart()?.yAxis?.length == 2;
    //     if (existDualAxis) {
    //       this.setSeriesToPrimaryAxis(chartData);
    //       this.deleteDualAxis();
    //     }
    //   }
    // }
    const oneSeries = ListUtils.hasOnlyOneItem(chartData.series);
    const settingHaveAxis = this.setting.options.yAxis?.length == 2;
    const existDualAxis = this.getChart()?.get('dual-axis') != undefined;
    if (settingHaveAxis && !existDualAxis) {
      // @ts-ignore
      this.getChart()?.addAxis(this.setting.options.yAxis[1] as any, false, false);
    } else if (!settingHaveAxis || oneSeries) {
      Log.debug('delete axis');
      this.setSeriesToPrimaryAxis(chartData);
      this.deleteDualAxis();
    }
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

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private isShowLabel(point: Highcharts.PointLabelObject, condition: MinMaxCondition | undefined | null): boolean {
    return ChartUtils.isShowValue(point.y!, condition);
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const isShow = this.isShowLabel(point, this.setting.options?.plotOptions?.series?.dataLabels?.condition); //point
    if (isShow) {
      const textColor = this.setting.options?.plotOptions?.series?.dataLabels?.style?.color ?? '#fff';
      const formattedData = this.numberFormatter.format(point.y ?? 0);
      return `<div style="color: ${textColor}"> ${formattedData}</div>`;
    } else {
      return '';
    }
  }

  private tooltipFormatter(point: TooltipFormatterContextObject) {
    const isTimeStampXAxis = ChartUtils.isTimeStampType(this.query.xAxis.function.scalarFunction?.className ?? '');
    const x = isTimeStampXAxis ? DateTimeFormatter.formatAsDDMMYYYYHms(point.x) : point.x;
    const name = point.series.name;
    const value = this.numberFormatter.format(point.y);
    const color = point.color;
    const textColor = this.setting.options.tooltip?.style?.color ?? 'var(--text-color)';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${x}</span></br>
                <span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b>
            </div>`;
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

  private dualYAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject<any>) {
    const yAxisSetting = this.setting.options.yAxis;
    const value = this.numberFormatter.format(axis.value);
    if (yAxisSetting && yAxisSetting[1]) {
      return this.customAxisLabel(value, yAxisSetting[1].prefix, yAxisSetting[1].postfix);
    } else {
      return `<div>${value}</div>`;
    }
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
