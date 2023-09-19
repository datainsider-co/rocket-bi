import { Component, Prop, Ref, Watch } from 'vue-property-decorator';
import { DIException } from '@core/common/domain/exception';
import { ClassProfiler, MethodProfiler } from '@/shared/profiler/Annotation';
import { BaseChartWidget, MouseEventData, PropsBaseChart } from '@chart/BaseChart';
import { SeriesOneResponse } from '@core/common/domain/response';
import { ChartInfo, CompareStyle, NumberChartOption, NumberOptionData, NumberQuerySetting, TrendIcon } from '@core/common/domain/model';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import './NumberWidget.scss';
import { NumberFormatter, RangeData } from '@core/common/services/Formatter';
import { HighchartUtils, MetricNumberMode, StringUtils } from '@/utils';
import { Log, NumberUtils, UrlUtils } from '@core/utils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { ComparisonUtils } from '@core/utils/ComparisonUtils';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';

import { CompareMode, ExportType } from '@core/common/domain';
import { NumberRenderer } from '@chart/widget-renderer/number-render/NumberRenderer';
import { ComparisonNumberRenderer, WidgetRenderer } from '@chart/widget-renderer';
import { KPIRenderer } from '@chart/widget-renderer/number-render/KPIRenderer';
import { CalendarData } from '@/shared/models';
import { DashboardControllerModule, QuerySettingModule } from '@/screens/dashboard-detail/stores';
import { PopupUtils } from '@/utils/PopupUtils';
import Highcharts from 'highcharts/highcharts';

@Component({ components: { ChartHolder }, props: PropsBaseChart })
@ClassProfiler({ prefix: 'KPIWidget' })
export default class NumberWidget extends BaseChartWidget<SeriesOneResponse, NumberChartOption, NumberQuerySetting> {
  private numberFormatter!: NumberFormatter;

  @Prop({ required: false, type: Boolean, default: false })
  showEditComponent!: boolean;

  @Ref()
  private readonly trendLineChartHolder!: ChartHolder;

  protected renderer: WidgetRenderer<BaseWidget> = new NumberRenderer();

  get numberWidgetStyle() {
    return {
      '--background-color': this.backgroundColor,
      // margin: this.isPreview ? '8px 0' : ''
      '--compare-bottom-position': this.isPreview ? '8px' : '8px',
      '--up-trend-color': this.setting.options.comparison?.uptrendIconColor || '#4dcf36',
      '--down-trend-color': this.setting.options.comparison?.downtrendIconColor || '#ea6b6b'
    };
  }

  @MethodProfiler({ prefix: 'NumberWidget' })
  get tooltipValue() {
    if (Number.isFinite(this.value)) {
      const formattedData = this.numberFormatter.format(this.value);
      return `${this.prefix}${formattedData}${this.postfix}`;
    } else {
      return `${this.prefix}--${this.postfix}`;
    }
  }

  @MethodProfiler({ prefix: 'NumberWidget' })
  get formattedValue() {
    if (Number.isFinite(this.value)) {
      return this.numberFormatter.format(this.value);
    } else {
      return '--';
    }
  }

  get tooltipConfig(): any {
    const placement = this.setting.options.align ?? 'center';
    return {
      placement: placement
    };
  }

  get tooltipStyle(): any {
    const tooltip = this.setting.options.tooltip ?? {};
    return {
      background: tooltip.backgroundColor,
      color: tooltip.valueColor,
      'font-family': tooltip.fontFamily
    };
  }

  // Title Style
  get titleStyle() {
    const title = this.setting.options.title ?? { enabled: true };
    return {
      color: title.style?.color,
      'font-size': title.style?.fontSize ?? '20px',
      'font-family': title.style?.fontFamily,
      'font-weight': title.style?.fontWeight,
      'line-height': title.style?.lineHeight,
      'text-decoration': title.style?.textDecoration,
      'font-style': title.style?.fontStyle,
      'text-align': title.align ?? 'left',
      'white-space': 'nowrap',
      'text-overflow': 'ellipsis',
      overflow: 'hidden'
    };
  }

  // Subtitle Style
  get subtitleStyle() {
    const title = this.setting.options.subtitle ?? { enabled: true };
    return {
      color: title.style?.color,
      'font-size': title.style?.fontSize ?? '20px',
      'font-family': title.style?.fontFamily,
      'font-weight': title.style?.fontWeight,
      'line-height': title.style?.lineHeight,
      'text-decoration': title.style?.textDecoration,
      'font-style': title.style?.fontStyle,
      'text-align': title.align ?? 'left',
      'white-space': 'nowrap',
      'text-overflow': 'ellipsis',
      overflow: 'hidden'
    };
  }

  get headerProps() {
    const currentSetting: NumberOptionData = this.setting?.options ?? {};
    return {
      enableTitle: currentSetting.title?.enabled ?? true,
      enableSubtitle: (currentSetting.subtitle?.enabled ?? true) && StringUtils.isNotEmpty(this.subTitle),
      title: this.title,
      subTitle: this.subTitle,
      titleAlign: currentSetting.title?.align ?? 'center',
      subtitleAlign: currentSetting.subtitle?.align ?? 'center',
      titleStyle: this.titleStyle,
      subtitleStyle: this.subtitleStyle
    };
  }

  get enableComparisonTitle(): boolean {
    return ComparisonUtils.isDataRangeOn(this.setting.options);
  }

  //Value

