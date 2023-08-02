/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:00 PM
 */

import router from '@/router/Router';
import { QuerySettingModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { DashboardControllerModule } from '@/screens/dashboard-detail/stores/controller/DashboardControllerStore';
import { MainDateCompareRequest } from '@/screens/dashboard-detail/stores/controller/ChartDataStore';
import { DashboardModule, MainDateData } from '@/screens/dashboard-detail/stores/dashboard/DashboardStore';
import { DateRange, Stores } from '@/shared';
import { CalendarData } from '@/shared/models';
import store from '@/store';
import { ChartInfoUtils, DateUtils, TimeoutUtils } from '@/utils';
import { RouterUtils } from '@/utils/RouterUtils';
import {
  ChartInfo,
  Condition,
  Dashboard,
  DIException,
  DynamicFilter,
  Equatable,
  Filterable,
  FilterPanel,
  FilterRequest,
  FilterWidget,
  MainDateMode,
  QueryRelatedWidget,
  QuerySetting,
  Widget,
  WidgetId
} from '@core/common/domain';
import { Log } from '@core/utils';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { FilterStoreUtils } from '@/screens/dashboard-detail/stores/widget/FilterStoreUtils';
import { DataManager } from '@core/common/services';

export class CrossFilterData extends Equatable {
  constructor(readonly activeId: WidgetId, readonly value: string, readonly extraData?: any) {
    super();
  }

  equals(obj: any): boolean {
    return !!obj && obj.activeId === this.activeId && obj.value === this.value;
  }
}

export class PanelFilterInfo {
  panelId: WidgetId;
  filterRequestAsMap: Map<WidgetId, FilterRequest>;
  removedFilterIdAsSet: Set<WidgetId>;

  constructor(panelId: WidgetId, filterRequests: Map<WidgetId, FilterRequest>, removedFilters: Set<WidgetId>) {
    this.panelId = panelId;
    this.filterRequestAsMap = filterRequests;
    this.removedFilterIdAsSet = removedFilters;
  }

  static empty(panelId: WidgetId): PanelFilterInfo {
    return new PanelFilterInfo(panelId, new Map(), new Set());
  }

  static fromRequest(panelId: WidgetId, request: FilterRequest): PanelFilterInfo {
    return new PanelFilterInfo(panelId, new Map([[request.filterId, request]]), new Set());
  }

  setRequest(request: FilterRequest): boolean {
    try {
      this.removedFilterIdAsSet.delete(request.filterId);
      this.filterRequestAsMap.set(request.filterId, request);
      return true;
    } catch (ex) {
      Log.error(ex);
      return false;
    }
  }

  removeRequest(id: WidgetId) {
    try {
      this.filterRequestAsMap.delete(id);
      this.removedFilterIdAsSet.add(id);
      return true;
    } catch (ex) {
      Log.error(ex);
      return false;
    }
  }

  getRequests(): FilterRequest[] {
    return Array.from(this.filterRequestAsMap.values()).filter(request => !this.removedFilterIdAsSet.has(request.filterId));
  }

  getRemovedFilterIds(): WidgetId[] {
    return Array.from(this.removedFilterIdAsSet.values());
  }
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.FilterStore })
export class FilterStore extends VuexModule {
  mainFilterWidgets: Map<WidgetId, FilterWidget> = new Map<WidgetId, FilterWidget>();
  filterRequests: Map<WidgetId, FilterRequest> = new Map<WidgetId, FilterRequest>();
  innerFilters: Map<WidgetId, FilterRequest> = new Map<WidgetId, FilterRequest>();
  filterPanelAsMap: Map<WidgetId, PanelFilterInfo> = new Map<WidgetId, PanelFilterInfo>();

  currentCrossFilterData: CrossFilterData | null = null;
  //Main date Filter
  chosenRange: DateRange | null = null;
  mainDateMode: MainDateMode | null = null;

