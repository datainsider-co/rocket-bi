/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 5:16 PM
 */

import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { ChartType, ConditionData, FunctionData, Status } from '@/shared';
import BuilderComponents from '@/shared/components/builder';
import DatabaseListing from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.vue';
import FilterPanel from '@/screens/chart-builder/config-builder/filter-panel/FilterPanel.vue';
import VizPanel from '@/screens/chart-builder/viz-panel/VizPanel.vue';
import {
  ChartInfo,
  ChartOption,
  DatabaseSchema,
  FlattenPivotTableChartOption,
  FlattenTableChartOption,
  QuerySetting,
  TableSchema,
  WidgetCommonData,
  WidgetExtraData,
  WidgetId
} from '@core/common/domain/model';
import { Log } from '@core/utils';
import VizSettingModal from '@/screens/chart-builder/setting-modal/ChartSettingModal.vue';
import MatchingLocationModal from '@/screens/chart-builder/viz-panel/MatchingLocationModal.vue';
import { _ChartStore } from '@/screens/dashboard-detail/stores';
import Settings from '@/shared/settings/common/install';
import ConfigBuilder from '@/screens/chart-builder/config-builder/ConfigBuilder.vue';
import ConfigBuilderController from '@/screens/chart-builder/config-builder/ConfigBuilder';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { cloneDeep } from 'lodash';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { DatabaseListingMode } from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing';

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
export default class ChartBuilder extends Vue {
  private readonly DatabaseEditionMode = DatabaseListingMode;
  private readonly PREVIEW_CHART_ID = -1;
  private isDragging = false;

  private currentChartInfo: ChartInfo | null = null;

  @Prop({ required: true })
  private readonly tableSchema!: TableSchema;

  @Prop({ required: true })
  private readonly defaultChartType!: ChartType;

  @Prop({ required: false })
  private readonly extraData?: WidgetExtraData;

  @Prop({ required: false })
  private readonly querySetting?: QuerySetting;

  @Ref()
  private readonly vizPanel!: VizPanel;

  @Ref()
  private readonly configBuilder!: ConfigBuilderController;

  private get currentChartId(): WidgetId {
    return -1;
  }

  private get isDisableAddOrUpdate(): boolean {
    return !this.currentChartInfo || _ChartStore.statuses[this.currentChartInfo.id] === Status.Error;
  }

  private injectChartOption(querySetting: QuerySetting<ChartOption>) {
    const newQuery = cloneDeep(querySetting);
    switch (this.defaultChartType) {
      case ChartType.FlattenTable:
      case ChartType.Table:
        newQuery.setChartOption(FlattenTableChartOption.getDefaultChartOption());
        break;
      case ChartType.FlattenPivotTable:
      case ChartType.PivotTable:
        newQuery.setChartOption(FlattenPivotTableChartOption.getDefaultChartOption());
        break;
    }
    return newQuery;
  }

  created() {
    this.initChartBuilder();
  }

  private initChartBuilder() {
    if (this.querySetting) {
      const querySetting = this.injectChartOption(this.querySetting);
      const chartInfo = ChartInfo.from(querySetting, this.extraData);
      this.init(chartInfo);
    } else {
      this.initDefault();
    }
  }

  async init(chartInfo: ChartInfo) {
    this.currentChartInfo = chartInfo;
    this.$nextTick(() => this.vizPanel.renderChart(this.currentChartInfo));
    await Promise.all([_ConfigBuilderStore.initState(chartInfo), this.selectTable(this.tableSchema)]);
  }

  async initDefault() {
    _ConfigBuilderStore.initDefaultState();
    _ConfigBuilderStore.setCurrentChartSelected(this.defaultChartType);
    _ConfigBuilderStore.changeConfig(_ConfigBuilderStore.itemSelected);

    await this.selectTable(this.tableSchema);
  }

  onQuerySettingChanged(querySetting: QuerySetting | null) {
    const chartInfo: ChartInfo | null = this.createChartInfo(querySetting);
    this.currentChartInfo = chartInfo;
    Log.debug('onQuerySettingChanged::', chartInfo?.setting.options.options);
    this.vizPanel.renderChart(chartInfo);
  }

  beforeDestroy() {
    _ConfigBuilderStore.initDefaultState();
    DatabaseSchemaModule.removeDatabaseSchema(this.tableSchema.dbName);
  }

  getFinalChartInfo(): ChartInfo | null {
    const chartInfo: ChartInfo | null = cloneDeep(this.currentChartInfo);
    if (chartInfo) {
      const chartOption = chartInfo.setting.getChartOption();
      chartInfo.id = this.currentChartId;
      chartInfo.extraData = this.getExtraData();
      chartInfo.setTitle(chartOption?.getTitle() ?? '');
    }
    return chartInfo;
  }

  private async selectTable(tableSchema: TableSchema) {
    const databaseSchema = DatabaseSchema.etlDatabase(tableSchema.dbName, 'Table & Field', [this.tableSchema]);
    _BuilderTableSchemaStore.setDbNameSelected(databaseSchema.name);
    _BuilderTableSchemaStore.setDatabaseSchema(databaseSchema);
    _BuilderTableSchemaStore.expandFirstTable();
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

  private createChartInfo(query: QuerySetting | null): ChartInfo | null {
    if (query) {
      const commonSetting: WidgetCommonData = this.getWidgetCommonData(query.getChartOption());
      const querySetting: QuerySetting = cloneDeep(query);
      return new ChartInfo(commonSetting, querySetting);
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

  @Watch('tableSchema')
  private handleTableSchema() {
    this.initChartBuilder();
  }
}
