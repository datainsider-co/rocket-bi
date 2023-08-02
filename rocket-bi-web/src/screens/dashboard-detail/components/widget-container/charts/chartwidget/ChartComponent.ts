import {
  ChartInfo,
  ChartOption,
  FlattenPivotTableChartOption,
  FlattenTableChartOption,
  PivotTableChartOption,
  QuerySetting,
  QuerySettingType,
  TableChartOption,
  VizSettingType,
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
    [VizSettingType.SeriesSetting, 'SeriesChart'],
    [VizSettingType.PieSetting, 'PieChart'],
    [VizSettingType.FunnelSetting, 'FunnelChart'],
    [VizSettingType.PyramidSetting, 'PyramidChart'],
    [VizSettingType.ScatterSetting, 'ScatterChart'],
    [VizSettingType.BubbleSetting, 'BubbleChart'],
    [VizSettingType.HeatMapSetting, 'HeatMapChart'],
    [VizSettingType.ParetoSetting, 'ParetoChart'],
    [VizSettingType.BellCurveSetting, 'BellCurveChart'],
    [VizSettingType.DrilldownSetting, 'DrilldownChart'],
    [VizSettingType.DrilldownPieSetting, 'DrilldownPieChart'],
    [VizSettingType.GaugeSetting, 'GaugeChart'],
    [VizSettingType.TreeMapSetting, 'TreeMapChart'],
    [VizSettingType.NumberSetting, 'KPIWidget'],
    [VizSettingType.WordCloudSetting, 'WordCloudChart'],
    [VizSettingType.HistogramSetting, 'HistogramChart'],
    [VizSettingType.DropdownSetting, 'DropdownFilter'],
    [VizSettingType.StackedSeriesSetting, 'StackingSeriesChart'],
    [VizSettingType.CircularBarSetting, 'StackingSeriesChart'],
    [VizSettingType.TabFilterSetting, 'TabFilter'],
    [VizSettingType.MapSetting, 'MapChart'],
    [VizSettingType.ParliamentSetting, 'ParliamentChart'],
    [VizSettingType.SpiderWebSetting, 'SpiderWebChart'],
    [VizSettingType.BellCurve2Setting, 'BellCurve2Chart'],
    [VizSettingType.SankeySetting, 'SankeyChart'],
    [VizSettingType.SlicerFilterSetting, 'SlicerFilter'],
    // [VizSettingType.DateSelectFilterSetting, 'DateFilter'],
    [VizSettingType.DateSelectFilterSetting, 'DateFilter2'],
    [VizSettingType.InputFilterSetting, 'InputFilter'],
    [VizSettingType.BulletSetting, 'BulletGraph'],
    [VizSettingType.WindRoseSetting, 'StackingSeriesChart'],
    [VizSettingType.LineStockSetting, 'LineStockChart'],
    [VizSettingType.TabMeasurementSetting, 'MeasureControl'],
    [VizSettingType.TreeFilterSetting, 'TreeFilter'],
    [VizSettingType.VariablepieSetting, 'VariablepieChart'],
    [VizSettingType.DonutSetting, 'DonutChart']
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

  private get componentClass(): string {
    switch (this.setting?.className) {
      case VizSettingType.TabFilterSetting:
      case VizSettingType.SlicerFilterSetting:
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
      case QuerySettingType.Table:
      case QuerySettingType.GroupedTable:
      case QuerySettingType.FlattenPivot:
      case QuerySettingType.RawQuery:
        return DefaultTable;
      case QuerySettingType.PivotTable:
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
  }

  beforeDestroy() {
    this.unregisterEvents();
  }

  unregisterEvents(): void {
    this.$root.$off(DashboardEvents.ResizeWidget, this.handleResize);
    this.$root.$off(DashboardEvents.Export, this.handleDownloadCSV);
  }

  handleResize(id: WidgetId): void {
    if (this.metaData.id === id) {
      if (this.chart && this.chart.resize) TimeoutUtils.waitAndExec(null, () => this.chart.resize(), 250);
    }
  }

  handleDownloadCSV(id: WidgetId, type: ExportType) {
    if (this.metaData.id === id) {
      this.chart.export(type);
    }
  }

  updateChart(chartInfo: ChartInfo) {
    this.chart.updateChart(chartInfo);
  }

  private getCurrentQuerySetting(): QuerySetting {
    return ListUtils.getLast(DrilldownDataStoreModule.getQuerySettings(this.metaData.id)) ?? this.metaData.setting;
  }
}
