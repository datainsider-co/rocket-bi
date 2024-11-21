import AddChartModal from '@/screens/dashboard-detail/components/AddChartModal.vue';
import BoostContextMenu from '@/screens/dashboard-detail/components/dashboard-control-bar/BoostContextMenu.vue';
import SortModal from '@/screens/dashboard-detail/components/SortModal.vue';
import { cloneDeep, isEqual } from 'lodash';
import { Component, Ref, Vue, Watch, Provide } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import {
  ChartInfo,
  ChartInfoType,
  DashboardId,
  DashboardSetting,
  DatabaseInfo,
  createQueryParameter,
  DIException,
  FilterableSetting,
  FunctionController,
  GroupFilter,
  ImageWidget,
  InlineSqlView,
  Position,
  QueryParameter,
  QuerySetting,
  SizeInfo,
  SizeUnit,
  TableSchema,
  TabWidget,
  TextWidget,
  UserProfile,
  ValueController,
  ValueControlType,
  Widget,
  WidgetId
} from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import {
  ChartDataModule,
  DashboardControllerModule,
  DashboardModeModule,
  DashboardModule,
  DrilldownDataStoreModule,
  FilterModule,
  QuerySettingModule,
  WidgetModule
} from '@/screens/dashboard-detail/stores';
import EditTextModal from '@/screens/dashboard-detail/components/EditTextModal.vue';
import DashboardHeader from '@/screens/dashboard-detail/components/DashboardHeader.vue';
import Dashboard from '@/screens/dashboard-detail/components/dashboard/Dashboard.vue';
import DashboardCtrl from '@/screens/dashboard-detail/components/dashboard/Dashboard.ts';
import EmptyDashboard from '@/screens/dashboard-detail/components/EmptyDashboard.vue';
import { ContextMenuItem, DashboardMode, Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Routers } from '@/shared/enums/Routers';
import ParamInfo, { RouterUtils } from '@/utils/RouterUtils';
import { Inject } from 'typescript-ioc';
import { DataManager } from '@core/common/services';
import { PermissionHandlerModule } from '@/store/modules/PermissionHandler';
import { ActionType, ActionTypeMapActions, ResourceType } from '@/utils/PermissionUtils';
import ChartComponents from '@chart/index';
import { ZoomModule } from '@/store/modules/ZoomStore';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { Log } from '@core/utils';
import GridStackComponents from '@/shared/components/gridstack/install';
import { PopupUtils } from '@/utils/PopupUtils';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import ChartBuilderComponent from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderComponent.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import DiShareModal from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { ChartUtils, ListUtils, TimeoutUtils } from '@/utils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { AdhocBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';
import { EventBus } from '@/event-bus/EventBus';
import PasswordModal from '@/screens/dashboard-detail/components/PasswordModal.vue';
import { CopiedData, CopiedDataType } from '@/screens/dashboard-detail/intefaces/CopiedData';
import ImageBrowserModal from '@/screens/dashboard-detail/components/upload/ImageBrowserModal.vue';
import EditDashboardModal from '@/screens/dashboard-detail/components/dashboard-setting-modal/EditDashboardModal.vue';
import DashboardSettingModal from '@/screens/dashboard-detail/components/dashboard-setting-modal/DashboardSettingModal.vue';
import TabSettingModal from '@/screens/dashboard-detail/components/TabSettingModal.vue';
import WidgetSettingModal from '@/screens/dashboard-detail/components/widget-setting/WidgetSettingModal.vue';

Vue.use(ChartComponents);
Vue.use(GridStackComponents);

@Component({
  inheritAttrs: true,
  components: {
    DashboardHeader,
    EmptyDashboard,
    Dashboard,
    EditTextModal,
    StatusWidget,
    ErrorWidget,
    ChartBuilderComponent,
    BoostContextMenu,
    TabSettingModal,
    AddChartModal,
    SortModal,
    PasswordModal,
    ImageBrowserModal,
    EditDashboardModal,
    DashboardSettingModal,
    WidgetSettingModal
  }
})
export default class DashboardDetail extends Vue {
  protected readonly Status = Status;

  protected isMobile = false;

  @Ref()
  protected readonly contextMenu!: ContextMenu;
  @Ref()
  protected readonly editTextModal!: EditTextModal;
  @Ref()
  protected readonly shareModal!: DiShareModal;
  @Ref()
  protected readonly headerBar!: HTMLElement;

  @Ref()
  protected readonly chartBuilderComponent!: ChartBuilderComponent;

  @Ref()
  protected readonly tabSettingModal!: TabSettingModal;

  @Ref()
  protected readonly addChartModal!: AddChartModal;

  @Ref()
  protected readonly sortModal!: SortModal;

  @Ref()
  protected readonly dashboardHeader?: DashboardHeader;

  @Inject
  protected readonly schemaService!: SchemaService;
  @Ref()
  protected readonly boostContextMenu?: BoostContextMenu;

  @Ref()
  protected readonly dashboard!: DashboardCtrl;

  @Ref()
  protected readonly passwordModal!: PasswordModal;

  @Ref()
  protected readonly imageBrowserModal!: ImageBrowserModal;

