import BoostContextMenu from '@/screens/dashboard-detail/components/dashboard-control-bar/BoostContextMenu.vue';
import DashboardSettingModal from '@/screens/dashboard-detail/components/dashboard-setting-modal/DashboardSettingModal.vue';
import PerformanceBoostModal from '@/screens/dashboard-detail/components/PerformanceBoostModal.vue';
import SelectFieldButton from '@/screens/dashboard-detail/components/SelectFieldButton.vue';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import {
  ChartDataModule,
  DashboardControllerModule,
  DashboardModeModule,
  DashboardModule,
  FilterModule,
  WidgetModule
} from '@/screens/dashboard-detail/stores';
import { ContextMenuItem, DashboardMode, DashboardOptions, DateRange } from '@/shared';
import { Track } from '@/shared/anotation';
import PermissionWidget from '@/shared/components/PermissionWidget.vue';
import { ListUtils } from '@/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { GenIdMethods } from '@/utils/IdGenerator';
import { ActionType } from '@/utils/PermissionUtils';
import { PopupUtils } from '@/utils/PopupUtils';
import { DashboardSetting, DIException, MainDateFilter2, MainDateMode, Position, TabWidget, TextWidget, UserProfile } from '@core/common/domain';
import { DataManager } from '@core/common/services';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Log } from '@core/utils';
import MainDateFilter from '@filter/main-date-filter-v2/MainDateFilter.vue';
import SetupMainDateFilter from '@filter/main-date-filter-v2/SetupMainDateFilter.vue';
import { Component, Inject, Prop, Provide, Ref, Vue } from 'vue-property-decorator';
import RelationshipModal from '@/screens/dashboard-detail/components/RelationshipModal.vue';
import DashboardRelationshipIcon from '@/shared/components/Icon/DashboardRelationshipIcon.vue';
import RLSViewAsModal from '@/screens/dashboard-detail/components/dashboard-control-bar/RLSViewAsModal.vue';
import { BPopover } from 'bootstrap-vue';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { EventBus } from '@/event-bus/EventBus';
import { GroupFilter } from '@core/common/domain/model/widget/normal/GroupFilter';

const $ = window.$;

@Component({
  components: {
    MainDateFilter,
    PermissionWidget,
    SelectFieldButton,
    SetupMainDateFilter,
    DashboardSettingModal,
    PerformanceBoostModal,
    BoostContextMenu,
    RelationshipModal,
    DashboardRelationshipIcon,
    RLSViewAsModal
  }
})
export default class DashboardControlBar extends Vue {
  private readonly optionButtonId = 'dashboard-options-button';
  private isShowOptionMenu = false;

  date: DateRange = {
    start: '',
    end: ''
  };

  @Prop({ type: Boolean, default: false })
  protected readonly showResetFilters!: boolean;

  @Prop({ type: Boolean, default: false })
  protected readonly isMobile!: boolean;

  @Prop({ type: Boolean, default: false })
  protected readonly isEmbeddedView!: boolean;

  @Ref()
  private readonly imagePicker?: HTMLInputElement;

  @Ref()
  private readonly dashboardSettingModal?: DashboardSettingModal;
  @Ref()
  private readonly performanceBoostModal?: PerformanceBoostModal;
  @Ref()
  private readonly boostContextMenu?: BoostContextMenu;

  @Ref()
  private readonly relationshipModal?: RelationshipModal;

  @Ref()
  private rlsViewAsModal?: RLSViewAsModal;

  @Ref()
  private menuOption?: BPopover;

  @Ref()
  private optionButton?: DiIconTextButton;

  private isResetMainDateFlow = false;

  protected get mainDateFilter(): MainDateFilter2 | null {
    return DashboardModule.currentDashboard?.setting.mainDateFilter ?? DashboardModule.mainDateFilter;
  }

  protected get mode(): DashboardMode {
    return DashboardModeModule.mode;
  }

  protected get isFullScreen(): boolean {
    return DashboardModeModule.isFullScreen;
  }

  protected get isTVMode(): boolean {
    return DashboardModeModule.isTVMode;
  }

  protected get isViewMode(): boolean {
    return DashboardModeModule.isViewMode;
  }

  private get items(): ContextMenuItem[] {
    return [
      {
        text: DashboardOptions.ADD_CHART,
        click: this.handleAddChart
      },
      {
        text: DashboardOptions.ADD_TAB,
        click: this.handleAddTab
      },
      {
        text: DashboardOptions.ADD_GROUP_FILTER,
        click: this.handleAddFilterPanel
      },
      {
        text: DashboardOptions.ADD_TEXT,
        click: this.showAddText
      },
      {
        text: DashboardOptions.ADD_IMAGE,
        click: this.addImage
      },
      {
        text: 'Paste chart',
        click: this.handlePasteChart,
        disabled: this.disabledPasteChart
      }
    ];
  }

