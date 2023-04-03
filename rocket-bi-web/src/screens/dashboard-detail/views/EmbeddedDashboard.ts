import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { ChartInfo, DashboardId, DIException, Directory, TextWidget } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import {
  DashboardControllerModule,
  DashboardModeModule,
  DashboardModule,
  _ChartStore,
  DrilldownDataStoreModule,
  FilterModule,
  QuerySettingModule,
  RenderControllerModule,
  WidgetModule,
  CrossFilterData
} from '@/screens/dashboard-detail/stores';
import EditTextModal from '@/screens/dashboard-detail/components/EditTextModal.vue';
import DashboardHeader from '@/screens/dashboard-detail/components/DashboardHeader.vue';
import Dashboard from '@/screens/dashboard-detail/components/dashboard/Dashboard.vue';
import EmptyDashboard from '@/screens/dashboard-detail/components/EmptyDashboard.vue';
import { ContextMenuItem, DashboardMode, HorizontalScrollConfig, Status, VerticalScrollConfigs } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Routers } from '@/shared/enums/Routers';
import ParamInfo, { RouterUtils } from '@/utils/RouterUtils';
import { Inject } from 'typescript-ioc';
import { DataManager, DirectoryService } from '@core/common/services';
import { PermissionHandlerModule } from '@/store/modules/PermissionHandler';
import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import ChartComponents from '@chart/index';
import { ZoomModule } from '@/store/modules/ZoomStore';
import WidgetFullSizeModal from '@/screens/dashboard-detail/components/widget-full-size/WidgetFullScreenModal.vue';
import { WidgetFullSizeHandler } from '@/screens/dashboard-detail/intefaces/WidgetFullSizeHandler';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { Log } from '@core/utils';
import GridStackComponents from '@/shared/components/gridstack/install';
import { PopupUtils } from '@/utils/PopupUtils';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import ChartBuilderComponent from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderComponent.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ShareHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareHandler';
import { ShareDirectoryHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareDirectoryHandler';
import { LinkHandler } from '@/shared/components/common/di-share-modal/link-handler/LinkHandler';
import DiShareModal, { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import EmbeddedDashboardHeader from '@/screens/dashboard-detail/components/EmbeddedDashboardHeader.vue';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { Di } from '@core/common/modules';
import PasswordModal from '@/screens/dashboard-detail/components/PasswordModal.vue';

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
    WidgetFullScreenModal: WidgetFullSizeModal,
    ErrorWidget,
    ChartBuilderComponent,
    EmbeddedDashboardHeader,
    PasswordModal
  }
})
export default class EmbeddedDashboard extends Vue implements WidgetFullSizeHandler {
  private static readonly FIXED_STYLE: string = 'bar-fixed';
  private readonly dashboardScrollConfigs = VerticalScrollConfigs;
  private directoryHandler: ShareHandler = new ShareDirectoryHandler();

  @Inject
  private readonly dataManager!: DataManager;
  @Ref()
  private readonly contextMenu!: ContextMenu;
  @Ref()
  private readonly editTextModal!: EditTextModal;
  @Ref()
  private readonly shareModal!: DiShareModal;
  @Ref()
  private readonly actionBar?: HTMLElement;
  @Ref()
  private readonly widgetFullScreenModal!: WidgetFullSizeModal;

  @Ref()
  private readonly chartBuilderComponent!: ChartBuilderComponent;

  @Ref()
  private readonly dashboardHeader?: DashboardHeader;

  @Ref()
  private readonly passwordModal!: PasswordModal;

  get paramInfo(): ParamInfo {
    return RouterUtils.parseToParamInfo(this.$route.params.name);
  }

  get dashboardId(): number {
    return RouterUtils.parseToParamInfo(this.$route.params.name).idAsNumber();
  }

  get token(): string | undefined {
    return RouterUtils.getToken(this.$route);
  }

  get dashboardPaddingClass(): any {
    return {
      'full-screen-mode': this.isFullScreen,
      'tv-mode': this.isTVMode,
      'normal-mode': !(this.isFullScreen || this.isTVMode)
    };
  }

  private get mode(): DashboardMode {
    return DashboardModeModule.mode;
  }

  private get isFullScreen(): boolean {
    return DashboardModeModule.isFullScreen;
  }

  private get isTVMode(): boolean {
    return DashboardModeModule.isTVMode;
  }

  private get errorMessage(): string {
    return DashboardModule.errorMessage;
  }