  compareRange: DateRange | null = null;
  // filter in routers
  routerFilters: DynamicFilter[] = [];
  ///Is filter (single choice, multi choice, ...) or cross filter
  excludeApplyFilterIds: Set<WidgetId> = new Set<WidgetId>();
  /**
   * all widget ignore filter.
   * if widget is in this list, it will not be affected by filter
   */
  unAffectByFilters: Set<WidgetId> = new Set<WidgetId>();

  get crossFilterRequest(): FilterRequest | null {
    if (this.currentCrossFilterData) {
      const activeId: WidgetId = this.currentCrossFilterData.activeId;
      const querySetting: QuerySetting = QuerySettingModule.buildQuerySetting(activeId);
      const filterRequest: FilterRequest | undefined = FilterRequest.fromValue(activeId, querySetting, this.currentCrossFilterData.value);
      return filterRequest || null;
    } else {
      return null;
    }
  }

  get isAffectedByFilter(): (id: WidgetId) => boolean {
    return id => {
      return !this.unAffectByFilters.has(id) && !this.excludeApplyFilterIds.has(id);
    };
  }

  /*Lấy tất cả filter của 1 widget <br>
  Có 1 trường hợp sẽ chỉ có Inner Filter:
   + TH1: Widget không bị Affect By Filter (Setting của widget)
   */
  get getFilters(): (id: WidgetId) => FilterRequest[] {
    return id => {
      const isChartFilter = ChartInfoUtils.isChartFilterId(id);
      const parentId = isChartFilter ? ChartInfoUtils.generatedChartParentId(id) : id;
      const isAffectByFilter = this.isAffectedByFilter(parentId);
      // const isFilter = this.excludeApplyFilterIds.has(parentId);
      const filters = [];
      filters.push(this.innerFilters.get(id));
      Log.debug('getAllFilters::isChartFilter::', isChartFilter, '::parentId::', parentId, '::isAffectByFilter::', isAffectByFilter, '::isFilter::');
      if (isAffectByFilter) {
        filters.push(
          this.crossFilterRequest,
          ...[...this.filterRequests.values()].filter(request => request.filterId !== id), ///All filter request not me
          ...Array.from(this.mainFilterWidgets.values()).map(widget => widget.toFilterRequest())
        );
      }
      ///remove undefined or null
      return filters.filter((filter): filter is FilterRequest => filter instanceof FilterRequest);
    };
  }

  /**
   * Main Date Filter Handler Implement
   */
  get mainDateCompareRequest(): MainDateCompareRequest {
    return {
      field: DashboardModule.mainDateFilter?.affectedField!,
      currentRange: this.chosenRange,
      compareRange: this.compareRange,
      mainDateMode: this.mainDateMode
    };
  }

  get isActivatedCrossFilter(): (crossFilterData: CrossFilterData) => boolean {
    return crossFilterData => crossFilterData.equals(this.currentCrossFilterData);
  }
  @Mutation
  resetCrossFilter(): void {
    this.currentCrossFilterData = null;
  }

  @Action
  async addFilterRequest(request: FilterRequest): Promise<void> {
    const { tabId } = WidgetModule.findTabContainWidget(request.filterId);
    if (tabId > -1) {
      this.setFilterToFilterPanel({ filterPanelId: tabId, request: request });
      return Promise.resolve();
    } else {
      this.setFilterRequest(request);
      // avoid stuck ui
      await this.applyFilters();
    }
  }

  @Action
  async handleApplyFilterPanel(panelId: WidgetId): Promise<void> {
    if (!this.filterPanelAsMap.has(panelId)) {
      throw new DIException(`Filter panel ${panelId} is not found!`);
    } else {
      const filterPanel: PanelFilterInfo = this.filterPanelAsMap.get(panelId)!;
      this.removeFilters(filterPanel.getRemovedFilterIds());
      this.setFilterRequests(filterPanel.getRequests());
      await this.applyFilters();
    }
  }

  @Mutation
  addFilterPanelInfo(filterPanel: FilterPanel): void {
    const panelInfo: PanelFilterInfo = PanelFilterInfo.empty(filterPanel.id);
    this.filterPanelAsMap.set(panelInfo.panelId, panelInfo);
  }

