/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:00 PM
 */

import {
  AbstractTableResponse,
  And,
  ChartInfo,
  CompareRequest,
  Condition,
  DIException,
  DynamicFunction,
  DynamicValues,
  FilterRequest,
  PivotTableQuerySetting,
  QueryRelatedWidget,
  QueryRequest,
  QuerySetting,
  TableColumn,
  TableResponse,
  UserProfile,
  VisualizationResponse,
  VizSettingType,
  Widget,
  WidgetId
} from '@core/domain';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { ListUtils, QuerySettingUtils } from '@/utils';
import {
  _ChartStore,
  DashboardModule,
  FilterModule,
  MainDateCompareRequest,
  QuerySettingModule,
  RenderControllerModule,
  WidgetModule
} from '@/screens/DashboardDetail/stores';
import { CompareResolvers, DashboardService } from '@core/services';
import { Inject } from 'typescript-ioc';
import { Stores } from '@/shared';
import { ZoomModule } from '@/store/modules/zoom.store';
import { ConditionUtils, Log } from '@core/utils';
import { Pagination, RowData } from '@/shared/models';
import { cloneDeep } from 'lodash';

export const getCompareRequest = (querySetting: QuerySetting, mainDateData: MainDateCompareRequest): CompareRequest | undefined => {
  if (mainDateData.compareRange && mainDateData.currentRange) {
    const chartType = querySetting.getChartOption()?.className ?? VizSettingType.TableSetting;
    return CompareResolvers.mainDateCompareResolver()
      .withField(mainDateData.field)
      .withChartType(chartType)
      .withCurrentRange(mainDateData.currentRange)
      .withCompareRange(mainDateData.compareRange)
      .build();
  } else {
    return void 0;
  }
};

export const handleGetMainFilterRequest = (mainDateCompareRequest: MainDateCompareRequest): FilterRequest | undefined => {
  if (mainDateCompareRequest.currentRange && mainDateCompareRequest.mainDateMode) {
    const condition = ConditionUtils.buildMainDateCondition(
      mainDateCompareRequest.field,
      mainDateCompareRequest.currentRange,
      mainDateCompareRequest.mainDateMode
    );
    if (condition) {
      return new FilterRequest(-1, condition);
    } else {
      return void 0;
    }
  } else {
    return void 0;
  }
};

const getChartQueryRequest = (payload: {
  widgetId: number;
  mainDateFilter: FilterRequest | null;
  pagination?: Pagination;
  useBoost?: boolean;
}): QueryRequest => {
  const { widgetId, pagination, useBoost, mainDateFilter } = payload;
  const filters: FilterRequest[] = FilterModule.getAllFilters(widgetId);
  const querySetting: QuerySetting = QuerySettingModule.buildQuerySetting(widgetId);

  // if (mainDateCompareRequest) {
  //   if (!getCompareRequest(querySetting, mainDateCompareRequest)) {
  //     const mainFilter = handleGetMainFilterRequest(mainDateCompareRequest);
  //     if (mainFilter) {
  //       filters.push(mainFilter);
  //     }
  //   }
  // }

  if (mainDateFilter) {
    filters.push(mainDateFilter);
  }

  return QueryRequest.buildQueryRequest(querySetting, filters, pagination, useBoost, DashboardModule.id);
};

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.dataController })
export class DataControllerStore extends VuexModule {
  unAffectByFilters: Set<WidgetId> = new Set<WidgetId>();
  dynamicFunctions: Map<WidgetId, TableColumn[]> = new Map();
  dynamicFilter: Map<WidgetId, string[]> = new Map();
  @Inject
  private dashboardService!: DashboardService;

  get isAffectedByFilter(): (id: WidgetId) => boolean {
    return id => {
      return !this.unAffectByFilters.has(id);
    };
  }

  get updateDynamicFunctionValue(): (querySetting: QuerySetting) => QuerySetting {
    return querySetting => {
      const allDynamicFnc = querySetting.getAllDynamicFunction();
      Log.debug('updateDynamicFunctionValue::allDynamicFnc::', allDynamicFnc);
      //Lấy TableColumn hiện tại tương ứng với dynamic function
      const tableColumnsToReplace = new Map(
        allDynamicFnc.map(func => [func.dynamicFunctionId!, this.getCurrentTableColumnOfDynamicFunction(func.dynamicFunctionId!)])
      );
      Log.debug('updateDynamicFunctionValue::tableColumnsToReplace::', allDynamicFnc);
      //Set vào query setting
      const cloneQuerySetting = cloneDeep(querySetting);

      cloneQuerySetting.setDynamicFunctions(tableColumnsToReplace);
      Log.debug('updateDynamicFunctionValue::cloneQuerySetting::', cloneQuerySetting);
      return cloneQuerySetting;
    };
  }

