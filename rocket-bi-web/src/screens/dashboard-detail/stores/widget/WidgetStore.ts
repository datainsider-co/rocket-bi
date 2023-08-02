/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:07 PM
 */

import { cloneDeep } from 'lodash';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import {
  ChartInfo,
  DashboardId,
  DIMap,
  ImageWidget,
  Position,
  QueryParameter,
  TabControl,
  TabWidget,
  Widget,
  WidgetId,
  Widgets
} from '@core/common/domain/model';
import store from '@/store';
import { DashboardModule } from '@/screens/dashboard-detail/stores/dashboard/DashboardStore';
import { Inject } from 'typescript-ioc';
import { DashboardService } from '@core/common/services';
import { Stores, WidgetPosition } from '@/shared';
import { DIException } from '@core/common/domain/exception';
import { Vue } from 'vue-property-decorator';
import { ChartUtils, ListUtils, MapUtils, PositionUtils } from '@/utils';
import { TrackingService } from '@core/tracking/service/TrackingService';
import { QueryRelatedWidget } from '@core/common/domain/model/widget/chart/QueryRelatedWidget';
import { WidgetAction } from '@core/tracking/domain/TrackingDataType';
import { Log } from '@core/utils/Log';
import { PopupUtils } from '@/utils/PopupUtils';

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.WidgetStore })
class WidgetStore extends VuexModule {
  widgets: Widget[] = [];
  mapPosition: DIMap<Position> = {};
  //Dùng để lưu giá trị hiện tại của Tree Filter, tránh để reload lại mất state hiện tại
  expandedKeysAsMap: Map<WidgetId, string[]> = new Map<WidgetId, string[]>();
  selectedKeysAsMap: Map<WidgetId, string[]> = new Map<WidgetId, string[]>();

  // get allCharts(): ChartInfo[] {
  //   return this.widgets.filter((widget): widget is ChartInfo => widget instanceof ChartInfo);
  // }
  @Inject
  private dashboardService!: DashboardService;
  @Inject
  private trackingService!: TrackingService;

  get allQueryWidgets(): QueryRelatedWidget[] {
    return this.widgets.filter((widget): widget is QueryRelatedWidget => widget.className == Widgets.Chart);
  }
  get allTabControls(): TabControl[] {
    return this.widgets.filter(widget => TabControl.isTabControl(widget) && widget.isControl()) as any;
  }

  get currentMaxZIndex(): number {
    return PositionUtils.getMaxZIndex(this.mapPosition);
  }

  get widgetAsMap(): DIMap<Widget> {
    const widgets = this.widgets || [];
    const widgetAsMap: DIMap<Widget> = {};
    widgets.forEach((value, key) => {
      widgetAsMap[value.id] = value;
    });
    return widgetAsMap;
  }

  get getTabsContainWidget(): (id: WidgetId) => Widget[] {
    return id => this.widgets.filter(widget => TabWidget.isTabWidget(widget) && widget.allWidgets.includes(id));
  }

  get findWidgetById(): (id: WidgetId) => Widget | undefined {
    return (id: WidgetId) => this.widgets.find(widget => widget.id === id);
  }

  ///Những widget trong dashboard nhưng không nằm trong tab nào
  get widgetInDashboard(): Widget[] {
    const widgetIdsInTab: WidgetId[] = this.widgets.filter(widget => TabWidget.isTabWidget(widget)).flatMap(tab => (tab as TabWidget).allWidgets);
    return this.widgets.filter(widget => !widgetIdsInTab.includes(widget.id));
  }

  get positionsInDashboard(): DIMap<Position> {
    const positions: DIMap<Position> = {};
    this.widgetInDashboard.forEach(widget => {
      if (this.mapPosition[widget.id]) {
        positions[widget.id] = this.mapPosition[widget.id];
      }
    });
    return positions;
  }

  get getPosition() {
    return (widgetId: number) => {
      return this.mapPosition[widgetId];
    };
  }

  @Mutation
  setWidgets(widgets: Widget[]) {
    this.widgets = widgets;
    const chartFilters: ChartInfo[] = widgets
      .filter(widget => ChartInfo.isChartInfo(widget) && widget.containChartFilter)
      .map(widget => (widget as ChartInfo).chartFilter!);
    this.widgets.push(...chartFilters);
  }