  @Mutation
  removeFilterPanel(panelId: WidgetId) {
    if (!this.filterPanelAsMap.has(panelId)) {
      throw new DIException(`Filter panel ${panelId} is not found!`);
    } else {
      this.filterPanelAsMap.delete(panelId);
    }
  }

  @Action
  handleSetInnerFilter(request: FilterRequest): Promise<void> {
    this.setInnerFilter(request);
    const parentId = request.filterId;
    return TimeoutUtils.waitAndExecuteAsPromise(() => DashboardControllerModule.renderChart({ id: parentId }));
  }

  @Action
  handleRemoveInnerFilter(id: WidgetId): Promise<void> {
    this.removeChartFilter(id);
    return TimeoutUtils.waitAndExecuteAsPromise(() => DashboardControllerModule.renderChart({ id: id }));
  }

  @Mutation
  private setFilterRequest(request: FilterRequest): void {
    this.filterRequests.set(request.filterId, request);
    this.excludeApplyFilterIds.add(request.filterId);
  }

  @Mutation
  private setFilterRequests(requests: FilterRequest[]): void {
    requests.forEach(request => {
      this.filterRequests.set(request.filterId, request);
      this.excludeApplyFilterIds.add(request.filterId);
    });
  }

  @Mutation
  private setFilterToFilterPanel(payload: { filterPanelId: WidgetId; request: FilterRequest }): void {
    const { filterPanelId, request } = payload;
    if (this.filterPanelAsMap.has(filterPanelId)) {
      this.filterPanelAsMap.get(filterPanelId)!.setRequest(request);
    } else {
      ///Create New
      const filterPanel = PanelFilterInfo.fromRequest(filterPanelId, request);
      this.filterPanelAsMap.set(filterPanelId, filterPanel);
    }
    this.filterPanelAsMap = new Map(this.filterPanelAsMap);
    this.excludeApplyFilterIds.add(request.filterId);
  }

  @Mutation
  private removeFilterInFilterPanel(payload: { panelId: WidgetId; requestId: WidgetId }) {
    const { panelId, requestId } = payload;
    if (this.filterPanelAsMap.has(panelId)) {
      this.filterPanelAsMap.get(panelId)!.removeRequest(requestId);
    } else {
      throw new DIException(`Filter panel ${panelId} is not found!`);
    }
  }

  @Mutation
  private setInnerFilter(request: FilterRequest): void {
    this.innerFilters.set(request.filterId, request);
  }

  @Mutation
  setMainFilters(widgets: FilterWidget[]): void {
    this.mainFilterWidgets.clear();
    const widgetMap: [WidgetId, FilterWidget][] = widgets.map(widget => [widget.id, widget]);
    this.mainFilterWidgets = new Map<WidgetId, FilterWidget>(widgetMap);
  }

  @Mutation
  removeChartFilter(id: WidgetId): void {
    this.innerFilters.delete(id);
  }

  @Mutation
  loadLocalMainFilters(dashboard: Dashboard) {
    const localMainFilters = DataManager.getMainFilters(dashboard.id.toString());
    const filters = RouterUtils.getFilters(router.currentRoute);
    this.routerFilters = filters;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    FilterModule.setMainFilters(localMainFilters.concat(filters));
  }

  @Mutation
  reset() {
    this.mainFilterWidgets.clear();
    this.filterRequests.clear();
    this.currentCrossFilterData = null;
    // Reset Main date filter
    this.chosenRange = null;
    this.compareRange = null;
    this.routerFilters = [];
    this.filterPanelAsMap.clear();
    this.unAffectByFilters.clear();
  }

  @Mutation
  loadDateRangeFilter(payload: MainDateData): void {
    this.mainDateMode = payload.mode;
    if (payload.mode == MainDateMode.custom) {
      this.chosenRange = payload.chosenDateRange!;
    } else {
      this.chosenRange = DateUtils.getDateRange(payload.mode);
    }
  }

  @Mutation
  setCompareRange(range: DateRange | null) {
    this.compareRange = range;
  }

