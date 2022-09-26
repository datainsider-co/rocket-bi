/*
 * @author: tvc12 - Thien Vi
 * @created: 12/10/20, 4:23 PM
 */

import { Component, Inject, Prop, Provide, Ref, Vue, Watch } from 'vue-property-decorator';

import { BuilderMode, ContextMenuItem, DashboardMode, DashboardOptions, SelectOption, SlicerRange, Status } from '@/shared';
import {
  AbstractTableQuerySetting,
  ChartInfo,
  ChartOption,
  DropdownQuerySetting,
  PivotTableQuerySetting,
  QueryRelatedWidget,
  QuerySettingType,
  TableColumn,
  Widget,
  WidgetId,
  Widgets
} from '@core/domain/Model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DI } from '@core/modules';
import { DataManager, QueryService } from '@core/services';
import { FilterRequest, QueryRequest } from '@core/domain/Request';
import { TableResponse, VisualizationResponse } from '@core/domain/Response';
import { ZoomModule } from '@/store/modules/zoom.store';
import EmptyWidget from '@/screens/DashboardDetail/components/WidgetContainer/charts/ErrorDisplay/EmptyWidget.vue';
import { FilterUtils, ListUtils } from '@/utils';
import { FilterModule } from '@/screens/DashboardDetail/stores/widget/FilterStore';
import ActionWidgetFilter from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/ActionWidgetFilter.vue';
import ActionWidgetMore from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/ActionWidgetMore.vue';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { cloneDeep, isFunction } from 'lodash';
import { QuerySettingModule } from '@/screens/DashboardDetail/stores/widget/QuerySettingStore';
import { PopupUtils } from '@/utils/popup.utils';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import { Log } from '@core/utils';
import {
  _ChartStore,
  DashboardControllerModule,
  DashboardModeModule,
  DashboardModule,
  RenderControllerModule,
  WidgetModule
} from '@/screens/DashboardDetail/stores';
import CaptureException from '@/shared/components/CaptureException';
import { DIException } from '@core/domain';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import { Inject as ServiceInjector } from 'typescript-ioc';
import ChartComponent from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartWidget/ChartComponent.vue';
import ChartComponentController from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartWidget/ChartComponentController';
import { GeolocationModule } from '@/store/modules/data_builder/geolocation.store';
import ChartFilter from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartFilter/ChartFilter.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import Swal from 'sweetalert2';

@Component({
  components: {
    StatusWidget,
    ChartComponent,
    EmptyWidget,
    ActionWidgetFilter,
    ActionWidgetMore,
    CaptureException,
    ChartError: ErrorWidget,
    InnerFilter: ChartFilter
  }
})
export default class ChartHolderController extends Vue {
  static readonly RENDER_WHEN = [Status.Rendering, Status.Rendered, Status.Error, Status.Updating];
  readonly renderWhen = ChartHolderController.RENDER_WHEN;
  $alert!: typeof Swal;
  isHovered: boolean;
  @Prop({ required: false, type: Boolean, default: false })
  private readonly showEditComponent!: boolean;
  @Prop({ required: true })
  private readonly metaData!: ChartInfo;
  // Provide from DiGridstackItem
  @Inject({ default: undefined })
  private readonly remove?: (fn: Function) => void;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isFullSizeMode!: boolean;

  // TODO: force hide full size in builder
  @Prop({ required: false, type: Boolean, default: false })
  private readonly isEnableFullSize!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private isPreview!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disableSort!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disableEmptyChart!: boolean;

  @Prop({ required: false, type: String, default: '' })
  emptyMessage!: string;

  @Prop({ required: false, type: Boolean, default: false })
  readonly disablePagination!: boolean;

  @Prop({ required: false, type: Function })
  private readonly retry!: Function | null;

  @Ref()
  private readonly chartComponent!: ChartComponentController;

  // resolve problem: auto load chart when init chart holder
  // fixme: remove when chart refactor chart
  @Prop({ type: Boolean, default: false })
  private autoRenderChart!: boolean;

  private currentChartInfo: ChartInfo;

  @ServiceInjector
  private readonly queryService!: QueryService;

