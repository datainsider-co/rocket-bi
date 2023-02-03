/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 5:16 PM
 */

import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { Inject } from 'typescript-ioc';
import { DataManager } from '@core/common/services';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { BuilderMode, ConditionData, FunctionData, Status, VisualizationItemData } from '@/shared';
import BuilderComponents from '@/shared/components/builder';
import DatabaseListing from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.vue';
import DatabaseListingController from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.ts';
import FilterPanel from '@/screens/chart-builder/config-builder/filter-panel/FilterPanel.vue';
import VizPanel from '@/screens/chart-builder/viz-panel/VizPanel.vue';
import { ChartInfo, ChartOption, DatabaseSchema, MapQuerySetting, QuerySetting, WidgetCommonData, WidgetExtraData, WidgetId } from '@core/common/domain/model';
import { DIException } from '@core/common/domain/exception';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { Log, WidgetUtils } from '@core/utils';
import VizSettingModal from '@/screens/chart-builder/setting-modal/ChartSettingModal.vue';
import MatchingLocationModal from '@/screens/chart-builder/viz-panel/MatchingLocationModal.vue';
import { _ChartStore, DashboardModule } from '@/screens/dashboard-detail/stores';
import { PopupUtils } from '@/utils/PopupUtils';
import Settings from '@/shared/settings/common/install';
import ConfigBuilder from '@/screens/chart-builder/config-builder/ConfigBuilder.vue';
import ConfigBuilderController from '@/screens/chart-builder/config-builder/ConfigBuilder';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { cloneDeep } from 'lodash';
import { Di } from '@core/common/modules';
import { ListUtils } from '@/utils';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { TChartBuilderOptions } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderModal.vue';
import { ChartBuilderConfig, DefaultChartBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';

Vue.use(BuilderComponents);
Vue.use(Settings);
@Component({
  components: {
    FilterPanel,
    DatabaseListing,
    ConfigBuilder,
    VizPanel,
    VizSettingModal,
    MatchingLocationModal
  }
})
export default class ChartBuilderController extends Vue {
  private readonly PREVIEW_CHART_ID = -1;
  private isDragging = false;
  private databaseStatus = Status.Loading;
  private databaseErrorMessage = '';
  private config: ChartBuilderConfig = DefaultChartBuilderConfig;

  @Prop({ required: false, type: String, default: BuilderMode.Create })
  private readonly builderMode!: BuilderMode;

  @Prop({ required: true, type: Array })
  private readonly visualizationItems!: VisualizationItemData[];

  private currentChartInfo: ChartInfo | null = null;
  private preventWatchQueryChange = false; //Chặn việc Watch làm thay đổi setting khi đang init

  @Ref()
  private readonly vizPanel!: VizPanel;

  @Ref()
  private readonly settingModal!: VizSettingModal;

  @Ref()
  private readonly matchingLocationModal!: MatchingLocationModal;

  @Inject
  private dataManager!: DataManager;

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
    const widget = this.dataManager.getCurrentWidget();
    if (widget) {
      return widget.id;
    } else {
      return -1;
    }
  }

  private get isDisableAddOrUpdate(): boolean {
    return !this.currentChartInfo || _ChartStore.statuses[this.currentChartInfo.id] === Status.Error;
  }

  async init(chartInfo: ChartInfo, options?: TChartBuilderOptions) {
    try {
      this.preventWatchQueryChange = true;
      this.showDatabaseLoading();
      this.currentChartInfo = cloneDeep(chartInfo);
      this.config = options?.config ?? DefaultChartBuilderConfig;
      this.$nextTick(() => {
        this.vizPanel.renderChart(chartInfo);
        this.preventWatchQueryChange = false;
      });
      await Promise.all([
        GeolocationModule.loadGeolocationMap(),
        _ConfigBuilderStore.initState(cloneDeep(chartInfo)),
        GeolocationModule.loadGeolocationFromWidget(cloneDeep(chartInfo)),
        DatabaseSchemaModule.loadAllDatabaseInfos()
      ]);
      await this.selectDatabaseAndTable(chartInfo, options);
    } catch (ex) {
      Log.error(ex);
      this.preventWatchQueryChange = false;
      throw ex;
    }
  }

  async initDefault(parentInfo?: ChartInfo | null, options?: TChartBuilderOptions | null) {
    this.databaseStatus = Status.Loading;
    this.config = options?.config ?? DefaultChartBuilderConfig;

    _ConfigBuilderStore.initDefaultState();
    await Promise.all([GeolocationModule.loadGeolocationMap(), DatabaseSchemaModule.loadAllDatabaseInfos()]);
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
      this.databaseErrorMessage = e.message;
    }
  }

  private async selectTable(database: DatabaseSchema, selectedTables: string[]) {
    _BuilderTableSchemaStore.setDbNameSelected(database.name);
    _BuilderTableSchemaStore.setDatabaseSchema(database);
    _BuilderTableSchemaStore.expandTables(selectedTables);
  }

  onQuerySettingChanged(querySetting: QuerySetting | null) {
    if (!this.preventWatchQueryChange) {
      const chartInfo: ChartInfo | null = this.createChartInfo(querySetting);
      this.currentChartInfo = chartInfo;
      Log.debug('onQuerySettingChanged::', chartInfo?.setting.options.options);
      this.$nextTick(() => this.vizPanel.renderChart(chartInfo));
    }
  }

  private clearData() {
    const dataManager: DataManager = Di.get(DataManager);

    dataManager.removeCurrentDashboardId();
    dataManager.removeCurrentWidget();
    dataManager.removeChartBuilderMode();
    _ConfigBuilderStore.initDefaultState();
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
      const tablesUsedName = WidgetUtils.getFieldsFromQueryWidgets([chart]).map(fieldUsed => fieldUsed.tblName);
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
    _ConfigBuilderStore.saveChartOption(this.currentChartInfo.setting.options);

    this.$nextTick(() => this.vizPanel.renderChart(this.currentChartInfo));
  }

  private createChartInfo(query: QuerySetting | null): ChartInfo | null {
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
    const querySetting: QuerySetting<ChartOption> | null = this.configBuilder.getQuerySetting();
    if (querySetting) {
      this.onQuerySettingChanged(querySetting);
    }
  }

  private updateDatabaseStatus(status: Status) {
    this.databaseStatus = status;
  }
}