  ///Hàm get ra TableColumn của DynamicFunction đang đc select trong Dashboard
  ///TH 1: Nếu có DynamicFunction nhưng không có value => return value đầu tiên
  ///TH 2: Nếu không có DynamicFunction => return undefined
  ///Ví dụ: DynamicFunction có id = 123, có 2 TableColumn là [Sum TotalProfit], [Count TotalCost]; trong dashboard đang chọn là Count TotalCost
  ///Input: id = 123
  ///Output: Count TotalCost
  get getCurrentTableColumnOfDynamicFunction(): (id: WidgetId) => TableColumn[] {
    return id => {
      return this.dynamicFunctions.get(id) ?? [];
    };
  }

  @Action({ rawError: true })
  async handleApplyFilter(): Promise<void> {
    const mainDateFilter: FilterRequest | null = FilterModule.mainDateFilterRequest;
    const chartInfos: QueryRelatedWidget[] = WidgetModule.allQueryWidgets;
    if (chartInfos && ListUtils.isNotEmpty(chartInfos)) {
      RenderControllerModule.reset();
      RenderControllerModule.readyRequestRender();

      const allResults: Promise<void>[] = chartInfos.map(widget => {
        const isExcludeApplyFilter = FilterModule.excludeApplyFilterIds.has(widget.id);
        const isAffectedByFilter = !this.unAffectByFilters.has(widget.id);
        if (!isExcludeApplyFilter && isAffectedByFilter) {
          const useBoost = DashboardModule.currentDashboard?.useBoost ?? false;
          const request: QueryRequest = getChartQueryRequest({
            widgetId: widget.id,
            mainDateFilter: mainDateFilter,
            useBoost: useBoost
          });
          if (request.querySetting.canQuery()) {
            return _ChartStore.renderChart({
              chartId: widget.id,
              forceFetch: false,
              request: request
            });
          } else {
            const emptyResponse = TableResponse.empty();
            _ChartStore.addData({ id: widget.id, data: emptyResponse });
            _ChartStore.setStatusRendered(widget.id);
            return Promise.resolve();
          }
        } else {
          _ChartStore.refresh(widget.id);
          return Promise.resolve();
        }
      });
      await Promise.all(allResults);
    }
  }

  @Action
  async renderAllChartOrFilters(payload?: { forceFetch?: boolean; useBoost?: boolean }): Promise<void> {
    const widgets: QueryRelatedWidget[] = WidgetModule.allQueryWidgets;
    if (widgets && ListUtils.isNotEmpty(widgets)) {
      ZoomModule.loadZoomLevels(widgets);
      ZoomModule.registerMultiZoomData(widgets);
      const allChartResponse: Promise<void>[] = widgets.map(widget => {
        return this.renderChartOrFilter({
          widget: widget,
          forceFetch: payload?.forceFetch ?? true,
          useBoost: payload?.useBoost ?? false
        });
      });
      await Promise.all(allChartResponse);
    }
  }

  ///Load tất cả Chart Filter của các chart info trong dashboard
  @Action
  async renderAllChartFilter(): Promise<void> {
    const chartFilters = WidgetModule.allQueryWidgets
      .filter(widget => ChartInfo.isChartInfo(widget) && !!widget.chartFilter)
      .map(widget => {
        const chartFilter: ChartInfo = (widget as ChartInfo).chartFilter!;
        return this.renderChartOrFilter({
          widget: chartFilter,
          forceFetch: true
        });
      });
    await Promise.all(chartFilters);
  }