  // fixme: workaround: fixed metaData change but currentChartInfo not change.

  constructor() {
    super();
    this.isHovered = false;
    this.currentChartInfo = this.metaData;
  }

  get response(): VisualizationResponse {
    return _ChartStore.chartDataResponses[this.currentChartInfo.id];
  }

  get errorMessage(): string {
    return _ChartStore.mapErrorMessage[this.currentChartInfo.id];
  }

  get hasData(): boolean {
    return (
      this.disableEmptyChart ||
      !this.metaData.setting.canQuery() || ///Chart k query thì k show empty
      (this.response?.hasData() ?? false)
    );
  }

  get status(): Status {
    return _ChartStore.statuses[this.currentChartInfo.id];
  }

  get vizSetting(): ChartOption | undefined {
    try {
      return this.currentChartInfo.setting.getChartOption();
    } catch (ex) {
      return void 0;
    }
  }

  get canShowFullScreen(): boolean {
    return DashboardModeModule.isViewMode && this.isEnableFullSize;
  }

  get viewMode(): string {
    return this.isFullSizeMode ? 'full-screen' : 'widget';
  }

  get enableMoreAction(): boolean {
    return !this.isPreview;
  }

  private get menuOptions(): ContextMenuItem[] {
    return [
      {
        text: DashboardOptions.EDIT_TITLE,
        click: this.handleEditTitle,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.CONFIG_CHART,
        click: this.handleEditChart,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.ADD_FILTER_WIDGET,
        click: this.handleAddInnerFilter,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.DUPLICATE_CHART,
        click: this.duplicateChart,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.DELETE,
        click: this.deleteChart,
        disabled: !DashboardModeModule.canDelete
      }
    ];
  }

  private get dashboardMode(): DashboardMode {
    return DashboardModeModule.mode;
  }

  private get isTableChart(): boolean {
    return this.currentChartInfo.setting instanceof AbstractTableQuerySetting;
  }

  private get isPivotTableChart(): boolean {
    return PivotTableQuerySetting.isPivotChartSetting(this.currentChartInfo.setting);
  }

  private get isTabFilter(): boolean {
    switch (this.currentChartInfo.setting.className) {
      case QuerySettingType.InputControl:
      case QuerySettingType.TabControl:
        return true;
      default:
        return false;
    }
  }

  private get isDropdownFilter(): boolean {
    return this.currentChartInfo.setting instanceof DropdownQuerySetting;
  }

  private get chartWidgetClass() {
    if (this.hasData) {
      return {
        'table-container': this.isTableChart || this.isPivotTableChart,
        'dropdown-container': this.isDropdownFilter,
        'tab-filter-container': this.isTabFilter,
        'chart-container': !(this.isTableChart || this.isPivotTableChart) && !this.isDropdownFilter && !this.isTabFilter,
        'p-0 preview-container': this.isPreview
        // 'non-interactive': this.showEditComponent
      };
    } else {
      return {
        'w-100 h-100': true
        // 'non-interactive': this.showEditComponent
      };
    }
  }