  @Mutation
  setChosenRange(range: DateRange | null) {
    this.chosenRange = range;
  }

  @Mutation
  setMainDateCalendar(calendar: CalendarData | null) {
    Log.debug('FilterStore::setMainDateCalendar::', calendar);
    this.chosenRange = calendar?.chosenDateRange ?? null;
    this.mainDateMode = calendar?.filterMode ?? null;
  }

  @Mutation
  removeMainDateCalendar() {
    this.chosenRange = null;
    this.mainDateMode = null;
    this.compareRange = null;
  }

  @Action
  handleMainDateFilterChange(): void {
    TimeoutUtils.waitAndExec(
      null,
      () => {
        DashboardModule.updateMainDateFilter({ mainDateFilter: this.mainDateFilterRequest, mode: this.mainDateMode });
        this.applyFilters();
      },
      150
    );
  }

  @Mutation
  setRouterFilters(routerFilters: DynamicFilter[]) {
    this.routerFilters = routerFilters;
  }

  /**
   * Remove Current Cross filter and add new CrossFilter
   * @param crossFilterData
   */
  @Action
  async handleSetCrossFilter(crossFilterData: CrossFilterData): Promise<void> {
    this.setCrossFilter(crossFilterData);
    return this.applyFilters();
  }

  @Mutation
  setCrossFilter(crossFilterData: CrossFilterData) {
    const oldActiveId = this.currentCrossFilterData?.activeId ?? -1;
    this.excludeApplyFilterIds.delete(oldActiveId);

    this.currentCrossFilterData = crossFilterData;
    this.excludeApplyFilterIds.add(crossFilterData.activeId);
  }

  @Action
  async handleRemoveCrossFilter(): Promise<void> {
    const currentActiveId = this.currentCrossFilterData?.activeId ?? -1;
    this.resetCrossFilter();
    await this.applyFilters();
    this.removeExcludeApplyFilterId(currentActiveId);
  }

  @Action
  async handleRemoveFilter(id: WidgetId): Promise<void> {
    const { tabId } = WidgetModule.findTabContainWidget(id);
    if (tabId > -1) {
      this.removeFilterInFilterPanel({ panelId: tabId, requestId: id });
      return Promise.resolve();
    } else if (this.filterRequests.has(id)) {
      this.removeFilter(id);
      await this.applyFilters();
      // avoid reload current widget
      this.removeExcludeApplyFilterId(id);
    }
  }

  @Mutation
  removeFilter(id: WidgetId): void {
    this.filterRequests.delete(id);
  }

  @Mutation
  removeFilters(ids: WidgetId[]): void {
    ids.forEach(id => this.filterRequests.delete(id));
  }

  @Mutation
  private removeExcludeApplyFilterId(id: WidgetId) {
    this.excludeApplyFilterIds.delete(id);
  }

  @Action
  async init(): Promise<void> {
    await this.initFilterPanels(WidgetModule.widgets);
    await this.initFilterRequests(WidgetModule.allQueryWidgets);
    await this.initInnerFilterRequests(WidgetModule.allQueryWidgets);
    this.initAffectFilterWidgets(WidgetModule.allQueryWidgets);
  }

  @Action
  private async initFilterPanels(widgets: Widget[]): Promise<void> {
    widgets.filter(FilterPanel.isFilterPanel).forEach(panel => this.addFilterPanelInfo(panel));
  }

  @Action
  private async initFilterRequests(widgets: QueryRelatedWidget[]): Promise<void> {
    widgets
      .filter(widget => Filterable.isFilterable(widget.setting) && widget.setting.isEnableFilter() && !ChartInfoUtils.isChartFilterId(widget.id))
      .forEach(filter => {
        const hasDefault = ((filter.setting as any) as Filterable).hasDefaultValue();
        Log.debug('FilterStore::widget is filter::', filter.id, filter, hasDefault);
        if (hasDefault) {
          const defaultCondition: Condition | undefined = ((filter.setting as any) as Filterable).getDefaultCondition()!;
          const filterRequests = new FilterRequest(filter.id, defaultCondition);
          this.setFilterRequest(filterRequests);
        }
      });
    Log.debug('FilterStore::filterRequests::after::init', this.filterRequests);
  }

