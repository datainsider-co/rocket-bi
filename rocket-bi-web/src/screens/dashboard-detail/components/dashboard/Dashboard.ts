import BoostContextMenu from '@/screens/dashboard-detail/components/dashboard-control-bar/BoostContextMenu.vue';
import WidgetContainer from '@/screens/dashboard-detail/components/widget-container';
import DrilldownSetting from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/drilldown/DrilldownSetting.vue';
import TabViewer from '@/screens/dashboard-detail/components/widget-container/other/TabViewer.vue';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { DashboardModeModule, DashboardModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { DashboardMode, isEdit, isView } from '@/shared';
import { CalendarPickerOptions } from '@/shared/components/CalendarContextMenu.vue';
import { CustomGridStackOptions } from '@/shared/components/gridstack/CustomGridstack';
import DiGridstack from '@/shared/components/gridstack/DiGridstack.vue';
import { ChartUtils, DomUtils } from '@/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { MouseEventData } from '@chart/BaseChart';
import { ChartInfo, DIException, DIMap, Position, TabWidget, Widget, WidgetId, Widgets } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import VueContext from 'vue-context';
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import WidgetContextMenu from '../WidgetContextMenu.vue';

@Component({
  components: { WidgetContainer, DrilldownSetting, VueContext, WidgetContextMenu, BoostContextMenu, TabViewer }
})
export default class Dashboard extends Vue {
  private enableEdit = false;
  private canSave = true;

  @Ref()
  private readonly gridstack?: DiGridstack;

  @Ref()
  private readonly widgetContextMenu?: WidgetContextMenu;

  private get mode(): DashboardMode {
    return DashboardModeModule.mode;
  }

  private get positions(): DIMap<Position> {
    return WidgetModule.positionsInDashboard;
  }

  private get widgetAsMap(): DIMap<Widget> {
    return DashboardModule.widgetAsMap;
  }

  private get enableOverlap(): boolean {
    return DashboardModule.setting.enableOverlap;
  }

  private get defaultOptions(): CustomGridStackOptions {
    return {
      animate: true,
      column: 48,
      margin: '0.5rem',
      marginUnit: 'rem',
      cellHeight: '32px',
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

  private get dashboardStyle(): any {
    return {
      '--next-max-z-index': WidgetModule.currentMaxZIndex + 1
    };
  }

  created() {
    this.enableEdit = DashboardModeModule.isEditMode;
  }

  mounted() {
    this.$nextTick(() => DomUtils.bind('gridstack', this.gridstack));
    this.registerEvents();
  }

  beforeDestroy() {
    this.unregisterEvents();
  }

  @Watch('mode')
  async onModeChanged(newMode: DashboardMode, oldMode: DashboardMode): Promise<void> {
    const isDifferentMode = newMode != oldMode;
    if (isDifferentMode) {
      this.enableEdit = isEdit(newMode);
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

  private getWidget(id: number): Widget {
    return this.widgetAsMap[id];
  }

  private handleChangePosition(payload: { id: number; position: Position }) {
    if (this.isEditMode) {
      const { position, id } = payload;
      this.canSave = true;
      WidgetModule.setPosition({
        id: id, // default
        newPosition: position
      });

      this.emitResizeEvent(id);
    }
  }

  private emitResizeEvent(id: number) {
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
      this.handleChangePosition({ id: id, position: newPosition });
    }
  }

  private registerEvents() {
    this.$root.$on(DashboardEvents.ShowContextMenuOnPointData, this.showContextMenuOnPointData);
    this.$root.$on(DashboardEvents.ShowContextMenuOnWidget, this.showContextMenuOnWidget);
    this.$root.$on(DashboardEvents.ShowDrillDown, this.showDrilldown);
    this.$root.$on(DashboardEvents.ShowCalendar, this.showCalendar);
    this.$root.$on(DashboardEvents.HideCalendar, this.hideCalendar);
  }

  private unregisterEvents() {
    this.$root.$off(DashboardEvents.ShowContextMenuOnPointData, this.showContextMenuOnPointData);
    this.$root.$on(DashboardEvents.ShowContextMenuOnWidget, this.showContextMenuOnWidget);
    this.$root.$off(DashboardEvents.ShowDrillDown, this.showDrilldown);
    this.$root.$off(DashboardEvents.ShowCalendar, this.showCalendar);
    this.$root.$off(DashboardEvents.HideCalendar, this.hideCalendar);
  }

  private showContextMenuOnPointData(metaData: ChartInfo, mouseEventData: MouseEventData<string>) {
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

  public hideCalendar() {
    this.widgetContextMenu?.hideCalendar();
  }

  private isTabWidget(widget: Widget): boolean {
    return TabWidget.isTabWidget(widget);
  }

  removeWidgets(ids: WidgetId[]) {
    ids.forEach(id => this.gridstack?.removeItemById(id));
  }
}