  @Ref()
  protected readonly settingButton?: HTMLElement;

  @Ref()
  protected readonly editDashboardModal!: EditDashboardModal;

  @Ref()
  protected readonly dashboardSettingModal!: DashboardSettingModal;

  @Ref()
  protected readonly widgetSettingModal!: WidgetSettingModal;

  @Ref()
  protected readonly dashboardContent!: HTMLDivElement;

  @Ref()
  protected readonly dashboardBody!: HTMLDivElement;

  @Provide()
  protected getIsMobile(): boolean {
    return this.isMobile;
  }

  @Provide()
  getCellWidth(): number | undefined {
    return this.dashboard?.getCellWidth();
  }

  get paramInfo(): ParamInfo {
    return RouterUtils.parseToParamInfo(this.$route.params.name);
  }

  get token(): string | undefined {
    return RouterUtils.getToken(this.$route);
  }

  /**
   * all variable css style for dashboard, it defined in DashboardDetail.scss
   */
  get dashboardCssStyle(): any {
    return {
      '--dashboard-background-color': this.dashboardSetting.background.toColorCss(),
      '--dashboard-background-image': this.dashboardSetting.backgroundImage.toImageCssStyle(),
      '--dashboard-background-filter': this.dashboardSetting.backgroundImage.toFilterCssStyle(),
      '--dashboard-border-radius': this.dashboardSetting.border.radius.toCssStyle(),
      '--dashboard-content-width': this.dashboardSetting.size.toWidthCssStyle(),
      '--dashboard-stroke-width': this.dashboardSetting.border.toWidthCss(),
      '--dashboard-stroke-color': this.dashboardSetting.border.toColorCss()
    };
  }

  get dashboardPaddingClass(): any {
    return {
      'full-screen-mode': this.isFullScreen,
      'tv-mode': this.isTVMode,
      'normal-mode': !(this.isFullScreen || this.isTVMode)
    };
  }

  get dashboardSetting(): DashboardSetting {
    return DashboardModule.setting;
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

  protected get isEditMode(): boolean {
    return DashboardModeModule.isEditMode;
  }

  @Watch('isEditMode')
  onIsEditModeChanged(isEditMode: boolean) {
    if (isEditMode) {
      this.updatePositionSettingButton();
    }
  }

  protected get errorMsg(): string {
    return DashboardModule.errorMessage;
  }

  protected get hasWidget(): boolean {
    return DashboardModule.hasWidget;
  }

  protected get dashboardStatus(): Status {
    return DashboardModule.dashboardStatus;
  }

  protected get isLogin(): boolean {
    return RouterUtils.isLogin();
  }

  protected get allActions(): Set<ActionType> {
    return PermissionHandlerModule.allActions as Set<ActionType>;
  }

  @Watch('allActions')
  async onActionsChanged(allActions: Set<ActionType>) {
    await DashboardModeModule.handleActionChange(allActions);
  }

  @Watch('hasWidget')
  onHasWidgetChanged(currentValue: boolean, oldValue: boolean): void {
    const isEmptyWidget = oldValue && !currentValue;
    if (isEmptyWidget && this.dashboardHeader) {
      this.dashboardHeader.handleResetFilter();
    }
  }

  async created() {
    if (RouterUtils.isLogin() || RouterUtils.isHaveToken()) {
      await this.loadDashboard();
      await this.loadPermissions();
    } else {
      // DatabaseSchemaModule.reset();
      _BuilderTableSchemaStore.reset();
      await AuthenticationModule.logout();
    }
  }

  async handleEditText(textWidget: TextWidget) {
    if (StringUtils.isNotEmpty(textWidget.content)) {
      try {
        this.editTextModal.setLoading(true);
        const isSuccess: boolean = await WidgetModule.handleUpdateWidget(textWidget);
        if (isSuccess) {
          WidgetModule.setWidget({
            widgetId: textWidget.id,
            widget: textWidget
          });
          await WidgetModule.handleUpdateWidget(textWidget);

          // const currentPosition = WidgetModule.getPosition(textWidget.id);
          // this.dashboard.handleChangePosition({ id: textWidget.id, position: currentPosition });
          // this.dashboard.gridstack?.updateItem(textWidget.id, currentPosition.width, currentPosition.height);
          // Log.debug('DashboardDetail::cellWidth::', currentPosition);
          //todo: call api update position
          this.editTextModal.hide();
        }
      } catch (ex) {
        this.showError('Edit text failure! Try again later', ex);
      } finally {
        this.editTextModal.setLoading(false);
      }
    }
  }
  getWidgetHeightFromTextHeight(height: number): number {
    return Math.ceil(height / (Dashboard.getCellHeight() ?? 1));
  }

  handleCreateText(textWidget: TextWidget, height: number) {
    if (StringUtils.isNotEmpty(textWidget.content)) {
      try {
        this.editTextModal.setLoading(true);
        const position = textWidget.getDefaultPosition();
        position.width = 48 / 3;
        position.height = this.getWidgetHeightFromTextHeight(height);
        WidgetModule.handleCreateTextWidget({
          widget: textWidget,
          position: position
        }).catch(ex => this.showError('Create text failure! Try again later', ex));
        this.editTextModal.hide();
      } catch (e) {
        const ex = DIException.fromObject(e);
        this.showError(ex.message, ex);
      } finally {
        this.editTextModal.setLoading(false);
      }
    }
  }

  showError(reason: string, ex: DIException): void {
    Log.error('DashboardDetail::showError', ex);
    PopupUtils.showError(reason);
  }

  // hook
  beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>) {
    try {
      RouterUtils.ensureDashboardId(to);
      const paramInfo: ParamInfo = RouterUtils.parseToParamInfo(to.params.name);
      Log.debug('beforeRouteEnter::dashboardId::', paramInfo);
      _ConfigBuilderStore.setAllowBack(true);
      _ThemeStore.setAllowApplyMainTheme(false);
      DashboardModule.loadThemeFromLocal(paramInfo.idAsNumber());

      if (from && from.name != Routers.ChartBuilder) {
        DashboardModule.setPreviousPage(from);
      }
      next();
    } catch (e) {
      if (e instanceof DIException) {
        // will handle ex in here
      } else {
        // Exception not handle yet
        Log.error('Exception in beforeRouteEnter::', e?.message);
      }
      next({ name: Routers.NotFound });
    }
  }

