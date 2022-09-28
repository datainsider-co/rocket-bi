import { MapUtils, PositionUtils } from '@/utils';
import { BoostInfo, DashboardId, DashboardSetting, DIMap, MainDateFilter, Position, TabId, TabWidget, Widget, WidgetId, Widgets } from '@core/domain/Model';
import { Log } from '@core/utils';

export class Dashboard {
  id: DashboardId;
  name: string;
  /**
   * @deprecated unused
   */
  mainDateFilter?: MainDateFilter;
  ownerId: string;
  widgets?: Widget[];
  widgetPositions?: DIMap<Position>;
  setting: DashboardSetting;
  boostInfo: BoostInfo;

  constructor(
    id: DashboardId,
    name: string,
    ownerId: string,
    mainDateFilter?: MainDateFilter,
    widgets?: Widget[],
    widgetPositions?: DIMap<Position>,
    setting?: DashboardSetting,
    boostInfo?: BoostInfo
  ) {
    this.id = id;
    this.name = name;
    this.mainDateFilter = mainDateFilter;
    this.ownerId = ownerId;
    this.widgets = widgets;
    this.widgetPositions = widgetPositions;
    this.setting = setting ?? DashboardSetting.default();
    this.boostInfo = boostInfo ?? BoostInfo.default();
  }

  static fromObject(obj: Dashboard): Dashboard {
    const mainDateFilter = obj.mainDateFilter ? MainDateFilter.fromObject(obj.mainDateFilter) : void 0;
    const widgets = obj.widgets ? obj.widgets.map(widget => Widget.fromObject(widget)) : [];
    const positions = { ...obj.widgetPositions };
    const setting: DashboardSetting = obj.setting ? DashboardSetting.fromObject(obj.setting) : DashboardSetting.default();
    const boostInfo: BoostInfo = obj.boostInfo ? BoostInfo.fromObject(obj.boostInfo) : BoostInfo.default();
    return new Dashboard(obj.id, obj.name, obj.ownerId, mainDateFilter, widgets, positions, setting, boostInfo);
  }

  get useBoost(): boolean {
    return this.boostInfo?.enable ?? false;
  }

  copyWith(boostInfo?: BoostInfo): Dashboard {
    if (boostInfo) {
      this.boostInfo = boostInfo;
    }
    return this;
  }

  addWidgetsToTab(target: WidgetId, tabIndex: number, widgetIds: WidgetId[]): Dashboard {
    const tabWidget: Widget | null = this.getWidget(target);
    if (TabWidget.isTabWidget(tabWidget)) {
      //Generate new position
      const widgetsToAdd: Widget[] = this.getWidgets(widgetIds);
      this.setDefaultPosition(widgetsToAdd);
      tabWidget.getTab(tabIndex).addWidgets(widgetIds);
    }

    return this;
  }

  removeWidgetsFromTab(from: WidgetId, tabIndex: number, widgetIds: WidgetId[]): Dashboard {
    const tabWidget: Widget | null = this.getWidget(from);
    if (TabWidget.isTabWidget(tabWidget)) {
      ///Generate position in dashboard
      const widgetsToRemove: Widget[] = this.getWidgets(widgetIds);
      this.setDefaultPosition(widgetsToRemove);
      tabWidget.getTab(tabIndex).removeWidgets(widgetIds);
    }

    return this;
  }

  private setDefaultPosition(widgets: Widget[]) {
    const newPosition: DIMap<Position> = MapUtils.toDiMap(new Map(widgets.map(widget => [widget.id, PositionUtils.getPosition(widget)])));
    this.widgetPositions = {
      ...this.widgetPositions,
      ...newPosition
    };
  }

  get widgetIdsInTab(): WidgetId[] {
    return this.widgets?.filter(widget => TabWidget.isTabWidget(widget))?.flatMap(tabWidget => (tabWidget as TabWidget).allWidgets) ?? [];
  }

  get widgetsInDashboard(): Widget[] {
    return this.widgets?.filter(widget => !this.widgetIdsInTab.includes(widget.id)) ?? [];
  }

  //Return null if not have widget
  getWidget(id: WidgetId): Widget | null {
    return this.widgets?.find(widget => widget.id === id) ?? null;
  }

  getWidgets(ids: WidgetId[]): Widget[] {
    const idAsSet = new Set(ids);
    return this.widgets?.filter(widget => idAsSet.has(widget.id)) ?? [];
  }
}
