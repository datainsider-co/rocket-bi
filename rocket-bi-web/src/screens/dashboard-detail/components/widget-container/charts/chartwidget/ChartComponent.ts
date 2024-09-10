import {
  ChartInfo,
  ChartOption,
  FlattenPivotTableChartOption,
  FlattenTableChartOption,
  PivotTableChartOption,
  QuerySetting,
  QuerySettingClassName,
  TableChartOption,
  ChartOptionClassName,
  WidgetId
} from '@core/common/domain/model';
import { VisualizationResponse } from '@core/common/domain/response';
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import ZoomControlBar from '@/screens/dashboard-detail/components/widget-container/charts/zoom-control-bar/ZoomControlBar.vue';
import { ListUtils, TimeoutUtils } from '@/utils';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { WidgetResizeHandler } from '@/screens/dashboard-detail/intefaces/ResizeWidgetHandler';
import { DIException, ExportType } from '@core/common/domain';
import { DrilldownDataStoreModule } from '@/screens/dashboard-detail/stores';

const DefaultTable = () => import('@chart/table/default-table/DefaultTable');
const PivotTable = () => import('@chart/table/pivot-table/PivotTable');
@Component({
  components: {
    StatusWidget,
    ZoomControlBar,
    EmptyWidget
  }
})
export default class ChartComponent extends Vue implements WidgetResizeHandler {
  static readonly components = new Map<string, string>([
    [ChartOptionClassName.SeriesSetting, 'SeriesChart'],
    [ChartOptionClassName.PieSetting, 'PieChart'],
    [ChartOptionClassName.FunnelSetting, 'FunnelChart'],
    [ChartOptionClassName.PyramidSetting, 'PyramidChart'],
    [ChartOptionClassName.ScatterSetting, 'ScatterChart'],
    [ChartOptionClassName.BubbleSetting, 'BubbleChart'],
    [ChartOptionClassName.HeatMapSetting, 'HeatMapChart'],
    [ChartOptionClassName.ParetoSetting, 'ParetoChart'],
    [ChartOptionClassName.BellCurveSetting, 'BellCurveChart'],
    [ChartOptionClassName.DrilldownSetting, 'DrilldownChart'],
    [ChartOptionClassName.DrilldownPieSetting, 'DrilldownPieChart'],
    [ChartOptionClassName.GaugeSetting, 'GaugeChart'],
    [ChartOptionClassName.TreeMapSetting, 'TreeMapChart'],
    [ChartOptionClassName.NumberSetting, 'KPIWidget'],
    [ChartOptionClassName.WordCloudSetting, 'WordCloudChart'],
    [ChartOptionClassName.HistogramSetting, 'HistogramChart'],
    [ChartOptionClassName.DropdownSetting, 'DropdownFilter'],
    [ChartOptionClassName.StackedSeriesSetting, 'StackingSeriesChart'],
    [ChartOptionClassName.CircularBarSetting, 'StackingSeriesChart'],
    [ChartOptionClassName.TabFilterSetting, 'TabFilter'],
    [ChartOptionClassName.MapSetting, 'MapChart'],
    [ChartOptionClassName.ParliamentSetting, 'ParliamentChart'],
    [ChartOptionClassName.SpiderWebSetting, 'SpiderWebChart'],
    [ChartOptionClassName.BellCurve2Setting, 'BellCurve2Chart'],
    [ChartOptionClassName.SankeySetting, 'SankeyChart'],
    [ChartOptionClassName.SlicerFilterSetting, 'SlicerFilter'],
    // [VizSettingType.DateSelectFilterSetting, 'DateFilter'],
    [ChartOptionClassName.DateSelectFilterSetting, 'DateFilter2'],
    [ChartOptionClassName.InputFilterSetting, 'InputFilter'],
    [ChartOptionClassName.BulletSetting, 'BulletGraph'],
    [ChartOptionClassName.WindRoseSetting, 'StackingSeriesChart'],
    [ChartOptionClassName.LineStockSetting, 'LineStockChart'],
    [ChartOptionClassName.TreeFilterSetting, 'TreeFilter'],
    [ChartOptionClassName.VariablePieSetting, 'VariablepieChart'],
    [ChartOptionClassName.DonutSetting, 'DonutChart']
  ]);

  @Prop({ required: true, type: Object })
  metaData!: ChartInfo;

  @Prop({ required: true })
  response!: VisualizationResponse;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isPreview!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disableSort!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  readonly disablePagination!: boolean;

  @Ref()
  private chart!: BaseWidget;

  private get setting(): ChartOption | undefined {
    return this.metaData?.setting?.getChartOption();
  }

  private get toComponent(): string | undefined {
    if (this.setting) {
      return ChartComponent.components.get(this.setting.className);
    }
    return void 0;
  }

  protected get componentClass(): string {
    switch (this.setting?.className) {
      case ChartOptionClassName.TabFilterSetting:
      case ChartOptionClassName.SlicerFilterSetting:
        return 'filter-widget-container';
      default:
        return 'chart-widget-container';
    }
  }

  private get isTableChart() {
    return (
      this.setting &&
      (TableChartOption.isTableSetting(this.setting) ||
        PivotTableChartOption.isPivotTableSetting(this.setting) ||
        FlattenTableChartOption.isTableSetting(this.setting) ||
        FlattenPivotTableChartOption.isPivotTableSetting(this.setting))
    );
  }

  private get toTableComponent(): any {
    switch (this.metaData.setting.className) {
      case QuerySettingClassName.Table:
      case QuerySettingClassName.GroupedTable:
      case QuerySettingClassName.FlattenPivot:
      case QuerySettingClassName.RawQuery:
        return DefaultTable;
      case QuerySettingClassName.PivotTable:
        return PivotTable;
      default:
        throw new DIException('Unsupported render this table');
    }
  }

  mounted() {
    this.registerEvents();
  }

  registerEvents(): void {
    this.$root.$on(DashboardEvents.ResizeWidget, this.handleResize);
    this.$root.$on(DashboardEvents.Export, this.handleDownloadCSV);
    this.$root.$on(DashboardEvents.CopyToAssistant, this.handleCopyToAssistant);
    this.$root.$on(DashboardEvents.Summarize, this.handleSummarize);
  }

  beforeDestroy() {
    this.unregisterEvents();
  }

  unregisterEvents(): void {
    this.$root.$off(DashboardEvents.ResizeWidget, this.handleResize);
    this.$root.$off(DashboardEvents.Export, this.handleDownloadCSV);
    this.$root.$off(DashboardEvents.CopyToAssistant, this.handleCopyToAssistant);
    this.$root.$off(DashboardEvents.Summarize, this.handleSummarize);
  }

  handleResize(id: WidgetId): void {
    if (this.metaData.id === id) {
      this.resize();
    }
  }

  resize() {
    if (this.chart && this.chart.resize) {
      TimeoutUtils.waitAndExec(null, () => this.chart.resize(), 180);
    }
  }

  handleDownloadCSV(id: WidgetId, type: ExportType) {
    if (this.metaData.id === id) {
      this.chart.export(type);
    }
  }

  private getCurrentQuerySetting(): QuerySetting {
    return ListUtils.getLast(DrilldownDataStoreModule.getQuerySettings(this.metaData.id)) ?? this.metaData.setting;
  }

  handleCopyToAssistant(id: WidgetId) {
    if (this.metaData.id === id) {
      this.chart.copyToAssistant();
    }
  }

  handleSummarize(id: WidgetId) {
    if (this.metaData.id === id) {
      this.chart.summarize();
    }
  }
}