  @Mutation
  setMapPosition(mapPosition: DIMap<Position>) {
    this.mapPosition = mapPosition;
  }

  @Mutation
  addWidget(payload: WidgetPosition) {
    const { position, widget } = payload;
    const id = widget.id;
    this.widgets.push(widget);
    Vue.set(this.mapPosition, id, position);
  }

  @Mutation
  deleteWidget(payload: { id: WidgetId }) {
    const { id } = payload;
    this.mapPosition = MapUtils.remove(this.mapPosition, id);
    this.widgets = ListUtils.remove<Widget>(this.widgets, item => item.id == id);
  }

  @Mutation
  setWidget(payload: { widgetId: number; widget: Widget }) {
    const { widget, widgetId } = payload;
    Log.debug('setWidget::', widgetId, widget);
    this.widgets = ListUtils.remove<Widget>(this.widgets, item => item.id == widgetId);
    this.widgets.push(widget);
    // Vue.set(this._dashboard, 'widgets', newWidget);
  }

  @Mutation
  setPosition(payload: { id: number; newPosition: Position }) {
    const { id, newPosition } = payload;
    this.mapPosition[id] = newPosition;
    Vue.set(this.mapPosition, id, newPosition);
  }

  @Action
  async saveWidgetPosition(): Promise<void> {
    if (ChartUtils.isMobile()) {
      return Promise.resolve();
    } else {
      const dashboardId: DashboardId | undefined = DashboardModule.id;
      if (dashboardId && this.mapPosition) {
        const position = PositionUtils.calculateZIndex(this.mapPosition);
        await this.dashboardService.resizeWidgets(dashboardId, position);
      }
    }
  }

  ///Xoá widget -1, -2 vì đây là 2 widget dùng trong chart builder để edit/ build chart
  @Action
  handleDeleteSnapWidget() {
    const idToDelete = [-1, -2];
    idToDelete.forEach(id => this.deleteWidget({ id: id }));
  }

  @Action
  async handleCreateNewWidget(payload: WidgetPosition): Promise<Widget> {
    const dashboardId = payload.dashboardId ?? DashboardModule.id;
    const dashboardName = DashboardModule.dashboardTitle;
    if (dashboardId) {
      try {
        return await this.dashboardService.createWidget(dashboardId, payload.widget, payload.position).then(widget => {
          // DashboardModule.addWidget({ widget: widget, position: payload.position });
          this.trackingService.trackWidget({
            action: WidgetAction.Create,
            widgetType: widget.className,
            chartFamilyType: Widget.getChartFamilyType(widget) || '',
            chartType: Widget.getChartType(widget) || '',
            widgetId: widget.id,
            widgetName: widget.name,
            dashboardId: dashboardId,
            dashboardName: dashboardName
          });
          return widget;
        });
      } catch (ex) {
        this.trackingService.trackWidget({
          action: WidgetAction.Create,
          dashboardId: dashboardId,
          dashboardName: dashboardName,
          widgetType: payload.widget.className,
          chartFamilyType: Widget.getChartFamilyType(payload.widget) || '',
          chartType: Widget.getChartType(payload.widget) || '',
          widgetId: payload.widget.id,
          widgetName: payload.widget.name,
          isError: true
        });
        throw ex;
      }
    } else {
      throw new DIException('Dashboard id not exists');
    }
  }

  @Action
  async handleCreateTextWidget(payload: { widget: Widget; position?: Position }): Promise<void> {
    const position: Position = payload.position || payload.widget.getDefaultPosition();
    const newWidgetInfo = {
      widget: payload.widget,
      position: position
    };
    const newWidget = await this.handleCreateNewWidget(newWidgetInfo);
    this.addWidget({
      widget: newWidget,
      position: position
    });
  }

  @Action
  async handleCreateTabWidget(widget: TabWidget): Promise<Widget> {
    try {
      // TODO: loading when create text
      const position: Position = widget.getDefaultPosition();
      const widgetPosition = {
        widget: widget,
        position: position
      };
      const widgetCreated = await this.handleCreateNewWidget(widgetPosition);
      this.addWidget({
        widget: widgetCreated,
        position: position
      });
      return widgetCreated;
    } catch (ex) {
      Log.error(ex);
      return Promise.reject(ex);
    }
  }

