import BoostContextMenu from '@/screens/dashboard-detail/components/dashboard-control-bar/BoostContextMenu.vue';
import DashboardSettingModal from '@/screens/dashboard-detail/components/dashboard-setting-modal/DashboardSettingModal.vue';
import PerformanceBoostModal from '@/screens/dashboard-detail/components/PerformanceBoostModal.vue';
import SelectFieldButton from '@/screens/dashboard-detail/components/SelectFieldButton.vue';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { ChartDataModule, DashboardModeModule, DashboardModule, FilterModule, MainDateData, WidgetModule } from '@/screens/dashboard-detail/stores';
import { ContextMenuItem, DashboardMode, DashboardOptions, DateRange } from '@/shared';
import { Track } from '@/shared/anotation';
import PermissionWidget from '@/shared/components/PermissionWidget.vue';
import { Stores } from '@/shared/enums/Stores';
import { ListUtils } from '@/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { GenIdMethods } from '@/utils/IdGenerator';
import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import { PopupUtils } from '@/utils/PopupUtils';
import {
  DashboardSetting,
  DIException,
  Field,
  MainDateFilter as DateFilter,
  MainDateMode,
  Position,
  TabWidget,
  TextWidget,
  UserProfile
} from '@core/common/domain';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Log } from '@core/utils';
import { ChartUtils } from '@/utils/ChartUtils';
import MainDateFilter from '@filter/main-date-filter-v2/MainDateFilter.vue';
import SetupMainDateFilter from '@filter/main-date-filter-v2/SetupMainDateFilter.vue';
import { Component, Inject, Prop, Provide, Ref, Vue } from 'vue-property-decorator';
import { mapGetters, mapState } from 'vuex';
import RelationshipModal from '@/screens/dashboard-detail/components/RelationshipModal.vue';
import DashboardRelationshipIcon from '@/shared/components/Icon/DashboardRelationshipIcon.vue';
import RLSViewAsModal from '@/screens/dashboard-detail/components/dashboard-control-bar/RLSViewAsModal.vue';
import { BPopover } from 'bootstrap-vue';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import ClickOutside from 'vue-click-outside';
import { EventBus } from '@/event-bus/EventBus';
import { FilterPanel } from '@core/common/domain/model/widget/normal/FilterPanel';

const $ = window.$;

@Component({
  computed: {
    ...mapGetters(Stores.DashboardModeStore, ['isViewMode', 'isFullScreen', 'isTVMode']),
    ...mapState(Stores.DashboardModeStore, ['mode']),
    ...mapState(Stores.DashboardStore, ['mainDateFilter'])
  },
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
  },
  directives: {
    ClickOutside
  }
})
export default class DashboardControlBar extends Vue {
  private popupItem: Element | null = null;

  static readonly TO_EDIT_MODE = 'to_edit';
  static readonly TO_VIEW_MODE = 'to_view';
  static readonly TO_FULL_SCREEN_MODE = 'to_full_screen';
  static readonly TO_TV_MODE = 'to_tv_mode';
  static readonly TO_RLS_VIEW_AS = 'to_rls_view_as';

  private readonly optionMenuId = 'dashboard-options-menu';
  private readonly optionButtonId = 'dashboard-options-button';
  private isShowOptionMenu = false;

  @Prop({ type: Boolean, default: false })
  showResetFilters!: boolean;
  isFullScreen!: boolean;
  isTVMode!: boolean;
  isViewMode!: boolean;
  mode!: DashboardMode;
  textWidget!: TextWidget;
  mainDateFilter!: DateFilter;
  date: DateRange = {
    start: '',
    end: ''
  };
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

  private isResetMainDateFilter = false;

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
        text: DashboardOptions.ADD_FILTER_PANEL,
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

  private currentDirectoryId: number | null = null;

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

  get isShowMainDateFilter() {
    //sua ten
    if (this.mainDateFilter && !this.isResetMainDateFilter) {
      return true;
    }
    return false;
  }

  private isMobile() {
    return ChartUtils.isMobile();
  }

  private get optionMenuPlacement(): string {
    return 'bottom';
  }