  @Action
  renderChartOrFilter(payload: { widget: QueryRelatedWidget; forceFetch?: boolean; useBoost?: boolean }): Promise<void> {
    const { widget, forceFetch, useBoost } = payload;
    const isNotQueryWidget = !widget.setting.canQuery();
    if (isNotQueryWidget) {
      const emptyResponse = TableResponse.empty();
      _ChartStore.addData({ id: widget.id, data: emptyResponse });
      _ChartStore.setStatusRendered(widget.id);
      return Promise.resolve();
    } else {
      const request: QueryRequest = getChartQueryRequest({
        widgetId: widget.id,
        mainDateFilter: FilterModule.mainDateFilterRequest
      });

      return _ChartStore.renderChart({ chartId: widget.id, forceFetch: forceFetch ?? false, request: request });
    }
  }

  @Action
  renderChart(payload: { id: WidgetId; forceFetch?: boolean; pagination?: Pagination }): Promise<void> {
    const { id, forceFetch, pagination } = payload;
    const request: QueryRequest = getChartQueryRequest({
      widgetId: id,
      mainDateFilter: FilterModule.mainDateFilterRequest
    });
    if (pagination) request.setPaging(pagination.from, pagination.size);
    return _ChartStore.renderChart({ chartId: id, forceFetch: forceFetch ?? false, request: request });
  }

  @Mutation
  reset() {
    this.unAffectByFilters.clear();
    this.dynamicFunctions.clear();
  }

  @Mutation
  setDashboardId(id: number) {
    _ChartStore.setDashboardId(id);
  }

  @Action
  handleError(ex: any) {
    Log.error('Dashboard::Store::ERROR', ex);
    if (ex instanceof DIException) {
      this.setError(ex);
    } else {
      this.setError(new DIException('Error, try a again'));
    }
  }

  @Mutation
  setError(exception: DIException) {
    DashboardModule.showError(exception.message);
  }

  @Action
  async loadDataWithPagination(payload: { widgetId: number; pagination: Pagination }): Promise<VisualizationResponse> {
    const { widgetId, pagination } = payload;
    QuerySettingModule.applySort({ id: widgetId, sortAsMap: pagination.sortAsMap });
    const request: QueryRequest = await getChartQueryRequest({
      widgetId: widgetId,
      mainDateFilter: FilterModule.mainDateFilterRequest,
      pagination: pagination
    });
    return _ChartStore.query(request);
  }

  @Action
  async ignoreWidgetFromFilters(widget: ChartInfo) {
    this.unAffectByFilters.add(widget.id);
    return await this.renderChartOrFilter({ widget: widget, forceFetch: true });
  }

  @Action
  async applyFilterToWidget(widget: ChartInfo) {
    this.unAffectByFilters.delete(widget.id);
    return await this.renderChartOrFilter({ widget: widget, forceFetch: true });
  }

  @Mutation
  initAffectFilterWidgets(widgets: QueryRelatedWidget[]) {
    const unAffectFilterWidgetIds = widgets.filter(widget => !widget.setting.getChartOption()?.isAffectedByFilter()).map(widget => widget.id);
    this.unAffectByFilters = new Set<WidgetId>(unAffectFilterWidgetIds);
  }

  @Action
  async initTabControl(widgets: QueryRelatedWidget[]) {
    widgets.forEach(widget => {
      if (DynamicFunction.isFunctionControl(widget.setting) && widget.setting.enableDynamicFunction()) {
        this.replaceDynamicFunction({ widget: widget, selected: widget.setting.getDefaultFunctions(), apply: false });
      } else if (DynamicValues.isValuesControl(widget.setting) && widget.setting.enableDynamicValues()) {
        this.replaceDynamicFilter({ widget: widget, values: widget.setting.getDefaultValues(), apply: false });
      }
    });
  }

  @Mutation
  initDynamicValues(widgets: Widget[]) {
    const valuesAsTupe = widgets
      .filter(widget => ChartInfo.isChartInfo(widget) && DynamicValues.isValuesControl(widget.setting))
      .map(widget => {
        const id = widget.id;
        const values: string[] = (((widget as ChartInfo).setting as unknown) as DynamicValues).getDefaultValues();
        return [id, values];
      });
    this.dynamicFilter = new Map<WidgetId, string[]>(valuesAsTupe as any);
    ///Apply cho tất cả widget nào có Tab control
    Array.from(this.dynamicFilter.keys()).forEach(id => {
      WidgetModule.allQueryWidgets
        .filter(widget => widget.setting.affectByDynamicCondition(id))
        .forEach(widget => {
          widget.setting.setDynamicFilter(new Map([[id, this.dynamicFilter.get(id)!]]));
        });
    });
  }