  private get backgroundColor(): string {
    let backgroundColor = this.currentChartInfo.backgroundColor;
    const vizSetting = this.currentChartInfo.setting?.getChartOption();
    if (vizSetting) {
      backgroundColor = vizSetting.getBackgroundColor();
    }
    return backgroundColor ?? '#00000019';
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

  async renderChart(chartInfo: ChartInfo) {
    try {
      this.setChartInfo(chartInfo);
      const disableQuery = !chartInfo.setting.canQuery();
      if (disableQuery) {
        //Nothing to do
        const emptyResponse = TableResponse.empty();
        _ChartStore.addData({ id: chartInfo.id, data: emptyResponse });
        _ChartStore.setStatusLoaded(chartInfo.id);
      } else {
        _ChartStore.setStatusLoading(chartInfo.id);
        const queryRequest: QueryRequest = this.toQueryRequest(chartInfo);
        const response = await this.queryService.query(queryRequest);
        //Todo: Update Setting by response here
        this._renderChart(response, chartInfo);
      }

      await this.renderChartFilter(chartInfo);
    } catch (ex) {
      this.renderError(ex);
    }
  }

  updateChart(chartInfo: ChartInfo) {
    this.setChartInfo(chartInfo);
    this.chartComponent.updateChart(chartInfo);
  }

  isAffectByFilter(): boolean {
    return !DashboardControllerModule.unAffectByFilters.has(this.currentChartInfo.id);
  }

  getFilterRequests(): FilterRequest[] {
    return [
      FilterModule.crossFilterRequest,
      ...FilterModule.filterRequests.values(),
      ...Array.from(FilterModule.mainFilterWidgets.values()).map(widget => widget.toFilterRequest())
    ].filter((filter): filter is FilterRequest => {
      return filter instanceof FilterRequest && filter.filterId !== this.currentChartInfo.id;
    });
  }

  hasFilter(): boolean {
    if (this.isPreview) {
      return false;
    }
    return this.getFilterRequests().length > 0;
  }

  @Watch('response')
  onChartDataChanged() {
    if (!this.hasData) {
      this.handleOnRendered();
    }
  }

  @Provide()
  zoom(nextLvl: string) {
    ZoomModule.zoomChart({ chart: this.currentChartInfo, nextLvl: nextLvl });
    return DashboardControllerModule.renderChartOrFilter({ widget: this.currentChartInfo, forceFetch: false });
  }

  @Provide()
  async onAddFilter(selectOption: SelectOption): Promise<void> {
    if (FilterUtils.isFilter(this.currentChartInfo)) {
      const widgetId: WidgetId = this.currentChartInfo.id;
      const querySetting: QuerySetting = QuerySettingModule.buildQuerySetting(widgetId);
      const filterRequest: FilterRequest | undefined = FilterRequest.fromValue(widgetId, querySetting, selectOption.data);
      if (filterRequest) {
        await FilterModule.handleSetFilter(filterRequest);
        // this.$emit('')
      }
    }
  }

  @Provide()
  async onAddMultiFilter(filters: SelectOption[]): Promise<void> {
    const isEmptyFilters = ListUtils.isEmpty(filters);
    if (isEmptyFilters) {
      return this.handleRemoveFilter(this.currentChartInfo);
    } else {
      if (FilterUtils.isFilter(this.currentChartInfo)) {
        const widgetId: WidgetId = this.currentChartInfo.id;
        const querySetting: QuerySetting = QuerySettingModule.buildQuerySetting(widgetId);
        const values: any[] = filters.map(filter => filter.id);
        const filterRequest: FilterRequest | undefined = FilterRequest.fromValues(widgetId, querySetting, values);
        if (filterRequest) {
          return FilterModule.handleSetFilter(filterRequest);
        }
      }
    }
  }

  @Provide()
  async onSlicerFilterChanged(range: SlicerRange) {
    if (FilterUtils.isFilter(this.currentChartInfo)) {
      const widgetId: WidgetId = this.currentChartInfo.id;
      const querySetting: QuerySetting = QuerySettingModule.buildQuerySetting(widgetId);
      const filterRequest: FilterRequest | undefined = FilterRequest.fromSlicerRangeValue(widgetId, querySetting, range);
      if (filterRequest) {
        return FilterModule.handleSetFilter(filterRequest);
      }
    }
  }

  @Provide()
  onRemoveFilter(): Promise<void> {
    const isFilter: boolean = FilterUtils.isFilter(this.currentChartInfo);
    if (isFilter) {
      return this.handleRemoveFilter(this.currentChartInfo);
    }
    return Promise.resolve();
  }

  @Provide()
  addFilter(request: FilterRequest) {
    const isFilter: boolean = FilterUtils.isFilter(this.currentChartInfo);
    if (isFilter) {
      return FilterModule.handleSetFilter(request);
    }
    return Promise.resolve();
  }

  @Provide()
  async onChangeFilterApply(on: boolean): Promise<void> {
    const isActivatedCrossFilter = FilterModule.currentCrossFilterData?.activeId === this.currentChartInfo.id;
    if (isActivatedCrossFilter) {
      await FilterModule.handleRemoveCrossFilter();
    }
    if (on) {
      return await DashboardControllerModule.applyFilterToWidget(this.currentChartInfo);
    } else {
      return await DashboardControllerModule.ignoreWidgetFromFilters(this.currentChartInfo);
    }
  }

  @Provide()
  async onChangeDynamicFunction(tableColumns: TableColumn[]): Promise<void> {
    return DashboardControllerModule.replaceDynamicFunction({ widget: this.metaData, selected: tableColumns, apply: true });
  }

  @Provide()
  async onChangeDynamicValues(values: string[]): Promise<void> {
    return DashboardControllerModule.replaceDynamicFilter({ widget: this.metaData, values: values, apply: true });
  }

  private setChartInfo(chartInfo: ChartInfo) {
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

  private _renderChart(response: VisualizationResponse, chart: ChartInfo) {
    _ChartStore.addData({
      id: chart.id,
      data: response
    });
    _ChartStore.setStatusLoaded(chart.id);
  }

  private renderError(ex: any) {
    const exception = DIException.fromObject(ex);
    Log.error('renderError::', ex);
    _ChartStore.setStatusError({
      id: this.currentChartInfo.id,
      message: exception.message
    });
  }

  private toQueryRequest(chartInfo: ChartInfo): QueryRequest {
    const querySetting: QuerySetting = chartInfo.setting;
    const queryRequest = QueryRequest.buildQueryRequest(querySetting);
    queryRequest.dashboardId = DashboardModule.id;
    return queryRequest;
  }

  private handleHover(isHovered: boolean) {
    this.isHovered = isHovered;
  }

  private clickSeeMore(event: Event) {
    const menuOptions: ContextMenuItem[] = [];
    if (this.currentChartInfo && this.currentChartInfo.className === Widgets.Chart && this.currentChartInfo.extraData) {
      menuOptions.push(...this.menuOptions);
    } else {
      menuOptions.push(...this.menuOptions.filter(item => item.text != DashboardOptions.CONFIG_CHART));
    }
    this.$root.$emit(DashboardEvents.ShowContextMenu, event, menuOptions);
  }

  @Track(TrackEvents.ConfigChart, {
    chart_id: (_: ChartHolderController) => _.currentChartInfo.id,
    chart_type: (_: ChartHolderController) => _.currentChartInfo.extraData?.currentChartType,
    chart_title: (_: ChartHolderController) => _.currentChartInfo.name
  })
  @Provide()
  private handleEditChart() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      const dataManager = DI.get(DataManager);
      dataManager.saveCurrentDashboardId(dashboard.id.toString());
      dataManager.saveCurrentDashboard(dashboard);
      dataManager.saveCurrentWidget(this.currentChartInfo);
      dataManager.saveChartBuilderMode(BuilderMode.Update);
      // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
      this.$root.$emit(DashboardEvents.UpdateChart, this.currentChartInfo);
    }
  }