  @Action
  async handleCreateImageWidget(imageWidget: ImageWidget): Promise<Widget> {
    try {
      // TODO: loading when create text
      const position: Position = imageWidget.getDefaultPosition();
      const widgetPosition = {
        widget: imageWidget,
        position: position
      };
      const widgetCreated = await this.handleCreateNewWidget(widgetPosition);
      this.addWidget({
        widget: widgetCreated,
        position: position
      });
      return widgetCreated;
    } catch (ex) {
      Log.error(ex);
      return Promise.reject(ex);
    }
  }

  @Action
  private async handleRemoveWidgetInTabs(payload: { id: WidgetId; tabs: TabWidget[] }): Promise<boolean[]> {
    const { id, tabs } = payload;
    const successes: Promise<boolean>[] = cloneDeep(tabs).map(async tab => {
      const updateTab: TabWidget = tab.removeWidgetId(id);
      const success = await this.handleUpdateWidget(updateTab);
      this.setWidget({
        widgetId: updateTab.id,
        widget: updateTab
      });
      return success;
    });
    return Promise.all(successes);
  }

  @Action
  async handleDeleteWidget(widget: Widget): Promise<boolean> {
    const dashboardId = DashboardModule.id;
    const dashboardName = DashboardModule.dashboardTitle;

    if (dashboardId) {
      try {
        const success = await this.dashboardService.deleteWidget(dashboardId, widget.id);
        if (success) {
          this.deleteWidget({ id: widget.id });
          /*Xoá widget trong tab
          Context: Widget 123 cần xoá và có Tab Widget chứa Widget 123
          Khi xoá Widget 123 thì phải xoá lun (ID: 123) trong Tab bằng cách gọi api update Tab
          */
          const tabWidgets: TabWidget[] = this.getTabsContainWidget(widget.id) as TabWidget[];
          if (ListUtils.isNotEmpty(tabWidgets)) {
            await this.handleRemoveWidgetInTabs({ id: widget.id, tabs: tabWidgets });
          }
        }
        this.trackingService.trackWidget({
          action: WidgetAction.Delete,
          dashboardId: dashboardId,
          dashboardName: dashboardName,
          widgetType: widget.className,
          chartFamilyType: Widget.getChartFamilyType(widget) || '',
          chartType: Widget.getChartType(widget) || '',
          widgetId: widget.id,
          widgetName: widget.name,
          isError: !success
        });
        return success;
      } catch (error) {
        this.trackingService.trackWidget({
          action: WidgetAction.Delete,
          dashboardId: dashboardId,
          dashboardName: dashboardName,
          widgetType: widget.className,
          chartFamilyType: Widget.getChartFamilyType(widget) || '',
          chartType: Widget.getChartType(widget) || '',
          widgetId: widget.id,
          widgetName: widget.name,
          isError: true
        });
        throw error;
      }
    } else {
      return false;
    }
  }

  @Action({ rawError: true })
  async updateTitleWidget(payload: { widget: Widget; newName: string }): Promise<void> {
    const { widget, newName } = payload;
    const clonedWidget = Widget.fromObject(widget);
    clonedWidget.setTitle(newName);
    const result: boolean = await this.handleUpdateWidget(clonedWidget);
    if (result) {
      this.setWidget({
        widgetId: clonedWidget.id,
        widget: clonedWidget
      });
    } else {
      return Promise.reject(new DIException('Cannot edit title of this widget'));
    }
  }

  @Action({ rawError: true })
  async handleUpdateWidget(widget: Widget): Promise<boolean> {
    const dashboardId = DashboardModule.id;
    const dashboardName = DashboardModule.dashboardTitle;
    if (dashboardId) {
      try {
        const result = await this.dashboardService.editWidget(dashboardId, widget.id, widget);
        this.trackingService.trackWidget({
          action: WidgetAction.Edit,
          dashboardId: dashboardId,
          dashboardName: dashboardName,
          widgetType: widget.className,
          chartFamilyType: Widget.getChartFamilyType(widget) || '',
          chartType: Widget.getChartType(widget) || '',
          widgetId: widget.id,
          widgetName: widget.name,
          isError: !result
        });
        return result;
      } catch (error) {
        this.trackingService.trackWidget({
          action: WidgetAction.Edit,
          dashboardId: dashboardId,
          dashboardName: dashboardName,
          widgetType: widget.className,
          chartFamilyType: Widget.getChartFamilyType(widget) || '',
          chartType: Widget.getChartType(widget) || '',
          widgetId: widget.id,
          widgetName: widget.name,
          isError: true
        });
        PopupUtils.showError(error.message);
        return false;
      }
    } else {
      return false;
    }
  }

