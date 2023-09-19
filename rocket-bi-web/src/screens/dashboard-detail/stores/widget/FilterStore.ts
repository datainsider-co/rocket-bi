/* eslint-disable @typescript-eslint/no-use-before-define */
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
  InternalFilter,
  Equatable,
  FilterableSetting,
  GroupFilter,
  FilterRequest,
  FilterWidget,
  MainDateMode,
  QueryRelatedWidget,
  QuerySetting,
  Widget,
  WidgetId,
  DashboardId,
  MapItem,
  ValueControlType
} from '@core/common/domain';
import { Log } from '@core/utils';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { FilterStoreUtils } from '@/screens/dashboard-detail/stores/widget/FilterStoreUtils';
import { DataManager } from '@core/common/services';

interface CrossFilterExtraData {
  map?: MapItem;
}

export class CrossFilterData extends Equatable {
  constructor(readonly activeId: WidgetId, readonly value: string, readonly extraData?: CrossFilterExtraData) {
    super();
  }

  equals(obj: any): boolean {
    return !!obj && obj.activeId === this.activeId && obj.value === this.value;
  }
}

export class GroupFilterInfo {
  panelId: WidgetId;
  filterRequestAsMap: Map<WidgetId, FilterRequest>;
  removedFilterIdAsSet: Set<WidgetId>;
  /**
   * Key: is widget id
   * Value: Map contains value to apply dynamic value, undefined if widget will remove value
   */
  crossFilterValueMap: Map<WidgetId, Map<ValueControlType, string[]> | undefined>;

  constructor(
    panelId: WidgetId,
    filterRequests: Map<WidgetId, FilterRequest>,
    removedFilters: Set<WidgetId>,
    filterValueMap: Map<WidgetId, Map<ValueControlType, string[]>>
  ) {
    this.panelId = panelId;
    this.filterRequestAsMap = filterRequests;
    this.removedFilterIdAsSet = removedFilters;
    this.crossFilterValueMap = filterValueMap;
  }

  static empty(panelId: WidgetId): GroupFilterInfo {
    return new GroupFilterInfo(panelId, new Map(), new Set(), new Map());
  }