  get valueStyle() {
    const style = this.setting.options.style ?? {};
    return {
      'font-size': style.fontSize ?? '36px',
      'font-family': style.fontFamily,
      'font-weight': style?.fontWeight,
      'line-height': style?.lineHeight,
      'text-align': this.setting.options.align ?? 'left',
      color: style.color
    };
  }

  //
  get valueBarStyle() {
    const align = this.setting.options.align ?? 'center';
    return {
      'text-align': align
    };
  }

  //Prefix

  get prefixStyle() {
    const style = this.setting.options.prefix?.style ?? {};
    return {
      'font-size': style.fontSize ?? '36px',
      'font-family': style.fontFamily,
      color: style.color
    };
  }

  //Postfix

  get postfixStyle() {
    const style = this.setting.options.postfix?.style ?? {};
    return {
      'font-size': style.fontSize ?? '36px',
      'font-family': style.fontFamily,
      color: style.color
    };
  }

  get hasCompareValue() {
    return Number.isFinite(this.compareValue) && this.compareValue !== 0;
  }

  get compareValueAsText() {
    if (this.hasCompareValue) {
      return this.numberFormatter.format(this.compareValue);
    } else {
      return '--';
    }
  }

  get isDecrease() {
    return this.comparePercentage < 0;
  }

  get trendIcon(): string {
    if (this.isDecrease) {
      return this.setting.options.comparison?.downtrendIcon ?? TrendIcon.Down;
    } else {
      return this.setting.options.comparison?.uptrendIcon ?? TrendIcon.Up;
    }
  }

  get compareValue(): number {
    if (this.data.compareResponses) {
      const response = this.data.compareResponses.get(CompareMode.RawValues);
      if (response) {
        return NumberUtils.toNumber(response.series[0].data[0]);
      }
    }
    return NaN;
  }

  get comparePercentage(): number {
    if (this.hasCompareValue) {
      return NumberUtils.calculatedPercentage(this.value, this.compareValue);
    } else {
      return NaN;
    }
  }

  get prefix(): string {
    if (this.setting && this.setting.options) {
      return this.setting.options.prefix?.text || '';
    }
    return '';
  }

  get postfix(): string {
    if (this.setting && this.setting.options) {
      return this.setting.options.postfix?.text || '';
    }
    return '';
  }

  private get value(): number {
    return this.data.series[0].data[0];
  }

  created() {
    if (this.data.series.length !== 1 || this.data.series[0].data.length !== 1) {
      throw new DIException('Number Widget only support table with only one Aggregation config');
    } else {
      this.renderer = this.getRenderer();
    }
  }

  mounted() {
    this.$nextTick(() => {
      this.resize();
    });
  }

  resize(): void {
    this.handleResizeNumberWidget();
  }

  @Watch('setting.options.plotOptions.kpi.dataLabels.displayUnit')
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

  private handleResizeNumberWidget() {
    if (this.canRenderTrendLine && this.trendLineChartInfo) {
      this.$root.$emit(DashboardEvents.ResizeWidget, this.trendLineChartInfo.id);
    }
  }

  @Watch('setting.options.comparison', { deep: true })
  @Watch('setting.options.dataRange', { deep: true })
  @Watch('setting.options.trendLine', { deep: true })
  private onComparisonChanged() {
    this.renderer = this.getRenderer();
  }

  constructor() {
    super();
    const decimalPoint = this.setting.options.decimalPoint;
    const thousandSep = this.setting.options.thousandSep;
    const displayUnit = this.setting.options.plotOptions?.kpi?.dataLabels?.displayUnit ?? MetricNumberMode.Default;
    this.numberFormatter = this.buildFormatterByMetricNumber(displayUnit, this.setting.options.precision ?? 2, decimalPoint, thousandSep);
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandPoint?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandPoint);
  }

  handleShowContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const mouseEventDataAString = new MouseEventData<string>(event, this.value?.toString());
    this.$root.$emit(DashboardEvents.ClickDataPoint, this.id, mouseEventDataAString);
  }

  get comparisonDisplayAs(): CompareStyle {
    return this.setting.options.comparison?.compareStyle || 'default';
  }

  get canRenderTrendLine(): boolean {
    return ComparisonUtils.isTrendLineOn(this.setting.options);
  }

  get trendLineChartInfo(): ChartInfo | null {
    if (this.canRenderTrendLine) {
      const trendLineQuerySetting = ComparisonUtils.buildTrendLineQuerySetting(this.setting.options, [this.query.value], this.isDecrease);
      return ChartInfo.fromQuerySetting(trendLineQuerySetting);
    } else {
      return null;
    }
  }

  private getRenderer(): WidgetRenderer<NumberWidget> {
    // if (this.canRenderTrendLine) {
    //   return new KPIRenderer();
    // }
    // if (ComparisonUtils.isDataRangeOn(this.setting.options) || ComparisonUtils.isComparisonOn(this.setting.options)) {
    //   return new ComparisonNumberRenderer();
    // }
    return new NumberRenderer();
  }

  onDateRangeChanged(calendarData: CalendarData) {
    this.query.setDateRange(calendarData.chosenDateRange, calendarData.filterMode);
    Log.debug('KPI::set', this.query.getChartOption()?.options.dataRange);
    QuerySettingModule.setQuerySetting({
      id: +this.id,
      query: this.query
    });
    DashboardControllerModule.renderChart({ id: +this.id });
  }

  async export(type: ExportType): Promise<void> {
    await DashboardControllerModule.handleExport({ widgetId: this.id as number, type: type });
  }
}