  // Provide from DashboardHeader.vue
  @Inject()
  private handleResetFilter?: () => void;
  get disabledPasteChart(): boolean {
    return !DashboardModule.copiedData;
  }

  get getHiddenClass() {
    if (this.isViewMode && !this.mainDateFilter) {
      return 'hidden';
    }
    return '';
  }

  private get viewAsUser() {
    return ChartDataModule.viewAsUser;
  }

  get hasMainDate(): boolean {
    //sua ten
    if (this.mainDateFilter && !this.isResetMainDateFlow) {
      return true;
    }
    return false;
  }

  private get isEditMode() {
    return this.mode === DashboardMode.Edit;
  }

  private get isRLSViewAsMode() {
    return this.mode === DashboardMode.RLSViewAsMode;
  }

  private get actionTypes(): Set<ActionType> {
    return DashboardModeModule.actionTypes;
  }

  private get mainDateFilterMode(): MainDateMode {
    return DashboardModule.mainDateFilterMode;
  }

  private get defaultDateRange(): DateRange | null {
    return FilterModule.chosenRange;
  }

  // private get isShowResetFilter(): boolean {
  //   if (this.mode === DashboardMode.Edit) {
  //     return true;
  //   }
  //   return false;
  // }

  private get dashboardId(): number | undefined {
    //Todo: not show
    return DashboardModule.id;
  }

  //get Inject from DiCalender.ts
  @Provide()
  handleResetMainDate(): void {
    this.isResetMainDateFlow = true;
    Log.debug('Catch reset main date filter');
  }

  async toViewMode(): Promise<void> {
    this.hideMenuOptions();
    const newMode = this.mode == DashboardMode.EditFullScreen ? DashboardMode.ViewFullScreen : DashboardMode.View;
    await this.setupTvMode(false);
    DashboardModeModule.setMode(newMode);
  }

  async toEditMode(): Promise<void> {
    this.hideMenuOptions();
    const newMode = this.mode == DashboardMode.ViewFullScreen ? DashboardMode.EditFullScreen : DashboardMode.Edit;
    DashboardModeModule.setMode(newMode);
  }

  async toFullScreenMode(): Promise<void> {
    this.hideMenuOptions();
    const newMode = this.mode == DashboardMode.View ? DashboardMode.ViewFullScreen : DashboardMode.View;
    DashboardModeModule.setMode(newMode);
    // this.onFullscreenChange()
    this.resizeChart();
  }

  async toTvMode(): Promise<void> {
    this.hideMenuOptions();
    DashboardModeModule.setMode(DashboardMode.TVMode);
    await this.setupTvMode(true);
  }

  async toRlsViewAsMode(): Promise<void> {
    this.hideMenuOptions();
    DashboardModeModule.setMode(DashboardMode.RLSViewAsMode);
  }