  private get hasWidget(): boolean {
    return DashboardModule.hasWidget;
  }

  private get dashboardStatus(): Status {
    return DashboardModule.dashboardStatus;
  }

  private get isLogin(): boolean {
    return RouterUtils.isLogin();
  }

  private get dashboardStyle(): CSSStyleDeclaration {
    switch (this.mode) {
      case DashboardMode.Edit:
        return {
          paddingBottom: '148px'
        } as any;
      default:
        return {
          paddingBottom: '32px'
        } as any;
    }
  }

  private get allActions(): Set<ActionType> {
    return PermissionHandlerModule.allActions as Set<ActionType>;
  }

  private get statusClass(): any {
    return {
      'status-loading': this.dashboardStatus == Status.Loading
    };
  }

  @Watch('allActions')
  async onActionsChanged(allActions: Set<ActionType>) {
    await DashboardModeModule.handleActionChange(allActions);
    if (DashboardModule.previousPage?.name == Routers.ChartBuilder) {
      DashboardModeModule.setMode(DashboardMode.Edit);
    }
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
      DatabaseSchemaModule.reset();
      _BuilderTableSchemaStore.reset();
      await AuthenticationModule.logout();
    }
  }

  async handleEditText(textWidget: TextWidget) {
    if (StringUtils.isNotEmpty(textWidget.content)) {
      try {
        const isSuccess: boolean = await WidgetModule.handleUpdateWidget(textWidget);
        if (isSuccess) {
          WidgetModule.setWidget({
            widgetId: textWidget.id,
            widget: textWidget
          });
        }
      } catch (ex) {
        this.showError('Edit text failure! Try again later', ex);
      }
    }
  }

  handleCreateText(textWidget: TextWidget) {
    if (StringUtils.isNotEmpty(textWidget.content)) {
      WidgetModule.handleCreateTextWidget({ widget: textWidget }).catch(ex => this.showError('Create text failure! Try again later', ex));
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
      const info: ParamInfo = RouterUtils.parseToParamInfo(to.params.name);
      Log.debug('dashboardId::', info);
      _ConfigBuilderStore.setAllowBack(true);
      _ThemeStore.setAllowApplyMainTheme(false);
      DashboardModule.loadThemeFromLocal(info.idAsNumber());
      RenderControllerModule.readyRequestRender();
      DashboardModule.setPreviousPage(from);

      if (from && from.name != Routers.ChartBuilder) {
        DashboardModule.setMyDataPage(from);
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
    if (await _ConfigBuilderStore.confirmBack()) {
      next();
      this.revertTheme();
      this.clearData();
    } else {
      next(false);
    }
  }

  private revertTheme() {
    _ThemeStore.clearDashboardStyle();
    _ThemeStore.revertToMainTheme();
  }

  private clearData() {
    PermissionHandlerModule.reset();
    RenderControllerModule.reset();
    DashboardModule.reset();
    DashboardControllerModule.reset();
    _ChartStore.reset();
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

  showFullSize(chartInfo: ChartInfo): void {
    Log.debug('handleShowWidgetFullScreen::', chartInfo.id);
    this.widgetFullScreenModal.show(chartInfo);
  }

  hideFullSize(): void {
    this.widgetFullScreenModal.hide();
  }

  mounted() {
    document.documentElement.classList.add('root-dashboard-theme', 'root-dashboard-popover-theme');
    this.registerEvents();
  }

  beforeDestroy() {
    Log.debug('beforeDestroy::');
    this.unregisterEvents();
    document.documentElement.classList.remove('root-dashboard-theme', 'root-dashboard-popover-theme');
  }

  private async loadPermissions() {
    if (DashboardModule.isOwner) {
      Log.debug('DashboardDetail::created::isOwner:: true');
      PermissionHandlerModule.setCurrentActionData({
        token: this.dataManager.getToken(),
        actionsFromToken: [],
        actionsFromUser: [ActionType.all, ActionType.edit, ActionType.view, ActionType.create, ActionType.delete, ActionType.copy]
      });
    } else {
      await PermissionHandlerModule.loadPermittedActions({
        token: this.dataManager.getToken(),
        session: this.dataManager.getSession(),
        resourceType: ResourceType.dashboard,
        resourceId: this.dashboardId.toString(),
        actions: [ActionType.all, ActionType.edit, ActionType.view, ActionType.create, ActionType.delete, ActionType.copy]
      });
    }
  }

  private registerEvents() {
    this.$root.$on(DashboardEvents.ShowWidgetFullSize, this.showFullSize);
    this.$root.$on(DashboardEvents.HideWidgetFullSize, this.hideFullSize);
    this.$root.$on(DashboardEvents.AddChart, this.onAddChart);
    this.$root.$on(DashboardEvents.UpdateChart, this.onUpdateChart);
    this.$root.$on(DashboardEvents.ShowShareModal, this.onShowShareModal);
    this.$root.$on(DashboardEvents.ShowContextMenu, this.onShowContextMenu);
    this.$root.$on(DashboardEvents.ShowEditTextModal, this.onEditTextModal);
    this.$root.$on(DashboardEvents.ApplyCrossFilter, this.onCrossFilterChanged);
  }

  private unregisterEvents() {
    this.$root.$off(DashboardEvents.ShowWidgetFullSize, this.showFullSize);
    this.$root.$off(DashboardEvents.HideWidgetFullSize, this.hideFullSize);
    this.$root.$off(DashboardEvents.AddChart, this.onAddChart);
    this.$root.$off(DashboardEvents.UpdateChart, this.onUpdateChart);
    this.$root.$off(DashboardEvents.ShowShareModal, this.onShowShareModal);
    this.$root.$off(DashboardEvents.ShowContextMenu, this.onShowContextMenu);
    this.$root.$off(DashboardEvents.ShowEditTextModal, this.onEditTextModal);
    this.$root.$off(DashboardEvents.ApplyCrossFilter, this.onCrossFilterChanged);
  }

  private async loadDashboard(): Promise<void> {
    try {
      await DashboardModule.handleLoadDashboard(this.paramInfo.idAsNumber());
      await this.updateRouter(this.paramInfo.idAsNumber(), DashboardModule.title);
      await this.passwordModal.requirePassword(
        DashboardModule.dashboardDirectory!,
        DashboardModule.currentDashboard!.ownerId,
        async () => {
          await DashboardModule.handleUpdateOrAddNewWidgetFromChartBuilder();
          // TODO: apply filter when have dashboard
          await FilterModule.handleLoadDashboard();
          const useBoost = DashboardModule.currentDashboard?.useBoost;
          await DashboardControllerModule.renderAllChartOrFilters({ useBoost: useBoost });
          await DashboardControllerModule.renderAllChartFilter();
        },
        () => {
          _ConfigBuilderStore.setAllowBack(true);
          history.back();
        }
      );
    } catch (ex) {
      Log.error('loadDashboard::error', ex);
      // Ignored
    }
  }

  private async updateRouter(dashboardId: number, name: string) {
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

  private onScrollDashboard(vertical: { process: number }, horizontal: { process: number }, event: MouseEvent) {
    this.$root.$emit('body-scroll', vertical, horizontal, event);
    if (this.actionBar && this.dashboardStatus == Status.Loaded) {
      const { process } = vertical;
      const isStickyHeader = process > 0.05;
      if (isStickyHeader) {
        this.actionBar.classList.add(EmbeddedDashboard.FIXED_STYLE);
      } else {
        this.actionBar.classList.remove(EmbeddedDashboard.FIXED_STYLE);
      }
    }
    TableTooltipUtils.hideTooltip();
  }

  private onAddChart() {
    this.chartBuilderComponent.showAddChartModal();
  }

  private onUpdateChart(chartInfo: ChartInfo) {
    this.chartBuilderComponent.showUpdateChartModal(chartInfo);
  }

  private async onShowShareModal(dashboardId: DashboardId) {
    const directoryService = Di.get(DirectoryService);
    const directory: Directory = await directoryService.get(dashboardId);
    this.shareModal.showShareDashboard(directory);
  }

  private onShowContextMenu(event: MouseEvent, items: ContextMenuItem[]) {
    this.contextMenu.show(event, items);
  }

  private onEditTextModal(widget: TextWidget, isEdit: boolean) {
    this.editTextModal.show(widget, isEdit);
  }

  @AtomicAction({ timeUnlockAfterComplete: 150, name: 'onCrossFilter' })
  async onCrossFilterChanged(crossFilterData: CrossFilterData): Promise<void> {
    const isActivatedCrossFilter = FilterModule.isActivatedCrossFilter(crossFilterData);

    if (isActivatedCrossFilter) {
      await FilterModule.handleRemoveCrossFilter();
    } else {
      await FilterModule.handleSetCrossFilter(crossFilterData);
    }
  }
}
