import { BoostInfo, DashboardId, DashboardSetting, DIMap, MainDateFilter, Position, TabWidget, Widget, WidgetId } from '@core/common/domain/model';

export class Dashboard {
  id: DashboardId;
  name: string;
  /**
   * @deprecated field will remove as soon as possible
   * use mainDateFilter in setting instead of
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

  get widgetIdsInTab(): WidgetId[] {
    return this.widgets?.filter(widget => TabWidget.isTabWidget(widget))?.flatMap(tabWidget => (tabWidget as TabWidget).allWidgets) ?? [];
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
