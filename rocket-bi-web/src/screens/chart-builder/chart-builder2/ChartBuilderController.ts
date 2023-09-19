/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 5:16 PM
 */

import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { DataManager } from '@core/common/services';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { BuilderMode, ConditionData, FunctionData, Status, VerticalScrollConfigs, VisualizationItemData } from '@/shared';
import BuilderComponents from '@/shared/components/builder';
import DatabaseListing from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.vue';
import DatabaseListingController from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.ts';
import VizPanel from '@/screens/chart-builder/viz-panel/VizPanel.vue';
import {
  ChartControlField,
  ChartInfo,
  ChartInfoType,
  ChartOption,
  DatabaseInfo,
  MapQuerySetting,
  QuerySetting,
  WidgetCommonData,
  WidgetExtraData,
  WidgetId
} from '@core/common/domain/model';
import { DIException } from '@core/common/domain/exception';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { Log, WidgetUtils } from '@core/utils';
import VizSettingModal from '@/screens/chart-builder/setting-modal/ChartSettingModal.vue';
import MatchingLocationModal from '@/screens/chart-builder/viz-panel/MatchingLocationModal.vue';
import { ChartDataModule, DashboardModule } from '@/screens/dashboard-detail/stores';
import { PopupUtils } from '@/utils/PopupUtils';
import Settings from '@/shared/settings/common/install';
import ConfigBuilder from '@/screens/chart-builder/config-builder/ConfigBuilder.vue';
import ConfigBuilderController from '@/screens/chart-builder/config-builder/ConfigBuilder';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { cloneDeep } from 'lodash';
import { ListUtils } from '@/utils';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { TChartBuilderOptions } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderModal.vue';
import { ChartBuilderConfig, DefaultChartBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { SlideXLeftTransition } from 'vue2-transitions';
import DefaultSetting from '@/shared/settings/common/DefaultSetting.vue';

Vue.use(BuilderComponents);
Vue.use(Settings);
@Component({
  components: {
    DatabaseListing,
    ConfigBuilder,
    VizPanel,
    VizSettingModal,
    MatchingLocationModal,
    SlideXLeftTransition,
    DefaultSetting
  }
})
export default class ChartBuilderController extends Vue {
  private readonly PREVIEW_CHART_ID = -1;
  private readonly scrollOptions = VerticalScrollConfigs;
  private isDragging = false;
  private draggingType: ChartInfoType | null = null;
  private databaseStatus = Status.Loading;
  private databaseErrorMsg = '';
  private config: ChartBuilderConfig = DefaultChartBuilderConfig;
  private isSettingConfig = true;

  @Prop({ required: false, type: String, default: BuilderMode.Create })
  private readonly builderMode!: BuilderMode;

  @Prop({ required: true, type: Array })
  private readonly visualizationItems!: VisualizationItemData[];

  private currentChartInfo: ChartInfo | null = null;
  // todo: Chặn việc Watch làm thay đổi setting khi đang init
  private isPreventChangeQuery = false;

  @Ref()
  private readonly vizPanel!: VizPanel;

  @Ref()
  private readonly settingModal!: VizSettingModal;

  @Ref()
  private readonly matchingLocationModal!: MatchingLocationModal;

  @Ref()
  private readonly configBuilder!: ConfigBuilderController;

  @Ref()
  private readonly databasePanel?: DatabaseListingController;

  private get isCreateMode(): boolean {
    return this.builderMode == BuilderMode.Create;
  }

  private showDatabaseLoading() {
    this.databaseStatus = Status.Loading;
  }

  private showDatabaseLoaded() {
    this.databaseStatus = Status.Loaded;
  }

  private get currentChartId(): WidgetId {
    const widget = DataManager.getCurrentWidget();
    if (widget) {
      return widget.id;
    } else {
      return -1;
    }
  }

  private get isDisableAddOrUpdate(): boolean {
    return !this.currentChartInfo || ChartDataModule.statuses[this.currentChartInfo.id] === Status.Error;
  }

  protected get toSettingComponent(): Function | undefined {
    const setting = this.currentChartInfo?.setting?.getChartOption();
    if (setting) {
      return VizSettingModal.components.get(setting.className);
    }
    return void 0;
  }

  private updateBuilderConfig(value: boolean) {
    this.isSettingConfig = value;
    // this.vizPanel.resize();
  }

  private onChartInfoChanged(chartInfo: ChartInfo, reRender = false) {
    this.currentChartInfo = cloneDeep(chartInfo);
    if (reRender) {
      this.vizPanel.renderChart(chartInfo);
    } else {
      this.vizPanel.updateChart(chartInfo);
    }
  }

  async init(chartInfo: ChartInfo, options?: TChartBuilderOptions): Promise<void> {
    try {
      this.isPreventChangeQuery = true;
      this.showDatabaseLoading();
      this.currentChartInfo = cloneDeep(chartInfo);
      this.config = options?.config ?? DefaultChartBuilderConfig;
      this.$nextTick(() => {
        this.vizPanel.renderChart(chartInfo);
        this.isPreventChangeQuery = false;
      });
      await Promise.all([
        GeolocationModule.init(),
        _ConfigBuilderStore.init(cloneDeep(chartInfo)),
        GeolocationModule.loadGeolocationFromWidget(cloneDeep(chartInfo)),
        DatabaseSchemaModule.loadShortDatabaseInfos(false)
      ]);
      _BuilderTableSchemaStore.setChartControls(options?.chartControls ?? []);
      await this.selectDatabaseAndTable(chartInfo, options);
    } catch (ex) {
      Log.error('ChartBuilderController::init', ex);
      this.isPreventChangeQuery = false;
      this.databaseStatus = Status.Error;
      this.databaseErrorMsg = 'Cannot load database schema';
      throw ex;
    }
  }

  async initDefault(parentInfo?: ChartInfo | null, options?: TChartBuilderOptions | null): Promise<void> {
    this.databaseStatus = Status.Loading;
    this.config = options?.config ?? DefaultChartBuilderConfig;

    _ConfigBuilderStore.initDefaultState();
    await Promise.all([GeolocationModule.init(), DatabaseSchemaModule.loadShortDatabaseInfos(false)]);
    _BuilderTableSchemaStore.setChartControls(options?.chartControls ?? []);
    await this.selectDatabaseAndTable(parentInfo, options);
  }

  private async selectDatabaseAndTable(chartInfo: ChartInfo | null | undefined, options?: TChartBuilderOptions | null) {
    try {
      this.showDatabaseLoading();
      if (options && options.database) {
        await this.selectTable(options.database, options.selectedTables || []);
      } else if (chartInfo) {
        await this.selectDatabaseByChartInfo(chartInfo);
      } else {
        await this.selectDefaultDatabaseAndTable();
      }
      this.showDatabaseLoaded();
    } catch (e) {
      this.databaseStatus = Status.Error;
      this.databaseErrorMsg = e.message;
    }
  }

  private async selectTable(database: DatabaseInfo, selectedTables: string[]) {
    _BuilderTableSchemaStore.setDbNameSelected(database.name);
    _BuilderTableSchemaStore.setDatabaseSchema(database);
    _BuilderTableSchemaStore.expandTables(selectedTables);
  }

  protected onQuerySettingChanged(querySetting: QuerySetting | null) {
    if (!this.isPreventChangeQuery) {
      const chartInfo: ChartInfo | null = this.createChartInfo(querySetting);
      this.currentChartInfo = chartInfo;
      // Log.debug('onQuerySettingChanged::', chartInfo?.setting.options.options);
      this.$nextTick(() => this.vizPanel.renderChart(chartInfo));
    }
  }

  protected clearData(): void {
    DataManager.removeCurrentDashboardId();
    DataManager.removeCurrentWidget();
    _ConfigBuilderStore.reset();
    _BuilderTableSchemaStore.reset();
  }

  beforeDestroy() {
    this.clearData();
  }

  private async selectDatabaseByChartInfo(chart: ChartInfo) {
    const mainDatabase: string | null = WidgetUtils.getMainDatabase([chart]);
    if (mainDatabase) {
      await _BuilderTableSchemaStore.selectDatabase(mainDatabase);
      _BuilderTableSchemaStore.collapseAllTable();
      const tablesUsedName = WidgetUtils.getFields([chart]).map(fieldUsed => fieldUsed.tblName);
      if (ListUtils.isNotEmpty(tablesUsedName)) {
        _BuilderTableSchemaStore.expandTables(tablesUsedName);
        // @ts-ignore
        this.$nextTick(() => {
          this.databasePanel?.scrollTo(tablesUsedName[0]);
        });
      }
    }
  }

  private async selectDefaultDatabaseAndTable() {
    const mainDatabase = DashboardModule.mainDatabase;
    const tables = DashboardModule.mainTables;
    if (mainDatabase) {
      await _BuilderTableSchemaStore.selectDatabase(mainDatabase);
      _BuilderTableSchemaStore.collapseAllTable();
      if (ListUtils.isNotEmpty(tables)) {
        _BuilderTableSchemaStore.expandTables(tables!);
        // @ts-ignore
        this.databasePanel?.scrollTo(tables[0]);
      }
    } else {
      await _BuilderTableSchemaStore.handleSelectDefaultDatabase();
    }
  }

  @Emit('onCancel')
  private async handleCancel() {
    return true;
  }

  private async handleAddToDashboard() {
    if (this.isDisableAddOrUpdate) {
      return;
    }
    const chartInfo: ChartInfo | null = this.getFinalChartInfo();
    Log.debug('handleAddToDashboard:: chartInfo', chartInfo);
    if (chartInfo) {
      this.$emit('onAddChart', chartInfo);
    } else {
      this.handleError(new DIException("Can't add chart to dashboard"));
    }
  }

  private async handleUpdateChart() {
    if (this.isDisableAddOrUpdate) {
      return;
    }
    const chartInfo: ChartInfo | null = this.getFinalChartInfo();
    if (chartInfo) {
      this.$emit('onUpdateChart', chartInfo);
    } else {
      this.handleError(new DIException("Can't update chart"));
    }
  }

  private getFinalChartInfo(): ChartInfo | null {
    const chartInfo: ChartInfo | null = cloneDeep(this.currentChartInfo);
    if (chartInfo) {
      const chartOption = chartInfo.setting.getChartOption();
      chartInfo.id = this.currentChartId;
      chartInfo.extraData = this.getExtraData();
      chartInfo.setTitle(chartOption?.getTitle() ?? '');
    }
    return chartInfo;
  }

  private getExtraData(): WidgetExtraData | undefined {
    const configs: Record<string, FunctionData[]> = Object.fromEntries(_ConfigBuilderStore.configsAsMap);
    const filters: Record<string, ConditionData[]> = Object.fromEntries(_ConfigBuilderStore.filterAsMap);
    return {
      configs: configs,
      filters: filters,
      currentChartType: _ConfigBuilderStore.chartType
    };
  }

  private handleError(ex: any): void {
    const exception = DIException.fromObject(ex);
    Log.error('ChartPreview::', exception.message);
    PopupUtils.showError(exception.message);
  }

  private onSettingButtonClicked() {
    this.settingModal.show(this.currentChartInfo!, this.onSave, this.onCancel);
  }

  private onCancel() {
    Log.debug('ChartBuilderContainer::onCancel');
  }

  private onSave(chart: ChartInfo) {
    Log.debug('ChartBuilderContainer::onSave');

    this.currentChartInfo = chart.copyWithId(this.PREVIEW_CHART_ID);
    _ConfigBuilderStore.setChartOption(this.currentChartInfo.setting.options);

    this.$nextTick(() => this.vizPanel.renderChart(this.currentChartInfo));
  }

  protected createChartInfo(query: QuerySetting | null): ChartInfo | null {
    if (query) {
      const commonSetting: WidgetCommonData = this.getWidgetCommonData(query.getChartOption());
      const querySetting: QuerySetting = cloneDeep(query);
      const chartFilter = this.getChartFilter();
      return new ChartInfo(commonSetting, querySetting, chartFilter);
    } else {
      return null;
    }
  }

  private getWidgetCommonData(chartOption: ChartOption | null | undefined): WidgetCommonData {
    return {
      id: this.PREVIEW_CHART_ID,
      name: chartOption?.getTitle() ?? '',
      description: chartOption?.getSubtitle() ?? '',
      extraData: void 0,
      backgroundColor: chartOption?.getBackgroundColor() || '#0000001A',
      textColor: chartOption?.getTextColor() || '#fff'
    };
  }

  private getChartFilter(): ChartInfo | undefined {
    return this.currentChartInfo?.chartFilter ?? void 0;
  }

  private onMatchingButtonClicked() {
    this.matchingLocationModal.show();
  }

  private handleApplyMatching() {
    if (MapQuerySetting.isMapQuery(this.currentChartInfo?.setting)) {
      this.currentChartInfo!.setting.setNormalizedMap(GeolocationModule.locationMatchedAsMap);
      this.onQuerySettingChanged(this.currentChartInfo?.setting!);
    }
  }

  private handleTableUpdated() {
    const querySetting: QuerySetting | null = this.configBuilder.getQuerySetting();
    if (querySetting) {
      this.onQuerySettingChanged(querySetting);
    }
  }

  private updateDatabaseStatus(newStatus: Status, errorMsg: string) {
    this.databaseStatus = newStatus;
    if (newStatus === Status.Error) {
      this.databaseErrorMsg = errorMsg;
    }
  }

  private onDragStart(node: SlTreeNodeModel<any>) {
    if (ChartControlField.isChartControlField(node?.field)) {
      this.draggingType = node.field.controlData.chartInfoType ?? null;
    } else {
      this.draggingType = null;
    }
  }
  private onDragEnd(node: SlTreeNodeModel<any>) {
    this.draggingType = null;
  }
}
