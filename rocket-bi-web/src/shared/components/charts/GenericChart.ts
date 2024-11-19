import Highcharts, { TooltipFormatterContextObject } from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { ChartOption, ChartOptionData, EqualValue, GenericChartQuerySetting, MinMaxCondition, SeriesChartOption, TextSetting } from '@core/common/domain/model';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { MethodProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { ChartUtils, HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { GenericChartResponse, SeriesOneResponse } from '@core/common/domain/response';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';
import { ChartType } from '@/shared';

@Component({
  props: PropsBaseChart
})
export default class GenericChart extends BaseHighChartWidget<GenericChartResponse, ChartOption, GenericChartQuerySetting> {
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
              return yAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject);
            }
          }
        },
        {
          labels: {
            formatter: function() {
              return dualYAxisFormatter((this as any) as Highcharts.AxisLabelsFormatterContextObject);
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
      this.load(this.data);
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

  protected buildAxis(chartData: GenericChartResponse) {
    //Nothing to do
    switch (this.chartInfo.extraData?.currentChartType) {
      case ChartType.ColumnRange:
        return this.buildColumnRangeAxis(chartData);
      default:
      //Nothing to do
    }
  }

  private buildColumnRangeAxis(data: GenericChartResponse) {
    const options: any = {};
    options['xAxis'] = [
      {
        categories: data.records.map(item => item[0])
      }
    ];
    HighchartUtils.updateChart(this.getChart(), options);
  }

  protected displayForecastData(forecastData: GenericChartResponse) {
    HighchartUtils.reset(this.getChart());
    this.load(forecastData);
    this.buildAxis(forecastData);
    HighchartUtils.drawChart(this.getChart());
  }

  protected load(chartData: GenericChartResponse) {
    HighchartUtils.addSeries(this.getChart(), [
      {
        name: ListUtils.getHead(this.query.columns)?.name ?? '',
        keys: this.getSeriesKeys(),
        data: chartData.records
      }
    ]);
  }

  private getSeriesKeys() {
    switch (this.chartInfo.extraData?.currentChartType) {
      case ChartType.ColumnRange:
      case ChartType.AreaRange:
        return ['name', 'low', 'high'];
    }
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
    Log.debug('tooltipFormatter::', point);
    switch (this.chartInfo.extraData?.currentChartType) {
      case ChartType.ColumnRange:
        return this.tooltipColumnRangeFormatter(point);
      default: {
        const { x, series, y } = point;
        const name = series.name;
        const value = this.numberFormatter.format(y as number);
        const color = point.color;
        const textColor = this.setting.options.tooltip?.style?.color ?? 'var(--text-color)';
        const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? ChartOption.getSecondaryFontFamily();
        return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${x}</span></br>
                <span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b>
            </div>`;
      }
    }
  }

  private tooltipColumnRangeFormatter(point: TooltipFormatterContextObject) {
    const { name, low, high } = point.point;
    const xAxisName = ListUtils.getHead(this.query.columns)?.name ?? '';
    const color = point.color;
    const textColor = this.setting.options.tooltip?.style?.color ?? 'var(--text-color)';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? ChartOption.getSecondaryFontFamily();

    const formattedHigh = high !== undefined ? this.numberFormatter.format(high) : 0;
    const formattedLow = low !== undefined ? this.numberFormatter.format(low) : 0;
    return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${name}</span></br>
                <span style="color:${color}; padding-right: 5px;">●</span>${xAxisName}: <b>${formattedLow} - ${formattedHigh}</b>
            </div>`;
  }

  private yAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject) {
    const yAxisSetting = this.setting.options.yAxis;
    const value = this.numberFormatter.format(axis.value as number);
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

  private dualYAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject) {
    const yAxisSetting = this.setting.options.yAxis;
    const value = this.numberFormatter.format(axis.value as number);
    if (yAxisSetting && yAxisSetting[1]) {
      return this.customAxisLabel(value, yAxisSetting[1].prefix, yAxisSetting[1].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }

  private xAxisFormatter(axis: Highcharts.AxisLabelsFormatterContextObject) {
    const xAxisSetting = this.setting.options.xAxis;
    const value = axis.value;
    if (xAxisSetting && xAxisSetting[0]) {
      return this.customAxisLabel(value as string, xAxisSetting[0].prefix, xAxisSetting[0].postfix);
    } else {
      return `<div>${value}</div>`;
    }
  }
}
