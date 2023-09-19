import BoostContextMenu from '@/screens/dashboard-detail/components/dashboard-control-bar/BoostContextMenu.vue';
import WidgetHolder from '@/screens/dashboard-detail/components/widget-container/WidgetHolder.vue';
import DrilldownSetting from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/drilldown/DrilldownSetting.vue';
import TabViewer from '@/screens/dashboard-detail/components/widget-container/other/TabViewer.vue';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { DashboardModeModule, DashboardModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { DashboardMode, isEdit, isView } from '@/shared';
import { CalendarPickerOptions } from '@/shared/components/CalendarContextMenu.vue';
import { CustomGridStackOptions } from '@/shared/components/gridstack/CustomGridstack';
import DiGridstack from '@/shared/components/gridstack/DiGridstack.vue';
import { ChartUtils } from '@/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { MouseEventData } from '@chart/BaseChart';
import { ChartInfo, DIException, DIMap, Position, TabWidget, Widget, WidgetId, WidgetSetting } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import VueContext from 'vue-context';
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import WidgetContextMenu from '../WidgetContextMenu.vue';
import { GroupFilter } from '@core/common/domain/model/widget/normal/GroupFilter';
import FilterPanelViewer from '@/screens/dashboard-detail/components/widget-container/other/FilterPanelViewer.vue';
import { Log } from '@core/utils';

@Component({
  components: { WidgetHolder, DrilldownSetting, VueContext, WidgetContextMenu, BoostContextMenu, TabViewer, FilterPanelViewer }
})
export default class Dashboard extends Vue {
  private allowEdit = false;
  private canSave = true;

  @Ref()
  readonly gridstack?: DiGridstack;

  @Ref()
  private readonly widgetContextMenu?: WidgetContextMenu;

  private get mode(): DashboardMode {
    return DashboardModeModule.mode;
  }

  private get positions(): DIMap<Position> {
    return WidgetModule.positionsInDashboard;
  }

  get widgetAsMap(): DIMap<Widget> {
    return DashboardModule.widgetAsMap;
  }

  private get enableOverlap(): boolean {
    return DashboardModule.setting.enableOverlap;
  }

  protected get widgetSetting(): WidgetSetting {
    return DashboardModule.setting.widgetSetting;
  }

  static getCellHeight(): number {
    return 32;
  }

  public getCellWidth(): number | undefined {
    return this.gridstack?.instance?.cellWidth();
  }

  get gridstackOptions(): CustomGridStackOptions {
    return {
      animate: true,
      column: 48,
      margin: '10px',
      marginUnit: 'px',
      cellHeight: Dashboard.getCellHeight() + 'px',
      oneColumnModeDomSort: false,
      disableOneColumnMode: true,
      enableOverlap: this.enableOverlap,
      draggable: {
        scroll: true
      },
      resizable: {
        handles: 'e, se, s, sw, w'
      },
      float: this.enableOverlap,
      alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }

  private get getCurrentCursor(): string {
    return this.isEditMode ? 'move' : 'default';
  }

  private get isEditMode(): boolean {
    return isEdit(this.mode);
  }

  get dashboardStyle(): any {
    return {
      '--next-max-z-index': WidgetModule.currentMaxZIndex + 1
    };
  }

  created() {
    this.allowEdit = DashboardModeModule.isEditMode;
  }

  mounted() {
    this.registerEvents();
  }

  beforeDestroy() {
    this.unregisterEvents();
  }

  @Watch('mode')
  async onModeChanged(newMode: DashboardMode, oldMode: DashboardMode): Promise<void> {
    const isDifferentMode = newMode != oldMode;
    if (isDifferentMode) {
      this.allowEdit = isEdit(newMode);
      if (this.canSave) {
        const isEditToView = isEdit(oldMode) && isView(newMode);
        if (isEditToView) {
          await this.savePosition();
        }
        //clear positions
        this.canSave = false;
      }
    }
  }

  private async savePosition(): Promise<void> {
    try {
      await WidgetModule.saveWidgetPosition();
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      PopupUtils.showError(exception.message);
    }
  }

  public onPositionChanged(payload: { id: number; position: Position }): void {
    if (this.isEditMode) {
      const { position, id } = payload;
      this.canSave = true;
      WidgetModule.setPosition({
        id: id, // default
        newPosition: position
      });

      this.resizeWidget(id);
    }
  }

  public resizeWidget(id: number) {
    this.$nextTick(() => {
      this.$root.$emit(DashboardEvents.ResizeWidget, id);
    });
  }

  private calculateZIndex(position: Position): Position {
    if (this.enableOverlap) {
      const newPosition = cloneDeep(position);
      newPosition.zIndex = WidgetModule.currentMaxZIndex + 1;
      return newPosition;
    } else {
      return cloneDeep(position);
    }
  }

  private handleClickItem(id: WidgetId, position: Position): void {
    if (this.isEditMode && ChartUtils.isDesktop() && this.enableOverlap) {
      const newPosition = this.calculateZIndex(position);
      this.onPositionChanged({ id: id, position: newPosition });
    }
  }

  private registerEvents() {
    this.$root.$on(DashboardEvents.ShowContextMenuOnPointData, this.showContextMenuOnPointData);
    this.$root.$on(DashboardEvents.ShowContextMenuOnWidget, this.showContextMenuOnWidget);
    this.$root.$on(DashboardEvents.ShowDrillDown, this.showDrilldown);
    this.$root.$on(DashboardEvents.ShowCalendar, this.showCalendar);
  }

  private unregisterEvents() {
    this.$root.$off(DashboardEvents.ShowContextMenuOnPointData, this.showContextMenuOnPointData);
    this.$root.$on(DashboardEvents.ShowContextMenuOnWidget, this.showContextMenuOnWidget);
    this.$root.$off(DashboardEvents.ShowDrillDown, this.showDrilldown);
    this.$root.$off(DashboardEvents.ShowCalendar, this.showCalendar);
  }

  private showContextMenuOnPointData(metaData: ChartInfo, mouseEventData: MouseEventData<string>) {
    Log.debug('Dashboard::showContextMenuOnPointData::', mouseEventData);
    PopupUtils.hideAllPopup();
    this.widgetContextMenu?.show(metaData, mouseEventData);
  }

  private showContextMenuOnWidget(metaData: ChartInfo, event: MouseEvent) {
    PopupUtils.hideAllPopup();
    this.widgetContextMenu?.showOnWidget(metaData, event);
  }

  private showDrilldown(metaData: ChartInfo, mouseEventData: MouseEventData<string>) {
    PopupUtils.hideAllPopup();
    this.widgetContextMenu?.showDrilldownMenu(metaData, mouseEventData);
  }

  public showCalendar(event: MouseEventData<Date>, onDateSelected?: (newDate: Date) => void, options?: CalendarPickerOptions) {
    PopupUtils.hideAllPopup();
    this.widgetContextMenu?.showCalendar(event, onDateSelected, options);
  }

  protected isTabWidget(widget: Widget): boolean {
    return TabWidget.isTabWidget(widget);
  }
  protected isFilterPanel(widget: Widget): boolean {
    return GroupFilter.isGroupFilter(widget);
  }

  removeWidgets(ids: WidgetId[]) {
    ids.forEach(id => this.gridstack?.removeItemById(id));
  }
}