  @Action({ rawError: true })
  async handleUpdateWidgetAtDashboard(payload: { dashboardId: DashboardId; widget: Widget }): Promise<boolean> {
    const { dashboardId, widget } = payload;
    const dashboardName = '';
    if (dashboardId) {
      try {
        const result = await this.dashboardService.editWidget(dashboardId, widget.id, widget);
        this.trackingService.trackWidget({
          action: WidgetAction.Edit,
          dashboardId: dashboardId,
          dashboardName: dashboardName,
          widgetType: widget.className,
          chartFamilyType: Widget.getChartFamilyType(widget) || '',
          chartType: Widget.getChartType(widget) || '',
          widgetId: widget.id,
          widgetName: widget.name,
          isError: !result
        });
        return result;
      } catch (error) {
        Log.error(error);
        this.trackingService.trackWidget({
          action: WidgetAction.Edit,
          dashboardId: dashboardId,
          dashboardName: dashboardName,
          widgetType: widget.className,
          chartFamilyType: Widget.getChartFamilyType(widget) || '',
          chartType: Widget.getChartType(widget) || '',
          widgetId: widget.id,
          widgetName: widget.name,
          isError: true
        });
        return false;
      }
    } else {
      return false;
    }
  }

  @Action
  async handleDuplicateWidget(widget: Widget): Promise<Widget> {
    const dashboardId = DashboardModule.id;
    const dashboardName = DashboardModule.dashboardTitle;
    if (this.mapPosition[widget.id]) {
      const currentPosition = this.mapPosition[widget.id];
      const newPosition: Position = Position.from(currentPosition);
      const widgetPosition: WidgetPosition = { position: newPosition, widget: widget };
      try {
        const newWidget: Widget = await this.handleCreateNewWidget(widgetPosition);
        this.trackingService.trackWidget({
          action: WidgetAction.Duplicate,
          dashboardId: dashboardId || 0,
          dashboardName: dashboardName,
          widgetType: newWidget.className,
          chartFamilyType: Widget.getChartFamilyType(newWidget) || '',
          chartType: Widget.getChartType(newWidget) || '',
          widgetId: newWidget.id,
          widgetName: newWidget.name
        });
        await this.addWidget({ widget: newWidget, position: newPosition });
        return newWidget;
      } catch (ex) {
        return Promise.reject(ex);
      }
    } else {
      return Promise.reject(new DIException('handleDuplicateWidget:: Unknown exception'));
    }
  }

  @Action
  async addWidgetsToTab(payload: { tabWidget: TabWidget; tabIndex: number; widgetIds: WidgetId[] }): Promise<Widget> {
    const { tabWidget, tabIndex, widgetIds } = payload;
    const updatedWidget: TabWidget = cloneDeep(tabWidget);
    updatedWidget.getTab(tabIndex).addWidgets(widgetIds);
    const success = await this.handleUpdateWidget(updatedWidget);
    if (success) {
      this.setWidget({ widgetId: updatedWidget.id, widget: updatedWidget });
      this.resetLocation(widgetIds);
    }
    return updatedWidget;
  }

  @Mutation
  resetLocation(widgetIds: WidgetId[]) {
    widgetIds.forEach(id => {
      const updatedPosition = cloneDeep(this.mapPosition[id]);
      updatedPosition.column = -1;
      updatedPosition.row = -1;
      Vue.set(this.mapPosition, id, updatedPosition);
    });
  }

