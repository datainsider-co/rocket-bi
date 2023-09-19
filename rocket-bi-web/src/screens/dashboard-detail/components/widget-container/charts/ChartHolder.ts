/*
 * @author: tvc12 - Thien Vi
 * @created: 12/10/20, 4:23 PM
 */

import { Component, Inject, Prop, Provide, Ref, Vue, Watch } from 'vue-property-decorator';

import { BuilderMode, DashboardMode, Status } from '@/shared';
import {
  ChartInfo,
  ChartOption,
  FilterableSetting,
  QueryRelatedWidget,
  TableColumn,
  ValueCondition,
  ValueControlType,
  Widget,
  WidgetId,
  WidgetSetting
} from '@core/common/domain/model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DataManager, QueryService } from '@core/common/services';
import { FilterRequest, QueryRequest } from '@core/common/domain/request';
import { TableResponse, VisualizationResponse } from '@core/common/domain/response';
import { ZoomModule } from '@/store/modules/ZoomStore';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';
import { ListUtils, TimeoutUtils } from '@/utils';
import { FilterModule } from '@/screens/dashboard-detail/stores/widget/FilterStore';
import ActionWidgetFilter from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/ActionWidgetFilter.vue';
import ActionWidgetMore from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/ActionWidgetMore.vue';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { cloneDeep, isFunction } from 'lodash';
import { QuerySettingModule } from '@/screens/dashboard-detail/stores/widget/QuerySettingStore';
import { PopupUtils } from '@/utils/PopupUtils';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { Log } from '@core/utils';
import { ChartDataModule, DashboardControllerModule, DashboardModeModule, DashboardModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import CaptureException from '@/shared/components/CaptureException';
import { DIException } from '@core/common/domain';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import { Inject as ServiceInjector } from 'typescript-ioc';
import ChartComponent from '@/screens/dashboard-detail/components/widget-container/charts/chartwidget/ChartComponent.vue';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import ChartFilter from '@/screens/dashboard-detail/components/widget-container/charts/chartfilter/ChartFilter.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import Swal from 'sweetalert2';
import { CopiedData, CopiedDataType } from '@/screens/dashboard-detail/intefaces/CopiedData';
import WidgetContainer from '@/screens/dashboard-detail/components/widget-container/WidgetContainer.vue';

@Component({
  components: {
    StatusWidget,
    ChartComponent,
    EmptyWidget,
    ActionWidgetFilter,
    ActionWidgetMore,
    CaptureException,
    ChartError: ErrorWidget,
    InnerFilter: ChartFilter,
    WidgetContainer
  }
})
export default class ChartHolder extends Vue {
  protected readonly Status = Status;
  protected $alert!: typeof Swal;
  // fixme: workaround: fixed metaData change but currentChartInfo not change.
  protected currentChartInfo: ChartInfo;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly showEditComponent!: boolean;

  @Prop({ required: true })
  protected readonly metaData!: ChartInfo;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isPreview!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly disableSort!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly disableEmptyChart!: boolean;

  @Prop({ required: false, type: String, default: '' })
  protected readonly emptyMessage!: string;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly disablePagination!: boolean;

  @Prop({ required: false, type: Function })
  protected readonly retry!: Function | null;

  // resolve problem: auto load chart when init chart holder
  // fixme: remove when chart refactor chart
  @Prop({ type: Boolean, default: false })
  protected readonly autoRenderChart!: boolean;

  @Prop({ type: Boolean, default: false })
  protected readonly isHideShadow!: boolean;

  @Prop({ required: false, type: Object, default: () => WidgetSetting.default() })
  protected readonly widgetSetting!: WidgetSetting;

  @Ref()
  protected readonly chartComponent!: ChartComponent;

  // Provide from DiGridstackItem
  @Inject({ default: undefined })
  protected readonly remove?: (fn: Function) => void;

  @ServiceInjector
  protected readonly queryService!: QueryService;

  constructor() {
    super();
    this.currentChartInfo = this.metaData;
  }

  get response(): VisualizationResponse {
    return ChartDataModule.chartDataResponses[this.currentChartInfo.id];
  }

  get errorMessage(): string {
    return ChartDataModule.mapErrorMessage[this.currentChartInfo.id];
  }

  get hasData(): boolean {
    return (
      this.disableEmptyChart ||
      !this.metaData.setting.canQuery() || ///Chart k query thì k show empty
      (this.response?.hasData() ?? false)
    );
  }

  get status(): Status {
    return ChartDataModule.statuses[this.currentChartInfo.id];
  }

  get vizSetting(): ChartOption | undefined {
    try {
      return this.currentChartInfo.setting.getChartOption();
    } catch (ex) {
      return void 0;
    }
  }

  get enableMoreAction(): boolean {
    return !this.isPreview;
  }

  protected get dashboardMode(): DashboardMode {
    return DashboardModeModule.mode;
  }

  // fixme: will remove when refactor dashboard flow
  @Watch('metaData')
  onChartInfoChanged(metaData: ChartInfo) {
    this.currentChartInfo = metaData;
    if (this.autoRenderChart) {
      this.renderChart(this.currentChartInfo);
    }
  }

  created() {
    if (this.autoRenderChart) {
      this.renderChart(this.metaData);
    }
  }

  async renderChart(chartInfo: ChartInfo): Promise<void> {
    try {
      this.updateChart(chartInfo);
      const canQuery = chartInfo.setting.canQuery();
      if (canQuery) {
        ChartDataModule.setStatusLoading(chartInfo.id);
        const queryRequest: QueryRequest = this.toQueryRequest(chartInfo);
        const response = await this.queryService.query(queryRequest);
        this._renderChart(response, chartInfo);
      } else {
        // Nothing to do
        ChartDataModule.setVisualizationResponse({ id: chartInfo.id, data: TableResponse.empty() });
        ChartDataModule.setStatusLoaded(chartInfo.id);
      }

      await this.renderChartFilter(chartInfo);
    } catch (ex) {
      this.renderError(ex);
    }
  }

  updateChart(chartInfo: ChartInfo): void {
    this.currentChartInfo = chartInfo;
    /// FIXME: hardcode for fix problem load more in table
    /// will remove when refactor dashboard, chart.
    WidgetModule.setWidget({
      widget: chartInfo,
      widgetId: chartInfo.id
    });
    QuerySettingModule.setQuerySetting({
      query: chartInfo.setting,
      id: chartInfo.id
    });
    GeolocationModule.loadMapDataFromWidget(chartInfo);
  }

  @Provide()
  async saveChart(chartInfo: ChartInfo) {
    await WidgetModule.handleUpdateWidget(chartInfo);
    this.updateChart(chartInfo);
  }

  resizeChart() {
    this.chartComponent.resize();
  }

  isAffectByFilter(): boolean {
    return FilterModule.canApplyFilter(this.currentChartInfo.id);
  }

  getFilterRequests(): FilterRequest[] {
    return Array.from(FilterModule.mainFilterRequestMap.values()).filter((filter): filter is FilterRequest => {
      return filter && filter.filterId !== this.currentChartInfo.id;
    });
  }

  hasFilter(): boolean {
    if (this.isPreview) {
      return false;
    }
    return this.getFilterRequests().length > 0;
  }

  @Provide()
  async zoom(nextLvl: string): Promise<void> {
    ZoomModule.zoomChart({ chart: this.currentChartInfo, nextLvl: nextLvl });
    return DashboardControllerModule.renderChart({ id: this.currentChartInfo.id, forceFetch: false });
  }

  /**
   * method apply filter, if filterRequest is undefined will remove filter otherwise apply filter
   * if valueMap is undefined will remove cross filter otherwise apply cross filter
   */
  @Provide()
  async applyFilterRequest(data: { filterRequest?: FilterRequest; filterValueMap?: Map<ValueControlType, string[]> }): Promise<void> {
    const { filterRequest, filterValueMap } = data;
    const affectedByFilterIds: WidgetId[] = filterRequest ? this.addFilter(filterRequest) : this.removeFilter(this.currentChartInfo.id);
    const affectedByCrossFilterIds: WidgetId[] = await this.addFilterValue(this.currentChartInfo.id, filterValueMap);
    const affectedIds: WidgetId[] = ListUtils.distinct([...affectedByFilterIds, ...affectedByCrossFilterIds]);
    await this.requestRender(affectedIds);
    // remove ignore apply filter for current chart avoid reload current chart
    if (ListUtils.isNotEmpty(affectedByFilterIds)) {
      FilterModule.removeIgnoreApplyFilterById(this.currentChartInfo.id);
    }
  }

  /**
   * remove filter from store, return list widget id affected by filter
   */
  protected removeFilter(requestId: WidgetId): WidgetId[] {
    const isFilter: boolean = FilterableSetting.isFilterable(this.currentChartInfo.setting) && this.currentChartInfo.setting.isEnableFilter();
    if (isFilter) {
      const { groupId } = WidgetModule.findTabContainWidget(requestId);
      if (groupId > -1) {
        FilterModule.removeFilterFromGroup({ panelId: groupId, requestId: requestId });
        return [];
      }
      if (FilterModule.mainFilterRequestMap.has(requestId)) {
        FilterModule.removeFilterRequest(requestId);
        return WidgetModule.allQueryWidgets.filter(widget => FilterModule.canApplyFilter(widget.id)).map(widget => widget.id);
      }
    }
    return [];
  }

  protected addFilter(request: FilterRequest): WidgetId[] {
    const isFilter: boolean = FilterableSetting.isFilterable(this.currentChartInfo.setting) && this.currentChartInfo.setting.isEnableFilter();
    if (isFilter) {
      const { groupId } = WidgetModule.findTabContainWidget(request.filterId);
      if (groupId > -1) {
        FilterModule.pushFilterToGroup({ filterPanelId: groupId, request: request });
        return [];
      } else {
        FilterModule.addFilterRequest(request);
        return WidgetModule.allQueryWidgets.filter(widget => FilterModule.canApplyFilter(widget.id)).map(widget => widget.id);
      }
    }
    return [];
  }

  protected async addFilterValue(requestId: WidgetId, valueMap?: Map<ValueControlType, string[]>): Promise<WidgetId[]> {
    const { groupId } = WidgetModule.findTabContainWidget(requestId);
    if (groupId > -1) {
      FilterModule.pushFilterValueToGroup({ groupId: groupId, widgetId: requestId, valueMap: valueMap });
      return [];
    } else {
      return await DashboardControllerModule.applyDynamicValues({
        id: requestId,
        valueMap: valueMap,
        ignoreReRender: true
      });
    }
  }

  @Provide()
  async onChangeFilterApply(on: boolean): Promise<void> {
    if (on) {
      FilterModule.applyFilterToWidget(this.currentChartInfo.id);
      return DashboardControllerModule.renderChart({ id: this.currentChartInfo.id, forceFetch: true });
    } else {
      FilterModule.ignoreApplyFilterToWidget(this.currentChartInfo.id);
      return DashboardControllerModule.renderChart({ id: this.currentChartInfo.id, forceFetch: true });
    }
  }

  @Provide()
  async onChangeDynamicFunction(tableColumns: TableColumn[]): Promise<void> {
    return DashboardControllerModule.replaceDynamicFunction({
      id: this.metaData.id,
      selectedFunctions: tableColumns,
      forceRender: true
    });
  }

  @Provide()
  getCurrentValues(id: WidgetId): string[] {
    if (FilterModule.mainFilterRequestMap.has(id)) {
      const filterRequest: FilterRequest = FilterModule.mainFilterRequestMap.get(id)!;
      return ValueCondition.isValueCondition(filterRequest!.condition) ? filterRequest!.condition.getValues() : [];
    } else {
      return QuerySettingModule.getDynamicValueAsList(id);
    }
  }

  @Provide()
  protected async applyDirectCrossFilter(valueMap: Map<ValueControlType, string[]> | undefined): Promise<void> {
    Log.debug('changeValues::id', this.metaData.id);
    Log.debug('changeValues::valueMap', valueMap);
    await DashboardControllerModule.applyDynamicValues({ id: this.metaData.id, valueMap: valueMap });
  }

  protected _renderChart(response: VisualizationResponse, chart: ChartInfo) {
    ChartDataModule.setVisualizationResponse({
      id: chart.id,
      data: response
    });
    ChartDataModule.setStatusLoaded(chart.id);
  }

  protected renderError(ex: any) {
    const exception = DIException.fromObject(ex);
    Log.error('renderError::', ex);
    ChartDataModule.setStatusError({
      id: this.currentChartInfo.id,
      message: exception.message
    });
  }

  protected toQueryRequest(chartInfo: ChartInfo): QueryRequest {
    const querySetting: QuerySetting = chartInfo.setting;
    const queryRequest = QueryRequest.fromQuerySetting(querySetting);
    queryRequest.dashboardId = DashboardModule.id;
    return queryRequest;
  }

  @Track(TrackEvents.ConfigChart, {
    chart_id: (_: ChartHolder) => _.currentChartInfo.id,
    chart_type: (_: ChartHolder) => _.currentChartInfo.extraData?.currentChartType,
    chart_title: (_: ChartHolder) => _.currentChartInfo.name
  })
  @Provide()
  protected handleEditChart() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      DataManager.saveCurrentDashboardId(dashboard.id.toString());
      DataManager.saveCurrentDashboard(dashboard);
      DataManager.saveCurrentWidget(this.currentChartInfo);
      // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
      this.$root.$emit(DashboardEvents.UpdateChart, this.currentChartInfo);
    }
  }

  @Track(TrackEvents.ChartAddInnerFilter)
  @Provide()
  protected handleAddInnerFilter() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      DataManager.saveCurrentDashboardId(dashboard.id.toString());
      DataManager.saveCurrentDashboard(dashboard);
      // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
      this.$root.$emit(DashboardEvents.AddInnerFilter, this.currentChartInfo);
    }
  }

  @Track(TrackEvents.ChartUpdateInnerFilter)
  @Provide()
  protected handleUpdateInnerFilter() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      DataManager.saveCurrentDashboardId(dashboard.id.toString());
      DataManager.saveCurrentDashboard(dashboard);
      DataManager.saveCurrentWidget(this.currentChartInfo.chartFilter!);
      // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
      this.$root.$emit(DashboardEvents.UpdateInnerFilter, this.currentChartInfo);
    }
  }

  @Track(TrackEvents.ChartDeleteInnerFilter)
  @Provide()
  protected async handleDeleteInnerFilter() {
    PopupUtils.hideAllPopup();
    this.currentChartInfo.chartFilter = undefined;
    await WidgetModule.handleUpdateWidget(this.currentChartInfo);
    await FilterModule.handleRemoveInnerFilter(this.currentChartInfo.id);
  }

  @Track(TrackEvents.RenameChart, {
    chart_id: (_: ChartHolder) => _.currentChartInfo.id,
    chart_type: (_: ChartHolder) => _.currentChartInfo.extraData?.currentChartType,
    chart_title: (_: ChartHolder) => _.currentChartInfo.name ?? 'Untitled chart'
  })
  @Provide()
  protected handleEditTitle() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.ShowEditChartTitleModal, this.currentChartInfo);
  }

  @Track(TrackEvents.DuplicateChart, { chart_id: (_: ChartHolder) => _.currentChartInfo.id })
  @Provide()
  protected async duplicateChart(): Promise<void> {
    PopupUtils.hideAllPopup();

    const newWidget: Widget = await WidgetModule.handleDuplicateWidget(this.currentChartInfo);
    if (QueryRelatedWidget.isQueryRelatedWidget(newWidget)) {
      const clonedChart = cloneDeep(newWidget);
      ZoomModule.registerZoomData({ id: clonedChart.id, setting: clonedChart.setting });
      FilterModule.setAffectFilterWidget(newWidget);
      QuerySettingModule.setQuerySetting({ id: newWidget.id, query: newWidget.setting });
      await DashboardControllerModule.renderChart({ id: newWidget.id, forceFetch: true });
    }
  }

  @Track(TrackEvents.CopyChart, { chart_id: (_: ChartHolder) => _.currentChartInfo.id })
  @Provide()
  protected async copyChart(): Promise<void> {
    try {
      PopupUtils.hideAllPopup();
      const copiedData = CopiedData.create(CopiedDataType.Chart, {
        widget: this.currentChartInfo,
        position: WidgetModule.getPosition(this.currentChartInfo.id)
      });
      DashboardModule.setCopiedData(copiedData);
      await this.$copyText(JSON.stringify(copiedData));
    } catch (ex) {
      Log.error('copyChart::', ex);
      PopupUtils.showError('Copy chart failed, please try again later');
    }
  }

  @Track(TrackEvents.DeleteChart, { chart_id: (_: ChartHolder) => _.currentChartInfo.id })
  @Provide()
  protected async deleteChart() {
    const { isConfirmed } = await this.$alert.fire({
      icon: 'warning',
      title: 'Remove widget',
      html: `Are you sure that you want to remove this widget?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No'
    });
    if (this.remove && isConfirmed) {
      this.remove(async () => {
        PopupUtils.hideAllPopup();
        WidgetModule.handleDeleteWidget(this.currentChartInfo).catch(ex => {
          PopupUtils.showError('Can not remove widget, refresh page and try again');
        });
        const affectedIds: WidgetId[] = this.removeFilter(this.currentChartInfo.id);
        this.requestRender(affectedIds);
      });
    }
  }

  protected async requestRender(affectedIds: WidgetId[]): Promise<void> {
    // avoid stuck ui
    await TimeoutUtils.sleep(100);
    await DashboardControllerModule.renderCharts({
      idList: affectedIds,
      useBoost: DashboardModule.isUseBoost
    });
  }

  protected retryLoadData() {
    if (isFunction(this.retry)) {
      this.retry();
    } else {
      ZoomModule.registerZoomData({ id: this.currentChartInfo.id, setting: this.currentChartInfo.setting });
      FilterModule.setAffectFilterWidget(this.currentChartInfo);
      DashboardControllerModule.renderChart({ id: this.currentChartInfo.id, forceFetch: true });
    }
  }

  protected handleChartRenderError(ex: any) {
    const exception = DIException.fromObject(ex);
    ChartDataModule.setStatusError({ id: this.currentChartInfo.id, message: exception.message });
  }

  protected async renderChartFilter(parentChartInfo: ChartInfo): Promise<void> {
    if (parentChartInfo.hasInnerFilter) {
      const chartFilter: ChartInfo = parentChartInfo.chartFilter!;
      const queryRequest: QueryRequest = this.toQueryRequest(chartFilter);
      const response: VisualizationResponse = await this.queryService.query(queryRequest);
      ChartDataModule.setVisualizationResponse({
        id: chartFilter.id,
        data: response
      });
    }
  }

  protected async handleChartFilterSelect(filter: FilterRequest) {
    return FilterModule.handleSetInnerFilter(filter);
  }

  protected async handleDeleteChartFilter() {
    return FilterModule.handleRemoveInnerFilter(this.currentChartInfo.id);
  }

  @Provide()
  getExpandedKeys(id: WidgetId): string[] | undefined {
    return WidgetModule.expandedKeysAsMap.get(id);
  }

  @Provide()
  getSelectedKeys(id: WidgetId): string[] | undefined {
    return WidgetModule.selectedKeysAsMap.get(id);
  }

  @Provide()
  setExpandedKeys(id: WidgetId, keys: string[]): void {
    WidgetModule.setExpandedKeys({ id: id, keys: keys });
  }

  @Provide()
  setSelectedKeys(id: WidgetId, keys: string[]): void {
    WidgetModule.setSelectedKeys({ id: id, keys: keys });
  }
}
