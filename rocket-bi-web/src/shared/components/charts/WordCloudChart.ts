import { Component, Ref, Watch } from 'vue-property-decorator';
import Highcharts, { Series, TooltipFormatterContextObject } from 'highcharts';
import { ChartOption, WordCloudChartOption, WordCloudQuerySetting } from '@core/common/domain/model';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { DIException } from '@core/common/domain/exception';
import { WordCloudResponse } from '@core/common/domain/response';
import { DomUtils, HighchartUtils, MetricNumberMode } from '@/utils';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'WordCloudChart' })
export default class WordCloudChart extends BaseHighChartWidget<WordCloudResponse, WordCloudChartOption, WordCloudQuerySetting> {
  @Ref()
  chart: any;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const tooltipFormatter = this.tooltipFormatter;
    // const showContextMenu = this.showContextMenu;
    const manualOptions: Highcharts.Options = {
      chart: {
        colors: this.setting.colors,
        events: {
          // load: function() {
          //   const chart = this as any;
          //   // DomUtils.bind('chart', chart);
          //   Log.debug('chart::length', chart.series.length)
          //   if (ListUtils.isNotEmpty(chart.series)) {
          //     chart.series[0].points.forEach((point: any) => {
          //       point.graphic.on('contextmenu', function(event: any) {
          //         const data: MouseEventData<Point> = new MouseEventData<Point>(event, point);
          //         showContextMenu(data);
          //       });
          //     });
          //   }
          // },
          addSeries: function(event) {
            const chart = this as any;
            DomUtils.bind('chart', chart);
            Log.debug('chart::length', chart.series.length, chart.series);
            // event.options
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
    } as Highcharts.Options;
    this.updateOptions(manualOptions);
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
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
    this.options = merge({}, ChartOption.CONFIG, WordCloudChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart.getChart();
  }

  protected buildHighchart() {
    try {
      HighchartUtils.reset(this.getChart());
      const series: Series[] = this.load(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignRightClick(series);
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`WordCloudChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: WordCloudResponse) {
    return HighchartUtils.addSeries(this.getChart(), [chartData]);
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private tooltipFormatter(contextObject: TooltipFormatterContextObject) {
    const formattedData = this.numberFormatter.format(contextObject.point.options.weight ?? 0);
    const fieldProperty = contextObject.key;
    //@ts-ignore
    const textColor = this.setting?.options?.tooltip?.style?.color ?? '#fff';
    //@ts-ignore
    const fontFamily = this.setting?.options?.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="font-family: ${fontFamily}; color: ${textColor}; text-align: left">
                ${fieldProperty}: <b>${formattedData}</b><br/>
            </div>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }
}