  @Track(TrackEvents.ChartAddInnerFilter)
  @Provide()
  private handleAddInnerFilter() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      const dataManager = DI.get(DataManager);
      dataManager.saveCurrentDashboardId(dashboard.id.toString());
      dataManager.saveCurrentDashboard(dashboard);
      dataManager.saveChartBuilderMode(BuilderMode.Create);
      // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
      this.$root.$emit(DashboardEvents.AddInnerFilter, this.currentChartInfo);
    }
  }

  @Track(TrackEvents.ChartUpdateInnerFilter)
  @Provide()
  private handleUpdateInnerFilter() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      const dataManager = DI.get(DataManager);
      dataManager.saveCurrentDashboardId(dashboard.id.toString());
      dataManager.saveCurrentDashboard(dashboard);
      dataManager.saveCurrentWidget(this.currentChartInfo.chartFilter!);
      dataManager.saveChartBuilderMode(BuilderMode.Update);
      // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
      this.$root.$emit(DashboardEvents.UpdateInnerFilter, this.currentChartInfo);
    }
  }

  @Track(TrackEvents.ChartDeleteInnerFilter)
  @Provide()
  private async handleDeleteInnerFilter() {
    PopupUtils.hideAllPopup();
    this.currentChartInfo.chartFilter = undefined;
    await WidgetModule.handleUpdateWidget(this.currentChartInfo);
    await FilterModule.handleRemoveInnerFilter(this.currentChartInfo.id);
  }

  @Track(TrackEvents.RenameChart, {
    chart_id: (_: ChartHolderController) => _.currentChartInfo.id,
    chart_type: (_: ChartHolderController) => _.currentChartInfo.extraData?.currentChartType,
    chart_title: (_: ChartHolderController) => _.currentChartInfo.name ?? 'Untitled chart'
  })
  @Provide()
  private handleEditTitle() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.ShowEditChartTitleModal, this.currentChartInfo);
  }

  @Track(TrackEvents.DuplicateChart, { chart_id: (_: ChartHolderController) => _.currentChartInfo.id })
  @Provide()
  private async duplicateChart(): Promise<void> {
    PopupUtils.hideAllPopup();

    const newWidget: Widget = await WidgetModule.handleDuplicateWidget(this.currentChartInfo);
    if (QueryRelatedWidget.isQueryRelatedWidget(newWidget)) {
      ZoomModule.registerZoomData(cloneDeep(newWidget));
      DashboardControllerModule.setAffectFilterWidget(newWidget);
      QuerySettingModule.setQuerySetting({ id: newWidget.id, query: newWidget.setting });
      await DashboardControllerModule.renderChartOrFilter({ widget: newWidget, forceFetch: true });
    }
  }

  @Track(TrackEvents.DeleteChart, { chart_id: (_: ChartHolderController) => _.currentChartInfo.id })
  @Provide()
  private async deleteChart() {
    const { isConfirmed } = await this.$alert.fire({
      icon: 'warning',
      title: 'Remove widget',
      html: `Are you sure that you want to remove this widget?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No'
    });
    if (this.remove && isConfirmed) {
      this.remove(() => {
        PopupUtils.hideAllPopup();
        WidgetModule.handleDeleteWidget(this.currentChartInfo).catch(ex => {
          PopupUtils.showError('Can not remove widget, refresh page and try again');
        });
        this.onRemoveFilter();
      });
    }
  }

  private retryLoadData() {
    if (isFunction(this.retry)) {
      this.retry();
    } else {
      ZoomModule.registerZoomData(this.currentChartInfo);
      DashboardControllerModule.setAffectFilterWidget(this.currentChartInfo);
      DashboardControllerModule.renderChartOrFilter({ widget: this.currentChartInfo, forceFetch: true });
    }
  }

  private handleOnRendered() {
    Log.debug('ChartContainer::handleOnRendered', this.currentChartInfo.id);
    this.$nextTick(() => {
      RenderControllerModule.completeRender(this.currentChartInfo.id);
    });
  }

  private handleRemoveFilter(chartInfo: ChartInfo) {
    return FilterModule.handleRemoveFilter(chartInfo.id);
  }

  private showFullSize() {
    this.$root.$emit(DashboardEvents.ShowWidgetFullSize, this.currentChartInfo);
  }

  private hideFullSize() {
    this.$root.$emit(DashboardEvents.HideWidgetFullSize);
  }

  private handleChartRenderError(ex: any) {
    const exception = DIException.fromObject(ex);
    _ChartStore.setStatusError({ id: this.currentChartInfo.id, message: exception.message });
  }

  private async renderChartFilter(parentChartInfo: ChartInfo) {
    Log.debug('renderChartFilter::', parentChartInfo.containChartFilter);
    if (parentChartInfo.containChartFilter) {
      const chartFilter: ChartInfo = parentChartInfo.chartFilter!;
      const queryRequest: QueryRequest = this.toQueryRequest(chartFilter);
      const response: VisualizationResponse = await this.queryService.query(queryRequest);
      Log.debug('renderChartFilter::response', response);
      _ChartStore.addData({
        id: chartFilter.id,
        data: response
      });
    }
  }

  private async handleChartFilterSelect(filter: FilterRequest) {
    return FilterModule.handleSetInnerFilter(filter);
  }

  private async handleDeleteChartFilter() {
    return FilterModule.handleRemoveInnerFilter(this.currentChartInfo.id);
  }
}