  @Action
  async removeWidgetFromTab(payload: { tabWidget: TabWidget; tabIndex: number; widgetIds: WidgetId[]; deleteTabWhenEmpty: boolean }) {
    const { tabWidget, tabIndex, widgetIds, deleteTabWhenEmpty } = payload;
    const updatedWidget: TabWidget = cloneDeep(tabWidget);
    const tabToAccess = updatedWidget.getTab(tabIndex);
    tabToAccess.removeWidgets(widgetIds);
    /*
     * Xoá lun tab nếu không còn Widget
     * */
    if (ListUtils.isEmpty(tabToAccess.widgetIds) && deleteTabWhenEmpty) {
      updatedWidget.removeTab(tabIndex);
    }
    const success = await this.handleUpdateWidget(updatedWidget);
    if (success) {
      this.setWidget({ widgetId: updatedWidget.id, widget: updatedWidget });
      this.resetLocation(widgetIds);
    }
    return updatedWidget;
  }

  @Mutation
  private reset() {
    this.widgets = [];
    this.mapPosition = {};
    this.expandedKeysAsMap = new Map();
    this.selectedKeysAsMap = new Map();
  }

  get allQueryParameters(): Record<string, QueryParameter> {
    const result: Record<string, QueryParameter> = {};
    this.allQueryWidgets.forEach(widget => {
      const queryParam: Record<string, QueryParameter> = widget.setting.getChartOption()?.options?.queryParameter ?? {};
      for (const key in queryParam) {
        const param = queryParam[key];
        result[param.displayName] = param;
      }
    });
    return result;
  }

  get findTabContainWidget(): (id: WidgetId) => { tabId: WidgetId; tabIndexes: number[] } {
    return id => {
      const tabWidgets: TabWidget[] = this.widgets.filter(widget => TabWidget.isTabWidget(widget) && widget.allWidgets.includes(id)) as TabWidget[];
      const widgetId: WidgetId = ListUtils.isNotEmpty(tabWidgets) ? tabWidgets[0].id : -1;
      const tabIndexes: number[] = ListUtils.isNotEmpty(tabWidgets) ? tabWidgets[0].findWidget(id) : [];
      return { tabId: widgetId, tabIndexes: tabIndexes };
    };
  }

  /**
   * method sort widget id by position, from top to bottom, left to right.
   * priority: row > column > id.
   * if widget id not in mapPosition, it will be in the last of array.
   * if widget id is same position in mapPosition, it will be sort by id.
   * @param idList
   */
  @Action
  async sortByPosition(idList: WidgetId[]): Promise<WidgetId[]> {
    const defaultPosition = new Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0, 0, 0);
    const sortedIdList: number[] = idList
      .map(id => {
        const position = this.mapPosition[id] ?? defaultPosition;
        return { id, position };
      })
      .sort((objectA, objectB) => {
        if (objectA.position.row !== objectB.position.row) {
          return objectA.position.row - objectB.position.row;
        }
        if (objectA.position.column !== objectB.position.column) {
          return objectA.position.column - objectB.position.column;
        }
        return objectA.id - objectB.id;
      })
      .map(object => object.id);
    return sortedIdList;
  }

  @Mutation
  setExpandedKeys(payload: { id: WidgetId; keys: string[] }) {
    const { id, keys } = payload;
    this.expandedKeysAsMap.set(id, keys);
  }

  @Mutation
  deleteExpandedKeys(id: WidgetId) {
    this.expandedKeysAsMap.delete(id);
  }

  @Mutation
  updateExpandedKeys(payload: { id: WidgetId; keys: string[] }) {
    const { id, keys } = payload;
    const currentKeys: string[] = this.expandedKeysAsMap.get(id) ?? [];
    const updatedKeys: Set<string> = new Set([...currentKeys, ...keys]);
    this.expandedKeysAsMap.set(id, Array.from(updatedKeys.keys()));
  }
  @Mutation
  setSelectedKeys(payload: { id: WidgetId; keys: string[] }) {
    const { id, keys } = payload;
    this.selectedKeysAsMap.set(id, keys);
  }

  @Mutation
  deleteSelectedKeys(id: WidgetId) {
    this.selectedKeysAsMap.delete(id);
  }

  @Mutation
  updateSelectedKeys(payload: { id: WidgetId; keys: string[] }) {
    const { id, keys } = payload;
    const currentKeys: string[] = this.expandedKeysAsMap.get(id) ?? [];
    const updatedKeys: Set<string> = new Set([...currentKeys, ...keys]);
    this.selectedKeysAsMap.set(id, Array.from(updatedKeys.keys()));
  }
}

export const WidgetModule: WidgetStore = getModule(WidgetStore);
