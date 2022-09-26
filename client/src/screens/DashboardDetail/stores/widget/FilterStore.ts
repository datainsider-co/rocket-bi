/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:00 PM
 */

import router from '@/router/router';
import { QuerySettingModule, WidgetModule } from '@/screens/DashboardDetail/stores';
import { DashboardControllerModule, handleGetMainFilterRequest } from '@/screens/DashboardDetail/stores/controller/DataControllerStore';
import { MainDateCompareRequest } from '@/screens/DashboardDetail/stores/controller/DataStore';
import { DashboardModule, MainDateData } from '@/screens/DashboardDetail/stores/dashboard/DashboardStore';
import { DateRange, Stores } from '@/shared';
import { CalendarData } from '@/shared/models';
import store from '@/store';
import { ChartInfoUtils, DateUtils, FilterUtils, TimeoutUtils } from '@/utils';
import { RouterUtils } from '@/utils/RouterUtils';
import {
  ChartInfo,
  Condition,
  Dashboard,
  DynamicFilter,
  Equatable,
  FieldRelatedCondition,
  FilterRequest,
  FilterWidget,
  MainDateMode,
  QueryRelatedWidget,
  QuerySetting,
  WidgetId
} from '@core/domain';
import { DI } from '@core/modules';
import { DataManager } from '@core/services';
import { Log } from '@core/utils';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';

export class CrossFilterData extends Equatable {
  constructor(readonly activeId: WidgetId, readonly value: string, readonly extraData?: any) {
    super();
  }

  equals(obj: any): boolean {
    return !!obj && obj.activeId === this.activeId && obj.value === this.value;
  }
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.filterStore })
export class FilterStore extends VuexModule {
  mainFilterWidgets: Map<WidgetId, FilterWidget> = new Map<WidgetId, FilterWidget>();
  filterRequests: Map<WidgetId, FilterRequest> = new Map<WidgetId, FilterRequest>();
  innerFilters: Map<WidgetId, FilterRequest> = new Map<WidgetId, FilterRequest>();

  currentCrossFilterData: CrossFilterData | null = null;
  //Main date Filter
  chosenRange: DateRange | null = null;
  mainDateMode: MainDateMode | null = null;

  compareRange: DateRange | null = null;
  // filter in routers
  routerFilters: DynamicFilter[] = [];

  excludeApplyFilterIds: Set<WidgetId> = new Set<WidgetId>();

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

  /*Lấy tất cả filter của 1 widget <br>
  Có 2 trường hợp sẽ chỉ có Inner Filter:
   + TH1: Widget không bị Affect By Filter (Setting của widget)
   + TH2: Widget đó là Filter
   */
  get getAllFilters(): (id: WidgetId) => FilterRequest[] {
    return id => {
      const isChartFilter = ChartInfoUtils.isChartFilterId(id);
      const parentId = isChartFilter ? ChartInfoUtils.generatedChartParentId(id) : id;
      const isAffectByFilter = DashboardControllerModule.isAffectedByFilter(parentId);
      const isFilter = this.excludeApplyFilterIds.has(parentId);
      const filters = [];
      filters.push(this.innerFilters.get(id));
      Log.debug('getAllFilters::isChartFilter::', isChartFilter, '::parentId::', parentId, '::isAffectByFilter::', isAffectByFilter, '::isFilter::', isFilter);
      if (isAffectByFilter && !isFilter) {
        filters.push(
          this.crossFilterRequest,
          ...this.filterRequests.values(),
          ...Array.from(this.mainFilterWidgets.values()).map(widget => widget.toFilterRequest())
        );
      }
      ///remove undefined or null
      return filters.filter((filter): filter is FilterRequest => filter instanceof FilterRequest);
    };
  }

