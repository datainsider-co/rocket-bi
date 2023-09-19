/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:00 PM
 */

import {
  AbstractTableResponse,
  And,
  ChartInfo,
  Condition,
  ExportType,
  ExportTypeDisplayNames,
  FunctionController,
  PivotTableQuerySetting,
  QueryParameter,
  QueryRelatedWidget,
  QueryRequest,
  QuerySetting,
  TableColumn,
  TableResponse,
  ValueControlType,
  VisualizationResponse,
  Widget,
  WidgetId
} from '@core/common/domain';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { ListUtils, QuerySettingUtils, StringUtils } from '@/utils';
import { ChartDataModule, DashboardModule, FilterModule, QuerySettingModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { Status, Stores } from '@/shared';
import { ZoomModule } from '@/store/modules/ZoomStore';
import { Log } from '@core/utils';
import { Pagination, RowData } from '@/shared/models';
import { cloneDeep } from 'lodash';
import { FilterStoreUtils } from '@/screens/dashboard-detail/stores/widget/FilterStoreUtils';
import { Semaphore } from 'async-mutex';
import Swal from 'sweetalert2';
import FileSaver from 'file-saver';

const CONCURRENCY_REQUEST_SIZE = 7;
const semaphore = new Semaphore(CONCURRENCY_REQUEST_SIZE);

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.DashboardControllerStore })
export class DashboardControllerStore extends VuexModule {
  /**
   * Save all dynamic function of of widget.
   * @type {Map<WidgetId, TableColumn[]>}
   */
  dynamicFunctionMap: Map<WidgetId, TableColumn[]> = new Map();
  get updateDynamicFunctionValue(): (querySetting: QuerySetting) => QuerySetting {
    return querySetting => {
      const dynamicFunctions: TableColumn[] = querySetting.getControlledFunctions();
      //Lấy TableColumn hiện tại tương ứng với dynamic function
      const tableColumnsToReplace = new Map(dynamicFunctions.map(func => [func.dynamicFunctionId!, this.getDynamicFunctions(func.dynamicFunctionId!)]));
      Log.debug('updateDynamicFunctionValue::tableColumnsToReplace::', dynamicFunctions);
      //Set vào query setting
      const cloneQuerySetting = cloneDeep(querySetting);

      cloneQuerySetting.applyDynamicFunctions(tableColumnsToReplace);
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
  get getDynamicFunctions(): (id: WidgetId) => TableColumn[] {
    return id => {
      return this.dynamicFunctionMap.get(id) ?? [];
    };
  }

  @Action
  async init(forceFetch = true): Promise<void> {
    const widgets: QueryRelatedWidget[] = WidgetModule.allQueryWidgets;
    ZoomModule.initZoomLevels(widgets);
    ZoomModule.multiRegisterZoomData(widgets);
    await this.initChartControls(widgets);
    await this.renderCharts({
      idList: widgets.map(widget => widget.id),
      forceFetch: forceFetch,
      useBoost: DashboardModule.isUseBoost
    });
    await this.renderAllInnerFilters(widgets);
  }

  // load all inner filter in dashboard
  @Action
  private async renderAllInnerFilters(widgets: QueryRelatedWidget[]): Promise<void> {
    const innerFilterIds: number[] = widgets
      .filter(widget => ChartInfo.isChartInfo(widget) && widget.chartFilter)
      .map(widget => (widget as ChartInfo).chartFilter!.id);
    await this.renderCharts({
      idList: innerFilterIds,
      useBoost: false
    });
  }

  @Action
  renderChart(payload: { id: WidgetId; forceFetch?: boolean; pagination?: Pagination; useBoost?: boolean }): Promise<void> {
    const { id, forceFetch, pagination, useBoost } = payload;
    const request: QueryRequest = FilterStoreUtils.buildQueryRequest({
      widgetId: id,
      mainDateFilter: FilterModule.mainDateFilterRequest,
      useBoost: useBoost
    });
    if (pagination) request.setPaging(pagination.from, pagination.size);
    if (request.querySetting.canQuery()) {
      return ChartDataModule.handleQueryAndRenderChart({
        chartId: id,
        isForceFetch: forceFetch ?? false,
        request: request
      });
    } else {
      ChartDataModule.setVisualizationResponse({ id: id, data: TableResponse.empty() });
      ChartDataModule.setStatusLoaded(id);
      return Promise.resolve();
    }
  }

  /**
   * render charts with id list. Chart will be render from top to bottom, if chart is not renderable, it will be skipped
   */
  @Action
  async renderCharts(payload: { idList: WidgetId[]; forceFetch?: boolean; pagination?: Pagination; useBoost?: boolean }): Promise<void> {
    try {
      const { idList, forceFetch, pagination, useBoost } = payload;
      if (ListUtils.isEmpty(idList)) {
        return;
      }
      ChartDataModule.setStatuses({ ids: idList, status: forceFetch ? Status.Loading : Status.Updating });
      const sortedIds: number[] = await WidgetModule.sortByPosition(idList);
      const results: Promise<void>[] = sortedIds.map(async widgetId => {
        await semaphore.runExclusive(async () => {
          try {
            await this.renderChart({ id: widgetId, forceFetch, pagination, useBoost });
          } catch (ex) {
            ChartDataModule.setStatusError({ id: widgetId, message: ex.message });
          }
        });
      });
      await Promise.all(results);
    } catch (ex) {
      Log.error('DashboardControllerStore::renderCharts::error', ex);
      ChartDataModule.setStatuses({ ids: payload.idList, status: Status.Error, errorMsg: 'Cannot render chart!' });
    }
  }

  @Mutation
  reset() {
    this.dynamicFunctionMap.clear();
  }

  @Action
  async loadDataWithPagination(payload: { widgetId: number; pagination: Pagination }): Promise<VisualizationResponse> {
    const { widgetId, pagination } = payload;
    QuerySettingModule.applySort({ id: widgetId, sortAsMap: pagination.sortAsMap });
    const request: QueryRequest = await FilterStoreUtils.buildQueryRequest({
      widgetId: widgetId,
      mainDateFilter: FilterModule.mainDateFilterRequest,
      pagination: pagination
    });
    return ChartDataModule.query(request);
  }

  @Action
  async handleExport(payload: { widgetId: number; type: ExportType }): Promise<void> {
    try {
      Swal.fire({
        icon: 'info',
        title: `Exporting ${ExportTypeDisplayNames[payload.type]} file`,
        html: 'Wait a minute...',
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false
      });

      const { widgetId } = payload;
      const request: QueryRequest = await FilterStoreUtils.buildQueryRequest({
        widgetId: widgetId,
        mainDateFilter: FilterModule.mainDateFilterRequest,
        isFlattenPivot: true
      });
      const file = await ChartDataModule.export({ request, type: payload.type });
      const fileName: string = await this.getFileNameByWidgetId(widgetId);
      FileSaver.saveAs(file, `${fileName}.${payload.type}`);
      Swal.close();
    } catch (ex) {
      Swal.hideLoading();
      Swal.fire({
        icon: 'error',
        title: 'Export CSV Error',
        html: ex.message
      });
    }
  }

  @Action
  private getFileNameByWidgetId(id: WidgetId): Promise<string> {
    const widget: Widget | undefined = WidgetModule.findWidgetById(id);
    if (widget && StringUtils.isNotEmpty(widget.name)) {
      const unsignName: string = StringUtils.vietnamese(widget.name);
      return Promise.resolve(StringUtils.toSnakeCase(unsignName));
    } else {
      return Promise.resolve('untitled');
    }
  }

  @Action
  private async initChartControls(widgets: QueryRelatedWidget[]): Promise<void> {
    for (const widget of widgets) {
      await this.loadDynamicControl(widget);
    }
  }

  @Action
  private async loadDynamicControl(widget: QueryRelatedWidget): Promise<void> {
    if (FunctionController.isFunctionController(widget.setting) && widget.setting.isEnableFunctionControl()) {
      await this.replaceDynamicFunction({
        id: widget.id,
        selectedFunctions: widget.setting.getDefaultTableColumns(),
        forceRender: false
      });
    }
  }

  @Mutation
  private setDynamicFunction(payload: { id: WidgetId; tblColumns: TableColumn[] }): void {
    const { id } = payload;
    ///Cập nhật dynamicFunctionId với id của widget đc select
    const tblColumns = cloneDeep(payload.tblColumns).map(column => {
      return column.copyWith({
        isDynamicFunction: true,
        dynamicFunctionId: id
      });
    });
    this.dynamicFunctionMap.set(id, tblColumns);
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
    const currentRequest: QueryRequest = FilterStoreUtils.buildQueryRequest({
      widgetId: id,
      mainDateFilter: FilterModule.mainDateFilterRequest,
      pagination: cloneDeep(pagination)
    });
    currentRequest.querySetting = await this.buildSubRowQuerySetting({
      setting: setting,
      currentRow: currentRow,
      valueKey: valueKey
    });
    currentRequest.setPaging(-1, -1);
    const response: AbstractTableResponse = (await ChartDataModule.query(currentRequest)) as AbstractTableResponse;
    return response.records as any;
  }

  @Action
  private async buildSubRowQuerySetting(payload: { currentRow: RowData; setting: PivotTableQuerySetting; valueKey: string }): Promise<PivotTableQuerySetting> {
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

  /**
   * Hàm xử lí khi Tab Control đổi
   * @param payload.id: Id của widget đang được select
   * @param payload.selectedFunctions: Danh sách các function được select
   * @param payload.forceRender: Có render lại widget hay không
   */
  @Action
  async replaceDynamicFunction(payload: { id: WidgetId; selectedFunctions: TableColumn[]; forceRender: boolean }): Promise<void> {
    const { id, selectedFunctions, forceRender } = payload;
    this.setDynamicFunction({ id: id, tblColumns: selectedFunctions });
    /// Apply cho tất cả widget nào có chart control
    const affectedQueryMap: Map<WidgetId, QuerySetting> = QuerySettingModule.getQueryHasFunctionControlMap(id);
    affectedQueryMap.forEach((setting, widgetId) => {
      ZoomModule.deleteZoomData(widgetId);
      const dynamicFunctionAsMap = new Map([[id, this.dynamicFunctionMap.get(id)!]]);
      setting.applyDynamicFunctions(dynamicFunctionAsMap);
      setting.applyDynamicSortFunction(dynamicFunctionAsMap);
    });

    if (forceRender) {
      await this.renderCharts({
        idList: Array.from(affectedQueryMap.keys()),
        useBoost: DashboardModule.isUseBoost
      });
      const payload = Array.from(affectedQueryMap.keys()).map(widgetId => {
        return { id: widgetId, setting: affectedQueryMap.get(widgetId)! };
      });
      ZoomModule.multiRegisterZoomData(payload);
    }
  }

  // @Action
  // async replaceDynamicValues(payload: { widget: Widget; values: string[]; apply: boolean }): Promise<void> {
  //   const { widget, values, apply } = payload;
  //   const { id } = widget;
  //
  //   const queryParam: QueryParameter | undefined =
  //     ChartInfo.isChartInfo(widget) && widget.setting.isQueryParameter() ? widget.setting.toQueryParameter() : void 0;
  //   this.setDynamicValues({ id: id, values: values });
  //   WidgetModule.allQueryWidgets
  //     .filter(widget => widget.setting.canApplyValueControl(id) || widget.setting.isAffectByQueryParameter(id))
  //     .forEach(queryWidget => {
  //       ///Apply cho tất cả widget nào có Tab control
  //       const existTabControl = queryWidget.setting.canApplyValueControl(id);
  //       if (existTabControl) {
  //         // queryWidget.setting.applyDynamicFilterValues(new Map([[id, this.dynamicFilterValuesMap.get(id)!]]));
  //       }
  //       ///Apply cho tất cả widget nào có Query Param
  //       const existQueryParam = queryParam && queryWidget.setting.isAffectByQueryParameter(id);
  //       if (existQueryParam) {
  //         const cloneParams = cloneDeep(queryWidget.setting.parameters);
  //         cloneParams[queryParam!.displayName] = QuerySetting.formatParamValue(queryParam!.valueType, ListUtils.getHead(values) ?? "");
  //         queryWidget.setting.withQueryParameters(cloneParams);
  //       }
  //       //
  //       if (apply && (existTabControl || existQueryParam)) {
  //         const useBoost = DashboardModule.currentDashboard?.useBoost ?? false;
  //         this.renderChart({ id: queryWidget.id, useBoost: useBoost });
  //       }
  //     });
  // }

  @Action
  async applyDynamicValues(payload: { id: WidgetId; valueMap: Map<ValueControlType, string[]> | undefined; ignoreReRender?: boolean }): Promise<WidgetId[]> {
    QuerySettingModule.setDynamicValues(payload);
    const effectedIds: WidgetId[] = QuerySettingModule.getAffectedIdByControlId(payload.id);
    if (!payload.ignoreReRender && ListUtils.isNotEmpty(effectedIds)) {
      await this.renderCharts({
        idList: effectedIds,
        useBoost: DashboardModule.isUseBoost
      });
    }
    return effectedIds;
  }
}

export const DashboardControllerModule: DashboardControllerStore = getModule(DashboardControllerStore);