  clickAdding(event: MouseEvent) {
    const buttonAddId = GenIdMethods.genBtnId('adding-chart');
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, buttonAddId);
    this.$root.$emit(DashboardEvents.ShowContextMenu, buttonEvent, this.items);
  }

  clickBoost(event: MouseEvent) {
    const boostInfo = DashboardModule.currentDashboard?.boostInfo;
    this.performanceBoostModal!.show(boostInfo, newInfo => {
      return DashboardModule.updateBoostInfo(newInfo);
    });
  }

  handleFileSelected(event: any): void {
    if (this.imagePicker && ListUtils.isNotEmpty(this.imagePicker.files)) {
      const file: File = this.imagePicker.files![0];
      const position: Position = Position.defaultForImage();
      DashboardModule.handleUpdateImage(file)
        .then(imageWidget => {
          return WidgetModule.handleCreateNewWidget({
            widget: imageWidget,
            position: position
          });
        })
        .then(widget => {
          WidgetModule.addWidget({ widget: widget, position: position });
        })
        .catch(ex => this.showError('Upload failure! Try again later', ex));
    }
  }

  showError(reason: string, ex: DIException): void {
    //TODO(tvc12): show error here
  }

  async clickShare(): Promise<void> {
    this.hideMenuOptions();
    try {
      if (this.dashboardId) {
        Log.debug('DashboardControlBar::clickShare::dashboardId::', this.dashboardId);
        this.showShareModal(this.dashboardId.toString());
      } else {
        Log.debug('DashboardControlBar::clickShare::error:: can not get dashboard Id.');
        PopupUtils.showError('Can not get Dashboard Id.');
      }
    } catch (e) {
      Log.debug('DashboardControlBar::ClickShare::error::', e.message);
    }
  }

  private clickViewAs(): void {
    // await this.switchMode(DashboardControlBar.TO_RLS_VIEW_AS);
    this.hideMenuOptions();
    this.showRLSViewAsModal();
  }

  @Track(TrackEvents.ShareDashboard, {
    dashboard_id: (_: DashboardControlBar, args: any) => args[1]
  })
  private showShareModal(dashboardId: string) {
    this.$root.$emit(DashboardEvents.ShowShareModal, +dashboardId);
  }

  async handleSetupMainDateFilter(mode: MainDateMode): Promise<void> {
    try {
      const mainDateFilter: MainDateFilter2 = MainDateFilter2.fromMode(mode);
      DashboardModule.setMainDateFilter(mainDateFilter);
      DashboardModule.saveMainDate({ mode: mode });
      FilterModule.loadDateRange({ mode: mode });
      DashboardModule.updateMainDateFilter(mainDateFilter);
      await DashboardControllerModule.applyDynamicValues({
        id: mainDateFilter.id,
        valueMap: mainDateFilter.getValueController().getDefaultValueAsMap()
      });
    } catch (e) {
      Log.debug('dashboardControlBar::handleSetupMainDateFilter::error', e);
    } finally {
      this.isResetMainDateFlow = false;
    }
  }

  private async setupTvMode(isTvMode: boolean) {
    if (isTvMode) {
      // request fullscreen
      if (!window.document.fullscreenElement) {
        await window.document.body.requestFullscreen().catch(err => {
          PopupUtils.showError('Error attempting to enable full-screen mode');
          Log.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      }
    } else {
      if (window.document.fullscreenElement) {
        await window.document.exitFullscreen();
      }
    }
  }

  private addImage(): void {
    PopupUtils.hideAllPopup();
    // this.imagePicker?.click();
    this.$root.$emit(DashboardEvents.ShowImageBrowserModal);
  }

  @Track(TrackEvents.AddText)
  private showAddText() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.ShowEditTextModal, TextWidget.empty(), false);
  }

  @Track(TrackEvents.AddChart)
  private handleAddChart() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      DataManager.saveCurrentDashboardId(dashboard.id.toString());
      DataManager.saveCurrentDashboard(dashboard);
    }
    // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
    this.$root.$emit(DashboardEvents.AddChart);
  }

  private handleAddTab() {
    PopupUtils.hideAllPopup();
    const newTab = TabWidget.empty();
    return WidgetModule.handleCreateTabWidget(newTab);
  }

  private async handleAddFilterPanel() {
    try {
      PopupUtils.hideAllPopup();
      const newTab = GroupFilter.empty();
      const panel: GroupFilter = (await WidgetModule.handleCreateTabWidget(newTab)) as GroupFilter;
      FilterModule.addGroupFilter(panel);
    } catch (ex) {
      Log.error('DashboardControlBar::handleAddFilterPanel::ex', ex);
    }
  }

  @Track(TrackEvents.DashboardResetFilter, { dashboard_id: (_: DashboardControlBar) => _.dashboardId })
  private resetFilter(): void {
    if (this.handleResetFilter) {
      this.handleResetFilter();
    }
  }

  private handleClearResetMainDate() {
    if (this.isResetMainDateFlow) {
      this.isResetMainDateFlow = false;
    }
  }

  private showDashboardSetting() {
    this.hideMenuOptions();
    if (this.dashboardSettingModal) {
      this.dashboardSettingModal.show({
        setting: DashboardModule.setting,
        onApply: this.handleApplySetting
      });
    } else {
      PopupUtils.showError('Cannot setting current dashboard!');
    }
  }

  private handlePasteChart() {
    this.hideMenuOptions();
    if (DashboardModule.copiedData) {
      EventBus.pasteData(DashboardModule.copiedData);
    }
  }

  private async handleApplySetting(newSetting: DashboardSetting) {
    try {
      await DashboardModule.saveSetting(newSetting);
    } catch (ex) {
      PopupUtils.showError('Save setting error, try again');
      Log.error('Apply setting error', ex);
    }
  }

  private resizeChart() {
    window.dispatchEvent(new Event('resize'));
  }

  private showBoostMenu(event: MouseEvent) {
    this.$root.$emit(DashboardEvents.ShowBoostMenu, event);
  }

  private get boostEnable(): boolean {
    return DashboardModule.currentDashboard?.boostInfo?.enable ?? false;
  }

  private openRelationshipModal(): void {
    this.hideMenuOptions();
    this.$nextTick(() => {
      this.$nextTick(() => {
        this.relationshipModal?.show();
      });
    });
  }

  private openOptionMenu(): void {
    this.$nextTick(() => {
      this.$nextTick(() => {
        this.isShowOptionMenu = !this.isShowOptionMenu;
      });
    });
  }

  hideMenuOptions(): void {
    this.isShowOptionMenu = false;
  }

  private exitRLSViewAs() {
    ChartDataModule.resetViewAsUser();
    this.toViewMode();
    EventBus.exitRLSViewAs();
  }

  private userDisplayName(user: UserProfile) {
    return user.getName;
  }

  private showRLSViewAsModal() {
    this.rlsViewAsModal?.show(user => {
      ChartDataModule.setViewAsUser(user);
      EventBus.rlsViewAs(user);
      this.toRlsViewAsMode();
    });
  }
}