  @Mutation
  setAffectFilterWidget(widget: QueryRelatedWidget) {
    if (widget.setting.getChartOption()?.isAffectedByFilter()) {
      this.unAffectByFilters.delete(widget.id);
    } else {
      this.unAffectByFilters.add(widget.id);
    }
  }

  @Mutation
  setDynamicFunction(payload: { id: WidgetId; tblColumns: TableColumn[] }) {
    const { id } = payload;
    ///Cập nhật dynamicFunctionId với id của widget đc select
    const tblColumns = cloneDeep(payload.tblColumns).map(column => {
      return column.copyWith({
        isDynamicFunction: true,
        dynamicFunctionId: id
      });
    });
    this.dynamicFunctions.set(id, tblColumns);
  }

  @Mutation
  setDynamicFilter(payload: { id: WidgetId; values: string[] }) {
    const { id, values } = payload;
    this.dynamicFilter.set(id, values);
  }

  @Action
  async loadSubRows(payload: {
    id: WidgetId;
    pagination: Pagination;
    currentRow: RowData;
    setting: PivotTableQuerySetting;
    valueKey: string;
  }): Promise<RowData[]> {
    const { id, setting, currentRow, pagination, valueKey } = payload;
    const currentRequest: QueryRequest = getChartQueryRequest({
      widgetId: id,
      mainDateFilter: FilterModule.mainDateFilterRequest,
      pagination: cloneDeep(pagination)
    });
    currentRequest.querySetting = await this.buildSubRowQuerySetting({ setting: setting, currentRow: currentRow, valueKey: valueKey });
    currentRequest.setPaging(-1, -1);
    const response: AbstractTableResponse = (await _ChartStore.query(currentRequest)) as AbstractTableResponse;
    return response.records as any;
  }

  @Action
  async buildSubRowQuerySetting(payload: { currentRow: RowData; setting: PivotTableQuerySetting; valueKey: string }): Promise<PivotTableQuerySetting> {
    const { currentRow, setting, valueKey } = payload;
    const currentLevel = currentRow.depth ?? 0;
    const displayName: string = ListUtils.getHead(setting.rows)?.name ?? '';
    const clonedSetting = cloneDeep(setting);
    const equalConditions: Condition[] = QuerySettingUtils.buildEqualConditions(clonedSetting.rows, currentRow, valueKey);
    clonedSetting.filters.push(new And(equalConditions));
    const nextFunction = clonedSetting.rows[currentLevel + 1];
    nextFunction.name = displayName;
    clonedSetting.rows = [nextFunction];
    return clonedSetting;
  }

  ///Hàm xử lí khi Tab Control đổi
  @Action
  async replaceDynamicFunction(payload: { widget: Widget; selected: TableColumn[]; apply: boolean }) {
    const { widget, selected, apply } = payload;
    const { id } = widget;
    Log.debug('replaceDynamicFunction::', payload);
    this.setDynamicFunction({ id: id, tblColumns: selected });
    ///Apply cho tất cả widget nào có Tab control
    WidgetModule.allQueryWidgets
      .filter(widget => widget.setting.affectByDynamicFunction(id))
      .forEach(widget => {
        widget.setting.setDynamicFunctions(new Map([[id, this.dynamicFunctions.get(id)!]]));
        if (apply) {
          const useBoost = DashboardModule.currentDashboard?.useBoost ?? false;
          this.renderChartOrFilter({ widget: widget, useBoost: useBoost });
        }
      });
  }

  @Action
  async replaceDynamicFilter(payload: { widget: Widget; values: string[]; apply: boolean }) {
    const { widget, values, apply } = payload;
    const { id } = widget;
    this.setDynamicFilter({ id: id, values: values });
    ///Apply cho tất cả widget nào có Tab control
    WidgetModule.allQueryWidgets
      .filter(widget => widget.setting.affectByDynamicCondition(id))
      .forEach(widget => {
        widget.setting.setDynamicFilter(new Map([[id, this.dynamicFilter.get(id)!]]));
        const useBoost = DashboardModule.currentDashboard?.useBoost ?? false;
        if (apply) {
          this.renderChartOrFilter({ widget: widget, useBoost: useBoost });
        }
      });
  }
}

export const DashboardControllerModule: DataControllerStore = getModule(DataControllerStore);