  async beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>) {
    const allowBack = !this.dashboardHeader?.isEditMode();
    _ConfigBuilderStore.setAllowBack(allowBack);
    if (await _ConfigBuilderStore.requireConfirmBack()) {
      await next();
      _ThemeStore.clearDashboardStyle();
      _ThemeStore.revertToMainTheme();
      this.clearData();
    } else {
      next(false);
    }
  }

  protected clearData() {
    PermissionHandlerModule.reset();
    DashboardModule.reset();
    DashboardControllerModule.reset();
    ChartDataModule.reset();
    ZoomModule.reset();
    FilterModule.reset();
    DashboardModeModule.setMode(DashboardMode.View);
    DrilldownDataStoreModule.reset();
    QuerySettingModule.reset();
    GeolocationModule.reset();
    if (DashboardModeModule.canEdit) {
      WidgetModule.saveWidgetPosition();
    }
  }
  mounted() {
    this.isMobile = ChartUtils.isMobile();
    this.registerEvents();
  }

  beforeDestroy() {
    this.unregisterEvents();
    ChartDataModule.resetViewAsUser();
  }

  protected async loadPermissions() {
    if (DashboardModule.isOwner) {
      Log.debug('DashboardDetail::created::isOwner:: true');
      PermissionHandlerModule.setCurrentActionData({
        token: DataManager.getToken(),
        actionsFromToken: [],
        actionsFromUser: ActionTypeMapActions[ActionType.all]
      });
    } else {
      await PermissionHandlerModule.loadPermittedActions({
        token: DataManager.getToken(),
        session: DataManager.getSession(),
        resourceType: ResourceType.dashboard,
        resourceId: this.paramInfo.id,
        actions: ActionTypeMapActions[ActionType.all]
      });
    }
  }

  protected registerEvents() {
    this.$root.$on(DashboardEvents.AddChart, this.onAddChart);
    this.$root.$on(DashboardEvents.UpdateChart, this.onUpdateChart);
    this.$root.$on(DashboardEvents.AddInnerFilter, this.onAddInnerFilter);
    this.$root.$on(DashboardEvents.UpdateInnerFilter, this.onUpdateInnerFilter);
    this.$root.$on(DashboardEvents.ShowShareModal, this.onShowShareModal);
    this.$root.$on(DashboardEvents.ShowContextMenu, this.onShowContextMenu);
    this.$root.$on(DashboardEvents.ShowEditTextModal, this.onEditTextModal);
    this.$root.$on(DashboardEvents.ShowBoostMenu, this.showBoostMenu);
    this.$root.$on(DashboardEvents.UpdateTab, this.onUpdateTab);
    this.$root.$on(DashboardEvents.AddChartToTab, this.onAddChartToTab);
    this.$root.$on(DashboardEvents.AddFilterToGroup, this.onAddFilterToGroup);
    this.$root.$on(DashboardEvents.RemoveChartFromTab, this.onMoveChartFromTabToDashboard);
    this.$root.$on(DashboardEvents.SortTab, this.onSortTab);
    this.$root.$on(DashboardEvents.ShowImageBrowserModal, this.showImageBrowserModal);
    EventBus.onRLSViewAs(this.loadViewAsDashboard);
    EventBus.onExitRLSViewAs(this.loadDashboard);
    EventBus.onPasteData(this.processCopiedData);
    window.document.addEventListener('paste', this.handlePasteEvent);
    window.addEventListener('resize', this.handleResize);
    document.body.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  protected unregisterEvents() {
    this.$root.$off(DashboardEvents.AddChart, this.onAddChart);
    this.$root.$off(DashboardEvents.UpdateChart, this.onUpdateChart);
    this.$root.$off(DashboardEvents.AddInnerFilter, this.onAddInnerFilter);
    this.$root.$off(DashboardEvents.UpdateInnerFilter, this.onUpdateInnerFilter);
    this.$root.$off(DashboardEvents.ShowShareModal, this.onShowShareModal);
    this.$root.$off(DashboardEvents.ShowContextMenu, this.onShowContextMenu);
    this.$root.$off(DashboardEvents.ShowEditTextModal, this.onEditTextModal);
    this.$root.$off(DashboardEvents.ShowBoostMenu, this.showBoostMenu);
    this.$root.$off(DashboardEvents.UpdateTab, this.onUpdateTab);
    this.$root.$off(DashboardEvents.AddChartToTab, this.onAddChartToTab);
    this.$root.$off(DashboardEvents.AddFilterToGroup, this.onAddFilterToGroup);
    this.$root.$off(DashboardEvents.RemoveChartFromTab, this.onMoveChartFromTabToDashboard);
    this.$root.$off(DashboardEvents.SortTab, this.onSortTab);
    this.$root.$off(DashboardEvents.ShowImageBrowserModal, this.showImageBrowserModal);
    EventBus.offRLSViewAs(this.loadViewAsDashboard);
    EventBus.offExitRLSViewAs(this.loadDashboard);
    EventBus.offPasteData(this.processCopiedData);
    window.document.removeEventListener('paste', this.handlePasteEvent);
    window.addEventListener('resize', this.handleResize);
    document.body.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  protected async onFullscreenChange(): Promise<void> {
    const dashboardEl: HTMLDivElement = this.dashboardContent;
    if (!window.document.fullscreenElement) {
      await this.dashboardHeader?.getControlBar()?.toViewMode();
      // remove scale dashboard
      dashboardEl.style.transform = '';
      this.$el.classList.remove('dashboard-fullscreen-mode');
    } else {
      // scale dashboard
      if (dashboardEl) {
        this.$nextTick(() => {
          const dashboardHeight = dashboardEl.offsetHeight;
          const bodyHeight = document.body.offsetHeight + 45;
          const scaleRatio = bodyHeight / dashboardHeight;
          const translateY = ((bodyHeight - dashboardHeight) / 2 / bodyHeight) * 100;
          Log.info('onFullScreenChange', { dashboardHeight, bodyHeight, scale: scaleRatio, translateY });
          // Log.info('onFullScreenChange' , { dashboardHeight, bodyHeight, scale: scaleRatio, translateY });
          this.$el.classList.add('dashboard-fullscreen-mode');
          if (scaleRatio < 1) {
            dashboardEl.style.transform = `scale(${scaleRatio}) translateY(${translateY}%)`;
          }
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.dashboardBody.scrollTo({ top: 0, behavior: 'smooth' });
            });
          });
        });
      }
    }
  }

  protected handleResize() {
    this.isMobile = ChartUtils.isMobile();
    EventBus.resizeDashboard(this.isMobile);
  }

  protected async handlePasteEvent(event: ClipboardEvent) {
    const copiedData: string = event.clipboardData?.getData('text') ?? '{}';
    const data: CopiedData | undefined = CopiedData.fromObject(JSON.parse(copiedData));
    await this.processCopiedData(data);
  }

  protected async processCopiedData(data: CopiedData | undefined) {
    Log.debug('handleOnPaste::copiedData', data);
    if (data && CopiedData.isSameOrigin(data)) {
      switch (data.type) {
        case CopiedDataType.Chart: {
          await this.pasteChart(data);
          break;
        }
        case CopiedDataType.Widget: {
          await this.pasteWidget(data);
          break;
        }
        default: {
          PopupUtils.showError('Unsupported paste this chart data');
          break;
        }
      }
    } else {
      Log.debug('handleOnPaste:: cannot paste data cause incompatible chart data');
      PopupUtils.showError('Incompatible this chart data');
    }
  }

  protected async pasteChart(data: CopiedData) {
    try {
      const obj = JSON.parse(data.transferData);
      const chartInfo = ChartInfo.fromObject(obj.widget);
      const position = Position.fromObject(obj.position);
      position.resetRowColumn();
      await this.addChart(chartInfo, position);
    } catch (ex) {
      Log.error('handlePasteChart::error', ex);
      PopupUtils.showError('Failed to paste chart');
    }
  }

  protected async pasteWidget(data: CopiedData) {
    try {
      const obj = JSON.parse(data.transferData);
      const widget = Widget.fromObject(obj.widget);
      const position = Position.fromObject(obj.position);
      position.resetRowColumn();
      await WidgetModule.handleCreateTextWidget({
        widget: widget,
        position: position
      });
    } catch (ex) {
      Log.error('handlePasteChart::error', ex);
      PopupUtils.showError('Failed to paste chart');
    }
  }

  protected async loadDashboard(): Promise<void> {
    try {
      const dashboardId: number = this.paramInfo.idAsNumber();
      await DashboardModule.init(dashboardId);
      await DashboardModule.loadDirectory(dashboardId);
      await this.updateRouter(dashboardId, DashboardModule.title);
      await this.passwordModal.requirePassword(
        DashboardModule.currentDirectory!,
        DashboardModule.currentDashboard!.ownerId,
        async () => {
          await FilterModule.init();
          await DashboardControllerModule.init();
          DashboardControllerModule.applyAutoRefresh(this.dashboardSetting.autoRefreshSetting);
        },
        () => {
          _ConfigBuilderStore.setAllowBack(true);
          this.$router.back();
        }
      );
    } catch (ex) {
      Log.error('loadDashboard::error', ex);
      // Ignored
    }
  }

  protected loadViewAsDashboard(viewAsUser: UserProfile) {
    Log.debug('DashboardDetail::loadViewAsDashboard::viewAsUser::', viewAsUser);
    return this.loadDashboard();
  }

  protected onScrollDashboard(event: Event) {
    const percentY = (event.target as HTMLElement).scrollTop / ((event.target as HTMLElement).scrollHeight - (event.target as HTMLElement).clientHeight);
    if (percentY > 0.01) {
      this.$el.classList.add('dashboard-scrolling');
    } else {
      this.$el.classList.remove('dashboard-scrolling');
    }

    this.updatePositionSettingButton();
  }

  // fixed position of setting always on top right on dashboardBody
  protected updatePositionSettingButton() {
    // const top = (this.dashboardBody ? this.dashboardBody.scrollTop : 0) + 16
    if (this.dashboardBody && this.settingButton && this.dashboardContent) {
      const dashboardBodyRect = this.dashboardBody.getBoundingClientRect();
      const dashboardContentRect = this.dashboardContent.getBoundingClientRect();
      const top = dashboardBodyRect.top + 19;
      this.settingButton.style.top = StringUtils.toPx(top);

      const bodyRight = window.innerWidth - dashboardBodyRect.right + 14;
      const contentRight = window.innerWidth - dashboardContentRect.right + 16;

      if (contentRight > 0 && contentRight > bodyRight) {
        this.settingButton.style.right = StringUtils.toPx(contentRight);
      } else {
        this.settingButton.style.right = StringUtils.toPx(bodyRight);
      }
    }
  }

  protected onAddChart() {
    DashboardControllerModule.stopAutoRefresh();
    this.chartBuilderComponent.showModal({
      onCompleted: async newChart => {
        DashboardControllerModule.applyAutoRefresh(this.dashboardSetting.autoRefreshSetting);
        await this.addChart(newChart);
      },
      onCancel: () => {
        DashboardControllerModule.applyAutoRefresh(this.dashboardSetting.autoRefreshSetting);
      },
      chartControls: DashboardModule.chartControls
    });
  }

  protected async onUpdateTab(tab: TabWidget) {
    this.tabSettingModal.show(tab, updatedTab => {
      WidgetModule.handleUpdateWidget(updatedTab);
      WidgetModule.setWidget({ widgetId: updatedTab.id, widget: updatedTab });
    });
  }

  protected async onAddChartToTab(widget: TabWidget, tabIndex: number) {
    const currentDashboard = DashboardModule.currentDashboard;
    if (currentDashboard) {
      Log.debug('onAddChartToTab', WidgetModule.widgetInDashboard);
      this.addChartModal.show(WidgetModule.widgetInDashboard, {
        onCompleted: widgetIds => {
          this.dashboard.removeWidgets(widgetIds);
          WidgetModule.addWidgetsToTab({ tabWidget: widget, tabIndex: tabIndex, widgetIds: widgetIds });
        },
        emptyText: 'No charts have been added to this tab',
        actionName: 'Add',
        title: 'Add Chart',
        subTitle: 'Select chart to add to this tab'
      });
    }
  }

  protected async onAddFilterToGroup(widget: GroupFilter, tabIndex: number): Promise<void> {
    const currentDashboard = DashboardModule.currentDashboard;
    if (currentDashboard) {
      const filtersInDashboard = WidgetModule.widgetInDashboard.filter(
        widget => ChartInfo.isChartInfo(widget) && FilterableSetting.isFilterable(widget.setting)
      );
      this.addChartModal.show(filtersInDashboard, {
        onCompleted: widgetIds => {
          this.dashboard.removeWidgets(widgetIds);
          WidgetModule.addWidgetsToTab({ tabWidget: widget, tabIndex: tabIndex, widgetIds: widgetIds });
        },
        emptyText: 'No filters have been added to this group',
        actionName: 'Add',
        title: 'Add Filter',
        subTitle: 'Select filter to add to this group'
      });
    }
  }

  protected async onSortTab(widget: TabWidget) {
    this.sortModal.show(widget.tabItems, {
      displayName: 'name',
      onCompleted: tabs => {
        const updateTabWidget = cloneDeep(widget);
        updateTabWidget.tabItems = tabs;
        WidgetModule.handleUpdateWidget(updateTabWidget);
        WidgetModule.setWidget({ widgetId: updateTabWidget.id, widget: updateTabWidget });
      }
    });
  }

  protected async onMoveChartFromTabToDashboard(
    tabWidget: TabWidget,
    tabIndex: number,
    onSelected: (widgetIds: WidgetId[]) => void,
    deleteTabWhenEmpty: boolean,
    content: {
      emptyText: string;
      actionName: string;
      title: string;
      subTitle: string;
    }
  ) {
    const currentDashboard = DashboardModule.currentDashboard;
    if (currentDashboard) {
      const widgets: Widget[] = tabWidget.getTab(tabIndex).widgetIds.map(id => WidgetModule.widgetAsMap[id]);
      this.addChartModal.show(widgets, {
        onCompleted: widgetIds => {
          onSelected(widgetIds);
          WidgetModule.removeWidgetFromTab({ tabWidget: tabWidget, tabIndex: tabIndex, widgetIds: widgetIds, deleteTabWhenEmpty: deleteTabWhenEmpty });
          // fixme: missing case apply apply filter
        },
        emptyText: content.emptyText,
        actionName: content.actionName,
        title: content.title,
        subTitle: content.subTitle
      });
    }
  }

  protected async onUpdateChart(currentChartInfo: ChartInfo) {
    const currentView: InlineSqlView | undefined = ListUtils.getHead(currentChartInfo.setting.sqlViews);
    const currentQueryParam: Record<string, string> = this.getQueryParamValuesOfWidget(currentChartInfo);
    // ignore current chart in chartControllers
    const chartControls = DashboardModule.chartControls.filter(controller => controller.getControlId() !== currentChartInfo.id);
    if (currentView) {
      try {
        const tableSchema: TableSchema = await this.getAdhocTable(
          this.assignParameterValues(currentView.query.query, currentQueryParam),
          currentView.aliasName
        );
        //Adhoc Chart
        this.chartBuilderComponent.showModal({
          chart: currentChartInfo,
          onCompleted: this.updateChart,
          selectedTables: [tableSchema.name],
          database: DatabaseInfo.adhoc(tableSchema),
          config: AdhocBuilderConfig,
          chartControls: chartControls
        });
      } catch (e) {
        this.chartBuilderComponent.showModal({
          chart: currentChartInfo,
          onCompleted: this.updateChart
        });
      }
    } else {
      Log.debug('onUpdateChart::', currentChartInfo);
      //Normal chart
      this.chartBuilderComponent.showModal({
        chart: currentChartInfo,
        onCompleted: this.updateChart,
        chartControls: chartControls
      });
    }
  }

  protected getQueryParamValuesOfWidget(chart: ChartInfo): Record<string, string> {
    const parameterWidgetIds: WidgetId[] = chart.setting.getChartOption()?.options?.parameterWidgetIds ?? [];
    Log.debug('getQueryParamValuesOfWidget::', parameterWidgetIds);
    return Object.fromEntries(
      parameterWidgetIds
        .map(id => {
          const parameter: QueryParameter = (WidgetModule.widgetAsMap[id] as ChartInfo)?.setting?.toQueryParameter() ?? createQueryParameter();
          const value = ListUtils.getHead(QuerySettingModule.getDynamicValueAsList(id) ?? []) ?? parameter.value;
          return [parameter.displayName, QuerySetting.formatParamValue(parameter.valueType, value)];
        })
        .filter(paramEntry => StringUtils.isNotEmpty(paramEntry[0])) //paramEntry[0] => Key (ex: ['xyz', '123'], paramEntry[0] = xyz)
    );
  }

  protected async getAdhocTable(query: string, tblName?: string): Promise<TableSchema> {
    const tableSchema = await this.schemaService.detectTableSchema(query);
    tableSchema.name = tblName ?? tableSchema.name;
    return tableSchema;
  }

  protected onAddInnerFilter(chartInfo: ChartInfo) {
    this.chartBuilderComponent.showAddInnerFilterModal(chartInfo);
  }

  protected onUpdateInnerFilter(chartInfo: ChartInfo) {
    this.chartBuilderComponent.showUpdateInnerFilterModal(chartInfo);
  }

  protected async onShowShareModal(dashboardId: DashboardId) {
    const currentDashboardDirectory = DashboardModule.currentDirectory;
    if (currentDashboardDirectory) {
      this.shareModal.showShareDashboard(currentDashboardDirectory);
    }
  }

  protected onShowContextMenu(event: MouseEvent, items: ContextMenuItem[]) {
    this.contextMenu.show(event, items);
  }

  protected onEditTextModal(widget: TextWidget, isEdit: boolean) {
    if (isEdit) {
      const widgetWidth = `${WidgetModule.getPosition(widget.id).width * (this.dashboard.getCellWidth() ?? 1) - 16}px` ?? '100%';
      const widgetHeight = `${WidgetModule.getPosition(widget.id).height * (Dashboard.getCellHeight() ?? 1) - 16}px` ?? 'unset';
      this.editTextModal.show(cloneDeep(widget), isEdit, widgetWidth, widgetHeight);
    } else {
      this.editTextModal.show(cloneDeep(widget), isEdit, '100%', 'unset');
    }
  }

  //Method xử lí khi 1 chart được add vào dashboard
  async addChart(chartInfo: ChartInfo, curPosition?: Position): Promise<void> {
    const position: Position = curPosition ?? chartInfo.getDefaultPosition();
    const newChartInfo = (await WidgetModule.handleCreateNewWidget({
      widget: chartInfo,
      position: position
    })) as ChartInfo;
    ZoomModule.registerZoomDataById({ id: newChartInfo.id, query: newChartInfo.setting });
    switch (newChartInfo.getChartInfoType()) {
      case ChartInfoType.Normal: {
        if (newChartInfo.setting.hasDynamicFunction()) {
          newChartInfo.setting.applyDynamicFunctions(DashboardControllerModule.dynamicFunctionMap);
          newChartInfo.setting.applyDynamicSortFunction(DashboardControllerModule.dynamicFunctionMap);
        }
        if (newChartInfo.setting.hasDynamicValue()) {
          newChartInfo.setting.applyDynamicFilters(QuerySettingModule.allDynamicValuesMap);
        }
        break;
      }
      case ChartInfoType.Filter: {
        await FilterModule.addFilterWidget(newChartInfo);
        break;
      }
      case ChartInfoType.FunctionController: {
        await DashboardControllerModule.replaceDynamicFunction({
          id: newChartInfo.id,
          selectedFunctions: ((newChartInfo.setting as any) as FunctionController).getDefaultTableColumns(),
          forceRender: true
        });
        break;
      }
    }
    await this.setupDynamicValue(newChartInfo);
    WidgetModule.addWidget({ widget: newChartInfo, position: position });
    QuerySettingModule.setQuerySetting({ id: newChartInfo.id, query: newChartInfo.setting });
    FilterModule.setAffectFilterWidget(newChartInfo);
    const useBoost = DashboardModule.currentDashboard?.useBoost;
    await DashboardControllerModule.renderChart({ id: newChartInfo.id, forceFetch: true, useBoost: useBoost });
  }

  //Method xử lí khi 1 chart được update vào dashboard
  /**
   * fixme: Method nay chua xu ly truong hop unregister zoom, change chart type like from dynamic function to normal.
   * Need to refactor flow:
   * 1. unregister old value in store
   * 2. register new value to store
   * 3. re-render chart
   */

  async updateChart(chartInfo: ChartInfo) {
    await FilterModule.addFilterWidget(chartInfo);
    await WidgetModule.handleUpdateWidget(chartInfo);
    WidgetModule.setWidget({ widgetId: chartInfo.id, widget: chartInfo });
    ZoomModule.registerZoomDataById({ id: chartInfo.id, query: chartInfo.setting });
    switch (chartInfo.getChartInfoType()) {
      case ChartInfoType.Normal: {
        chartInfo.setting = chartInfo.setting.hasDynamicFunction()
          ? DashboardControllerModule.updateDynamicFunctionValue(chartInfo.setting)
          : chartInfo.setting;
        if (chartInfo.setting.hasDynamicFunction()) {
          chartInfo.setting.applyDynamicFunctions(DashboardControllerModule.dynamicFunctionMap);
          chartInfo.setting.applyDynamicSortFunction(DashboardControllerModule.dynamicFunctionMap);
        }
        if (chartInfo.setting.hasDynamicValue()) {
          chartInfo.setting.applyDynamicFilters(QuerySettingModule.allDynamicValuesMap);
        }
        break;
      }
      case ChartInfoType.Filter: {
        await FilterModule.addFilterWidget(chartInfo);
        Log.debug('updateChart::ChartInfoType.filter', chartInfo.id);
        this.$root.$emit(DashboardEvents.UpdateFilter, chartInfo.id);
        break;
      }
      case ChartInfoType.FunctionController: {
        const defaultColumns = DashboardControllerModule.dynamicFunctionMap.get(chartInfo.id);
        const updateDefaultColumns = ((chartInfo.setting as any) as FunctionController).getDefaultTableColumns();
        if (!isEqual(defaultColumns, updateDefaultColumns)) {
          await DashboardControllerModule.replaceDynamicFunction({ id: chartInfo.id, selectedFunctions: updateDefaultColumns, forceRender: true });
        }
        break;
      }
    }
    await this.setupDynamicValue(chartInfo);
    QuerySettingModule.setQuerySetting({ id: chartInfo.id, query: chartInfo.setting });
    FilterModule.setAffectFilterWidget(chartInfo);
    const useBoost = DashboardModule.currentDashboard?.useBoost;
    await DashboardControllerModule.renderChart({ id: chartInfo.id, useBoost: useBoost });
  }

  protected async setupDynamicValue(chartInfo: ChartInfo): Promise<void> {
    const valueController: ValueController | undefined = chartInfo.getValueController();
    if (valueController && valueController.isEnableControl()) {
      const defaultValueMap = valueController.getDefaultValueAsMap() ?? new Map<ValueControlType, string[]>();
      const defaultValues: string[] = Array.from(defaultValueMap.values()).flat();
      const storeValues: string[] = QuerySettingModule.getDynamicValueAsList(chartInfo.id);
      if (!isEqual(defaultValues, storeValues)) {
        await DashboardControllerModule.applyDynamicValues({ id: chartInfo.id, valueMap: defaultValueMap });
      }
    }
  }

  protected async updateRouter(dashboardId: number, name: string) {
    if (this.paramInfo.idAsNumber() != dashboardId || this.paramInfo.name !== name) {
      try {
        await RouterUtils.to(this.$route.name as Routers, {
          query: this.$route.query,
          params: {
            name: RouterUtils.buildParamPath(dashboardId, name)
          }
        });
      } catch (ex) {
        Log.debug('navigate duplicated');
      }
    }
  }

  protected showBoostMenu(event: MouseEvent) {
    PopupUtils.hideAllPopup();
    const boostInfo = DashboardModule.currentDashboard?.boostInfo;
    this.boostContextMenu?.show(event, boostInfo, async () => {
      await DashboardModule.forceRefresh();
      await DashboardControllerModule.init(false);
    });
  }

  protected assignParameterValues(query: string, paramValues: Record<string, string>) {
    let newQuery = cloneDeep(query);
    for (const paramsKey in paramValues) {
      const regex = StringUtils.buildQueryParamRegex(paramsKey);
      newQuery = newQuery.replaceAll(regex, paramValues[paramsKey]);
    }
    return StringUtils.fixCommentInSql(newQuery);
  }

  protected showImageBrowserModal(widget?: ImageWidget) {
    Log.debug('DashboardDetail::showImageBrowserModal::');
    if (widget) {
      this.imageBrowserModal.show(async url => {
        widget.url = url;
        await WidgetModule.handleUpdateWidget(widget);
        WidgetModule.setWidget({ widgetId: widget.id, widget: widget });
      }, 'Replace Image');
    } else {
      this.imageBrowserModal.show(url => {
        WidgetModule.handleCreateImageWidget(ImageWidget.fromUrl(url));
      }, 'Insert Image');
    }
  }

  protected async onClickDashboardSetting(event: MouseEvent): Promise<void> {
    // event.stopPropagation();
    await TimeoutUtils.sleep(100);
    const isAutoRefresh = this.dashboardSetting.autoRefreshSetting.isAutoRefresh;
    const refreshIntervalMs = this.dashboardSetting.autoRefreshSetting.refreshIntervalMs;
    if (this.settingButton) {
      this.contextMenu.showAt(this.settingButton, [
        {
          icon: 'di-icon-edit-dashboard',
          text: 'Edit Dashboard',
          click: () => {
            const oldSetting: DashboardSetting = cloneDeep(this.dashboardSetting);
            this.editDashboardModal.show(oldSetting, async newSetting => {
              await DashboardModule.saveSetting(newSetting);
              this.onUpdateSettingCompleted(newSetting, oldSetting);
            });
          }
        },
        {
          icon: 'di-icon-outline-edit',
          text: 'Edit Widgets',
          click: () => {
            const oldSetting: DashboardSetting = cloneDeep(this.dashboardSetting);
            this.widgetSettingModal.show(oldSetting, async newSetting => {
              await DashboardModule.saveSetting(newSetting);
              this.onUpdateSettingCompleted(newSetting, oldSetting);
            });
          }
        },
        {
          icon: 'di-icon-image',
          text: 'Themes',
          click: () => {
            const oldSetting: DashboardSetting = cloneDeep(this.dashboardSetting);
            this.dashboardSettingModal.show({
              setting: oldSetting,
              onApply: async (newSetting: DashboardSetting) => {
                await DashboardModule.saveSetting(newSetting);
                this.onUpdateSettingCompleted(newSetting, oldSetting);
              }
            });
          }
        },
        {
          icon: 'di-icon-refresh',
          text: 'Auto Refresh Data',
          children: [
            {
              text: '15 Seconds',
              active: isAutoRefresh && refreshIntervalMs === 15000,
              click: () => this.selectRefreshInterval(15000)
            },
            {
              text: '30 Seconds',
              active: isAutoRefresh && refreshIntervalMs === 30000,
              click: () => this.selectRefreshInterval(30000)
            },
            {
              text: '60 Seconds',
              active: isAutoRefresh && refreshIntervalMs === 60000,
              click: () => this.selectRefreshInterval(60000)
            },
            {
              text: '3 Minutes',
              active: isAutoRefresh && refreshIntervalMs === 180000,
              click: () => this.selectRefreshInterval(180000)
            },
            {
              text: '5 Minutes',
              active: isAutoRefresh && refreshIntervalMs === 300000,
              click: () => this.selectRefreshInterval(300000)
            },
            {
              text: 'Off',
              active: !isAutoRefresh,
              click: () => this.selectRefreshInterval(0)
            }
          ]
        }
      ]);
    }
  }

  protected async selectRefreshInterval(refreshIntervalMs: number): Promise<void> {
    const newSetting: DashboardSetting = cloneDeep(this.dashboardSetting);
    newSetting.autoRefreshSetting.setRefreshIntervalMs(refreshIntervalMs);
    await DashboardModule.saveSetting(newSetting);
    DashboardControllerModule.applyAutoRefresh(newSetting.autoRefreshSetting);
  }

  protected onUpdateSettingCompleted(newSetting: DashboardSetting, oldSetting: DashboardSetting) {
    if (!newSetting.size.equals(oldSetting.size)) {
      this.updatePositionSettingButton();
      this.handleResize();
      this.$nextTick(() => {
        WidgetModule.widgets.forEach(widget => {
          this.$root.$emit(DashboardEvents.ResizeWidget, widget.id);
        });
      });
    }
  }
}