  @Action
  private async initInnerFilterRequests(widgets: QueryRelatedWidget[]): Promise<void> {
    widgets
      .filter(widget => ChartInfo.isChartInfo(widget) && widget.containChartFilter)
      .forEach(parentWidget => {
        const chartFilter = (parentWidget as ChartInfo).chartFilter!;
        const isFilter = Filterable.isFilterable(chartFilter.setting) && chartFilter.setting.isEnableFilter();
        const hasDefault = Filterable.isFilterable(chartFilter.setting) && chartFilter.setting.hasDefaultValue();
        Log.debug('FilterStore::widget is inner filter::', chartFilter.id, chartFilter);
        if (isFilter && hasDefault) {
          const condition: Condition = ((chartFilter.setting as any) as Filterable).getDefaultCondition()!;
          const filterRequests = new FilterRequest(parentWidget.id, condition);
          this.setInnerFilter(filterRequests);
        }
      });
    Log.debug('FilterStore::innerFilters::after::init', this.innerFilters);
  }

  @Action
  async addFilterWidget(chart: ChartInfo): Promise<void> {
    const isFilter: boolean = Filterable.isFilterable(chart.setting) && chart.setting.isEnableFilter();
    const hasDefault: boolean = Filterable.isFilterable(chart.setting) && chart.setting.hasDefaultValue();
    Log.debug('addFilterWidget::', chart, isFilter, hasDefault);
    if (isFilter && hasDefault) {
      const condition: Condition = ((chart.setting as any) as Filterable).getDefaultCondition()!;
      const filterRequests = new FilterRequest(chart.id, condition);
      this.setFilterRequest(filterRequests);
      await this.applyFilters();
    }
    return Promise.resolve();
  }

  get mainDateFilterRequest(): FilterRequest | null {
    if (this.mainDateCompareRequest) {
      return FilterStoreUtils.toMainDateFilterRequest(this.mainDateCompareRequest) ?? null;
    }
    return null;
  }

  @Mutation
  ignoreWidgetFromFilters(id: WidgetId) {
    this.unAffectByFilters.add(id);
  }

  @Mutation
  applyFilterToWidget(id: WidgetId) {
    this.unAffectByFilters.delete(id);
  }

  @Mutation
  initAffectFilterWidgets(widgets: QueryRelatedWidget[]) {
    const unAffectFilterWidgetIds = widgets.filter(widget => !widget.setting.getChartOption()?.isAffectedByFilter()).map(widget => widget.id);
    const filterWidgetIds = widgets.filter(widget => Filterable.isFilterable(widget.setting) && widget.setting.isEnableFilter()).map(widget => widget.id);
    this.unAffectByFilters = new Set<WidgetId>([...unAffectFilterWidgetIds, ...filterWidgetIds]);
  }

  @Mutation
  setAffectFilterWidget(widget: QueryRelatedWidget) {
    const isFilter = Filterable.isFilterable(widget.setting) && widget.setting.isEnableFilter();
    const unAffectByFilter = !widget.setting.isAffectedByFilter();
    if (isFilter || unAffectByFilter) {
      this.unAffectByFilters.add(widget.id);
    } else {
      this.unAffectByFilters.delete(widget.id);
    }
  }

  /**
   * method will be called when filter change and want to apply to all widgets
   */
  @Action({ rawError: true })
  async applyFilters(): Promise<void> {
    const ids: number[] = WidgetModule.allQueryWidgets.filter(widget => this.isAffectedByFilter(widget.id)).map(widget => widget.id);
    // avoid stuck ui
    await TimeoutUtils.sleep(100);
    await DashboardControllerModule.renderCharts({
      idList: ids,
      useBoost: DashboardModule.isUseBoost
    });
  }
}

export const FilterModule: FilterStore = getModule(FilterStore);