  get crossFilterValue(): string | undefined {
    const condition: FieldRelatedCondition | Condition | undefined = this.crossFilterRequest?.condition;
    return FieldRelatedCondition.isFieldRelatedCondition(condition) ? FilterUtils.getFilterValue(condition) : void 0;
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

  private static getDataManager(): DataManager {
    return DI.get(DataManager);
  }

  @Mutation
  resetCrossFilter(): void {
    this.currentCrossFilterData = null;
  }

  @Action
  handleSetFilter(request: FilterRequest): Promise<void> {
    this.setFilterRequest(request);
    // avoid stuck ui
    return TimeoutUtils.waitAndExecuteAsPromise(() => DashboardControllerModule.handleApplyFilter(), 50);
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
  private setInnerFilter(request: FilterRequest): void {
    this.innerFilters.set(request.filterId, request);
  }

  @Mutation
  private addMainFilter(widget: FilterWidget): void {
    this.mainFilterWidgets.set(widget.id, widget);
  }

  @Mutation
  setMainFilters(widgets: FilterWidget[]): void {
    this.mainFilterWidgets.clear();
    const widgetMap: [WidgetId, FilterWidget][] = widgets.map(widget => [widget.id, widget]);
    this.mainFilterWidgets = new Map<WidgetId, FilterWidget>(widgetMap);
  }

  @Mutation
  removeMainFilter(id: WidgetId): void {
    this.mainFilterWidgets.delete(id);
  }

  @Mutation
  removeChartFilter(id: WidgetId): void {
    this.innerFilters.delete(id);
  }

  @Mutation
  loadLocalMainFilters(dashboard: Dashboard) {
    const localMainFilters = FilterStore.getDataManager().getMainFilters(dashboard.id.toString());
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
        DashboardControllerModule.handleApplyFilter();
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
    // avoid stuck ui
    return TimeoutUtils.waitAndExecuteAsPromise(() => DashboardControllerModule.handleApplyFilter(), 150);
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
    // Avoid standing ui
    return TimeoutUtils.waitAndExecuteAsPromise(async () => {
      await DashboardControllerModule.handleApplyFilter();
      // avoid reload current widget
      this.removeExcludeApplyFilterId(currentActiveId);
    });
  }

  @Action
  handleRemoveFilter(id: WidgetId): Promise<void> {
    this.removeFilter(id);
    return TimeoutUtils.waitAndExecuteAsPromise(async () => {
      await DashboardControllerModule.handleApplyFilter();
      // avoid reload current widget
      this.removeExcludeApplyFilterId(id);
    });
  }

  @Mutation
  removeFilter(id: WidgetId): void {
    this.filterRequests.delete(id);
  }

  @Mutation
  private removeExcludeApplyFilterId(id: WidgetId) {
    this.excludeApplyFilterIds.delete(id);
  }

  @Action
  handleLoadDashboard(): Promise<void> {
    const widgets: QueryRelatedWidget[] = WidgetModule.allQueryWidgets;
    widgets
      .filter(widget => ChartInfo.isChartInfo(widget) && FilterUtils.isFilter(widget) && !ChartInfoUtils.isChartFilterId(widget.id))
      .forEach(filter => {
        Log.debug('FilterStore::widget is filter::', filter.id, filter);
        if (filter.setting.getChartOption()?.options?.default?.setting?.conditions) {
          const condition: Condition = Condition.fromObject(filter.setting.getChartOption()?.options?.default?.setting?.conditions);
          const filterRequests = new FilterRequest(filter.id, condition);
          this.setFilterRequest(filterRequests);
        }
      });
    Log.debug('FilterStore::filterRequests::after::init', this.filterRequests);
    widgets
      .filter(widget => ChartInfo.isChartInfo(widget) && widget.containChartFilter)
      .forEach(parentWidget => {
        const chartFilter = (parentWidget as ChartInfo).chartFilter!;
        Log.debug('FilterStore::widget is inner filter::', chartFilter.id, chartFilter);
        if (chartFilter.setting.getChartOption()?.options?.default?.setting?.conditions) {
          const condition: Condition = Condition.fromObject(chartFilter.setting.getChartOption()?.options?.default?.setting?.conditions);
          const filterRequests = new FilterRequest(parentWidget.id, condition);
          this.setInnerFilter(filterRequests);
        }
      });
    Log.debug('FilterStore::innerFilters::after::init', this.innerFilters);
    return Promise.resolve();
  }

  @Action
  addFilterWidget(widget: ChartInfo): Promise<void> {
    const isFilter: boolean = ChartInfo.isChartInfo(widget) && FilterUtils.isFilter(widget);
    const hasDefault: boolean = widget.setting.getChartOption()?.options?.default?.setting?.conditions != undefined;
    if (isFilter && hasDefault) {
      const condition: Condition = Condition.fromObject(widget.setting.getChartOption()?.options?.default?.setting?.conditions);
      const filterRequests = new FilterRequest(widget.id, condition);
      this.setFilterRequest(filterRequests);
      return TimeoutUtils.waitAndExecuteAsPromise(() => DashboardControllerModule.handleApplyFilter(), 50);
    }
    return Promise.resolve();
  }

  // @Action
  // addInnerFilter(widget: ChartInfo): Promise<void> {
  //   const innerFilter = widget.extraData?.innerFilter;
  //   const isFilter: boolean = ChartInfo.isChartInfo(innerFilter) && FilterUtils.isFilter(innerFilter);
  //   const hasDefault: boolean = innerFilter!.setting.getChartOption()?.options?.default?.setting?.conditions != undefined;
  //   if (isFilter && hasDefault) {
  //     const condition: Condition = Condition.fromObject(innerFilter!.setting.getChartOption()?.options?.default?.setting?.conditions);
  //     const filterRequests = new FilterRequest(widget.id, condition);
  //     this.setInnerFilter(filterRequests);
  //   }
  // }

  get mainDateFilterRequest(): FilterRequest | null {
    if (this.mainDateCompareRequest) {
      return handleGetMainFilterRequest(this.mainDateCompareRequest) ?? null;
    }
    return null;
  }
}

export const FilterModule: FilterStore = getModule(FilterStore);