  private get isEditDashboardMode() {
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
  handleResetMainDate() {
    this.isResetMainDateFilter = true;
    Log.debug('Catch reset main date filter');
  }

  async switchMode(mode: string): Promise<void> {
    switch (mode) {
      case DashboardControlBar.TO_VIEW_MODE: {
        const newMode = this.mode == DashboardMode.EditFullScreen ? DashboardMode.ViewFullScreen : DashboardMode.View;
        await this.setupTvMode(false);
        DashboardModeModule.setMode(newMode);
        break;
      }

      case DashboardControlBar.TO_EDIT_MODE: {
        const newMode = this.mode == DashboardMode.ViewFullScreen ? DashboardMode.EditFullScreen : DashboardMode.Edit;
        DashboardModeModule.setMode(newMode);
        break;
      }

      case DashboardControlBar.TO_FULL_SCREEN_MODE: {
        const newMode = this.mode == DashboardMode.View ? DashboardMode.ViewFullScreen : DashboardMode.View;
        DashboardModeModule.setMode(newMode);
        // this.onFullscreenChange()
        this.resizeChart();
        break;
      }

      case DashboardControlBar.TO_RLS_VIEW_AS: {
        DashboardModeModule.setMode(DashboardMode.RLSViewAsMode);
        break;
      }

      case DashboardControlBar.TO_TV_MODE: {
        DashboardModeModule.setMode(DashboardMode.TVMode);
        await this.setupTvMode(true);
        break;
      }
    }
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

  async clickShare() {
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

  private async clickViewAs() {
    // await this.switchMode(DashboardControlBar.TO_RLS_VIEW_AS);
    this.showRLSViewAsModal();
  }

  @Track(TrackEvents.ShareDashboard, {
    dashboard_id: (_: DashboardControlBar, args: any) => args[1]
  })
  private showShareModal(dashboardId: string) {
    this.$root.$emit(DashboardEvents.ShowShareModal, +dashboardId);
  }

  async handleEditMainDateFilter(newMainDateFilter: DateFilter) {
    try {
      await DashboardModule.handleEditMainDateFilter(newMainDateFilter);
    } catch (e) {
      Log.debug('DashboardControlBar::handleUploadMainDateFilter::err::', e);
    }
  }

  async handleSetupMainDateFilter(field: Field, mode: MainDateMode) {
    const mainDateFilter: DateFilter = new DateFilter(field, mode);
    try {
      this.handleEditMainDateFilter(mainDateFilter);
      DashboardModule.setMainDateFilter(mainDateFilter);
      const mainDateDate: MainDateData = { mode: mode };
      DashboardModule.saveMainDateFilterMode(mainDateDate);
      DashboardModule.setMainDateFilterMode(mode);
      FilterModule.loadDateRangeFilter(mainDateDate);
      FilterModule.handleMainDateFilterChange();
    } catch (e) {
      Log.debug('dashboardControlBar::handleSetupMainDateFilter::error', e);
    }

    this.isResetMainDateFilter = false;
  }

  private mounted() {
    $(window.document.body).on('fullscreenchange', this.onFullscreenChange);
  }

  private destroyed() {
    $(window.document.body).off('fullscreenchange', this.onFullscreenChange);
  }

  private async onFullscreenChange() {
    const dashboardEl = $('.grid-stack-container');
    if (!window.document.fullscreenElement) {
      await this.switchMode(DashboardControlBar.TO_VIEW_MODE);
      // remove scale dashboard
      dashboardEl.css({
        transform: ''
      });
    } else {
      // scale dashboard
      if (dashboardEl.length > 0) {
        const dashboardHeight = dashboardEl.height();
        const contentHeight = $('body').height() - 60;
        const scale = contentHeight / dashboardHeight;
        const translateY = ((contentHeight - dashboardHeight) / 2 / contentHeight) * 100;
        Log.info({ dashboardHeight, contentHeight, scale, translateY });
        if (scale < 1) {
          dashboardEl.css({
            transform: `scale(${scale}) translateY(${translateY}%)`
          });
        }
      }
    }
  }

  private async setupTvMode(isTvMode: boolean) {
    if (isTvMode) {
      // request fullscreen
      if (!window.document.fullscreenElement) {
        await window.document.body.requestFullscreen().catch(err => {
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
      const newTab = FilterPanel.empty();
      const panel: FilterPanel = (await WidgetModule.handleCreateTabWidget(newTab)) as FilterPanel;
      FilterModule.addFilterPanelInfo(panel);
    } catch (ex) {
      Log.error('DashboardControlBar::handleAddFilterPanel::ex', ex);
    }
  }

  private handleAddDynamicControl() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      DataManager.saveCurrentDashboardId(dashboard.id.toString());
      DataManager.saveCurrentDashboard(dashboard);
    }
    // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
    this.$root.$emit(DashboardEvents.AddDynamicControl);
  }

  @Track(TrackEvents.DashboardResetFilter, { dashboard_id: (_: DashboardControlBar) => _.dashboardId })
  private resetFilter(): void {
    if (this.handleResetFilter) {
      this.handleResetFilter();
    }
  }

  private handleClearResetMainDate() {
    if (this.isResetMainDateFilter) {
      this.isResetMainDateFilter = false;
    }
  }

  private showDashboardSetting() {
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
    this.hideOptionMenu();
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

  private openRelationshipModal() {
    this.relationshipModal?.show();
  }

  private openOptionMenu() {
    this.isShowOptionMenu = !this.isShowOptionMenu;
    this.popupItem = this.popupItem = document.querySelector('#' + this.optionButtonId);
  }

  hideOptionMenu() {
    this.isShowOptionMenu = false;
  }

  private exitRLSViewAs() {
    ChartDataModule.resetViewAsUser();
    this.switchMode(DashboardControlBar.TO_VIEW_MODE);
    EventBus.exitRLSViewAs();
  }

  private userDisplayName(user: UserProfile) {
    return user.getName;
  }

  private showRLSViewAsModal() {
    this.rlsViewAsModal?.show(user => {
      ChartDataModule.setViewAsUser(user);
      EventBus.rlsViewAs(user);
      this.switchMode(DashboardControlBar.TO_RLS_VIEW_AS);
    });
  }
}