  static fromRequest(panelId: WidgetId, request: FilterRequest): GroupFilterInfo {
    return new GroupFilterInfo(panelId, new Map([[request.filterId, request]]), new Set(), new Map<WidgetId, Map<ValueControlType, string[]>>());
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

  setFilterValueMap(widgetId: WidgetId, valueMap?: Map<ValueControlType, string[]>) {
    this.crossFilterValueMap.set(widgetId, valueMap);
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
  mainFilterRequestMap: Map<WidgetId, FilterRequest> = new Map<WidgetId, FilterRequest>();
  innerFilterRequestMap: Map<WidgetId, FilterRequest> = new Map<WidgetId, FilterRequest>();
  groupFilterMap: Map<WidgetId, GroupFilterInfo> = new Map<WidgetId, GroupFilterInfo>();

  // Main date Filter value it is save in memory.
  chosenRange: DateRange | null = null;
  mainDateMode: MainDateMode | null = null;
  // filter in routers
  routerFilters: InternalFilter[] = [];
  /**
   * all widget ignore filter.
   * if widget is in this list, it will not be affected by filter
   */
  unAffectByFilters: Set<WidgetId> = new Set<WidgetId>();

  get canApplyFilter(): (id: WidgetId) => boolean {
    return id => {
      return !this.unAffectByFilters.has(id);
    };
  }

  /*Lấy tất cả filter của 1 widget <br>
  Có 1 trường hợp sẽ chỉ có Inner Filter:
   + TH1: Widget không bị Affect By Filter (Setting của widget)
   */
  get getFilters(): (id: WidgetId) => FilterRequest[] {
    return id => {
      const isInnerFilter: boolean = ChartInfoUtils.isInnerFilterById(id);
      const parentId: number = isInnerFilter ? ChartInfoUtils.revertParentId(id) : id;
      const canApplyFilter: boolean = this.canApplyFilter(parentId);
      const filters = [];
      filters.push(this.innerFilterRequestMap.get(id));
      Log.debug('getAllFilters::isChartFilter::', isInnerFilter, '::parentId::', parentId, '::isAffectByFilter::', canApplyFilter, '::isFilter::');
      if (canApplyFilter) {
        /// All filter request not me
        const activeFilters = Array.from(this.mainFilterRequestMap.values()).filter(request => request.filterId !== id);
        filters.push(...activeFilters);
      }
      ///remove undefined or null
      return filters.filter((filter): filter is FilterRequest => filter !== undefined && filter !== null);
    };
  }

  @Mutation
  addGroupFilter(groupFilter: GroupFilter): void {
    const groupInfo: GroupFilterInfo = GroupFilterInfo.empty(groupFilter.id);
    this.groupFilterMap.set(groupInfo.panelId, groupInfo);
  }

  @Mutation
  removeGroupFilter(panelId: WidgetId) {
    if (!this.groupFilterMap.has(panelId)) {
      throw new DIException(`Filter panel ${panelId} is not found!`);
    } else {
      this.groupFilterMap.delete(panelId);
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
  addFilterRequest(request: FilterRequest): void {
    this.mainFilterRequestMap.set(request.filterId, request);
    this.unAffectByFilters.add(request.filterId);
  }

  @Mutation
  addFilterRequests(requests: FilterRequest[]): void {
    requests.forEach(request => {
      this.mainFilterRequestMap.set(request.filterId, request);
      this.unAffectByFilters.add(request.filterId);
    });
  }

  @Mutation
  pushFilterToGroup(payload: { filterPanelId: WidgetId; request: FilterRequest }): void {
    const { filterPanelId, request } = payload;
    if (!this.groupFilterMap.has(filterPanelId)) {
      const group = GroupFilterInfo.empty(filterPanelId);
      this.groupFilterMap.set(filterPanelId, group);
    }
    this.groupFilterMap.get(filterPanelId)!.setRequest(request);
    this.groupFilterMap = new Map(this.groupFilterMap);
    this.unAffectByFilters.add(request.filterId);
  }

  @Mutation
  pushFilterValueToGroup(payload: { groupId: WidgetId; widgetId: WidgetId; valueMap?: Map<ValueControlType, string[]> }): void {
    const { groupId, valueMap, widgetId } = payload;
    if (!this.groupFilterMap.has(groupId)) {
      const group = GroupFilterInfo.empty(groupId);
      this.groupFilterMap.set(groupId, group);
    }
    this.groupFilterMap.get(groupId)!.setFilterValueMap(widgetId, valueMap);
    this.groupFilterMap = new Map(this.groupFilterMap);
  }

  @Mutation
  removeFilterFromGroup(payload: { panelId: WidgetId; requestId: WidgetId }): void {
    const { panelId, requestId } = payload;
    if (this.groupFilterMap.has(panelId)) {
      this.groupFilterMap.get(panelId)!.removeRequest(requestId);
      this.groupFilterMap = new Map(this.groupFilterMap);
    }
  }

  @Mutation
  private setInnerFilter(request: FilterRequest): void {
    this.innerFilterRequestMap.set(request.filterId, request);
  }

  @Action
  async setLocalFilters(widgets: FilterWidget[]): Promise<void> {
    for (const widget of widgets) {
      const request = widget.toFilterRequest();
      if (request) {
        this.addFilterRequest(request);
      } else {
        this.removeFilterRequest(widget.id);
        this.removeIgnoreApplyFilterById(widget.id);
      }
    }
  }

  @Mutation
  removeChartFilter(id: WidgetId): void {
    this.innerFilterRequestMap.delete(id);
  }

  @Action
  async loadLocalFilters(id: DashboardId): Promise<void> {
    const localFilters: InternalFilter[] = DataManager.getLocalFilters(String(id));
    const listFilterInRouter: InternalFilter[] = RouterUtils.getFilters(router.currentRoute);
    this.setRouterFilters(listFilterInRouter);
    await this.setLocalFilters(localFilters.concat(listFilterInRouter));
  }

  @Mutation
  reset() {
    this.mainFilterRequestMap.clear();
    // Reset Main date filter
    this.chosenRange = null;
    this.routerFilters = [];
    this.groupFilterMap.clear();
    this.unAffectByFilters.clear();
  }

  @Mutation
  loadDateRange(payload: MainDateData): void {
    const { chosenDateRange, mode } = payload;
    this.mainDateMode = mode;
    if (mode == MainDateMode.custom) {
      this.chosenRange = chosenDateRange!;
    } else {
      this.chosenRange = DateUtils.getDateRange(mode);
    }
  }

  @Mutation
  setChosenRange(range: DateRange | null) {
    this.chosenRange = range;
  }

  @Mutation
  setMainDateData(calendar: CalendarData | null): void {
    Log.debug('FilterStore::setMainDateData::', calendar);
    this.chosenRange = calendar?.chosenDateRange ?? null;
    this.mainDateMode = calendar?.filterMode ?? null;
  }

  @Mutation
  removeMainDateData(): void {
    this.chosenRange = null;
    this.mainDateMode = null;
  }

  @Mutation
  setRouterFilters(routerFilters: InternalFilter[]) {
    this.routerFilters = routerFilters;
  }

  @Mutation
  removeFilterRequest(id: WidgetId): void {
    this.mainFilterRequestMap.delete(id);
  }

  @Mutation
  removeFilterRequests(ids: WidgetId[]): void {
    ids.forEach(id => this.mainFilterRequestMap.delete(id));
  }

  @Mutation
  removeIgnoreApplyFilterById(id: WidgetId) {
    this.unAffectByFilters.delete(id);
  }

  @Action
  async init(): Promise<void> {
    await this.initGroupFilter(WidgetModule.widgets);
    await this.initMainFilterRequests(WidgetModule.allQueryWidgets);
    await this.initInnerFilterRequests(WidgetModule.allQueryWidgets);
    this.initAffectFilterWidgets(WidgetModule.allQueryWidgets);
  }

  @Action
  private async initGroupFilter(widgets: Widget[]): Promise<void> {
    widgets.filter(GroupFilter.isGroupFilter).forEach(panel => this.addGroupFilter(panel));
  }

  @Action
  private async initMainFilterRequests(widgets: QueryRelatedWidget[]): Promise<void> {
    widgets
      .filter(widget => FilterableSetting.isFilterable(widget.setting) && widget.setting.isEnableFilter() && !ChartInfoUtils.isInnerFilterById(widget.id))
      .forEach(widget => {
        const filterSetting = (widget.setting as any) as FilterableSetting;
        const hasDefault: boolean = filterSetting.hasDefaultCondition();
        if (hasDefault) {
          const defaultCondition: Condition | undefined = filterSetting.getDefaultCondition()!;
          const filterRequests: FilterRequest = new FilterRequest(widget.id, defaultCondition);
          this.addFilterRequest(filterRequests);
        }
      });
    Log.debug('FilterStore::filterRequests::after::init', this.mainFilterRequestMap);
  }

  @Action
  private async initInnerFilterRequests(widgets: QueryRelatedWidget[]): Promise<void> {
    widgets
      .filter(widget => ChartInfo.isChartInfo(widget) && widget.hasInnerFilter)
      .forEach(parentWidget => {
        const innerChart: ChartInfo = (parentWidget as ChartInfo).chartFilter!;
        const isFilter: boolean = FilterableSetting.isFilterable(innerChart.setting);
        const hasDefault: boolean = FilterableSetting.isFilterable(innerChart.setting) && innerChart.setting.hasDefaultCondition();
        Log.debug('FilterStore::widget is inner filter::', innerChart.id, isFilter, hasDefault);
        if (isFilter && hasDefault) {
          const condition: Condition = ((innerChart.setting as any) as FilterableSetting).getDefaultCondition()!;
          const filterRequests = new FilterRequest(parentWidget.id, condition);
          this.setInnerFilter(filterRequests);
        }
      });
    Log.debug('FilterStore::innerFilters::after::init', this.innerFilterRequestMap);
  }

  @Action
  async addFilterWidget(chart: ChartInfo): Promise<void> {
    const isFilter: boolean = FilterableSetting.isFilterable(chart.setting) && chart.setting.isEnableFilter();
    const hasDefault: boolean = FilterableSetting.isFilterable(chart.setting) && chart.setting.hasDefaultCondition();
    Log.debug('addFilterWidget::', chart, isFilter, hasDefault);
    if (isFilter && hasDefault) {
      const condition: Condition = ((chart.setting as any) as FilterableSetting).getDefaultCondition()!;
      const filterRequests = new FilterRequest(chart.id, condition);
      this.addFilterRequest(filterRequests);
      await this.applyFilters();
    }
    return Promise.resolve();
  }

  /**
   * @deprecated remove as soon as possible. Method always return null, because it related with chart control
   */
  get mainDateFilterRequest(): FilterRequest | null {
    // if (this.mainDateCompareRequest) {
    //   return FilterStoreUtils.toMainDateFilterRequest(this.mainDateCompareRequest) ?? null;
    // }
    return null;
  }

  @Mutation
  ignoreApplyFilterToWidget(id: WidgetId) {
    this.unAffectByFilters.add(id);
  }

  @Mutation
  applyFilterToWidget(id: WidgetId) {
    this.unAffectByFilters.delete(id);
  }

  @Mutation
  initAffectFilterWidgets(widgets: QueryRelatedWidget[]) {
    const unAffectFilterWidgetIds = widgets.filter(widget => !widget.setting.getChartOption()?.isAffectedByFilter()).map(widget => widget.id);
    const filterWidgetIds = widgets
      .filter(widget => FilterableSetting.isFilterable(widget.setting) && widget.setting.isEnableFilter())
      .map(widget => widget.id);
    this.unAffectByFilters = new Set<WidgetId>([...unAffectFilterWidgetIds, ...filterWidgetIds]);
  }

  @Mutation
  setAffectFilterWidget(widget: QueryRelatedWidget): void {
    const isFilter = FilterableSetting.isFilterable(widget.setting) && widget.setting.isEnableFilter();
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
    const affectedIds: number[] = WidgetModule.allQueryWidgets.filter(widget => this.canApplyFilter(widget.id)).map(widget => widget.id);
    // avoid stuck ui
    await TimeoutUtils.sleep(100);
    await DashboardControllerModule.renderCharts({
      idList: affectedIds,
      useBoost: DashboardModule.isUseBoost
    });
  }
}

export const FilterModule: FilterStore = getModule(FilterStore);
