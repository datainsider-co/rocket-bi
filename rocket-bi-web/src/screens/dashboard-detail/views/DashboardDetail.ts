import AddChartModal from '@/screens/dashboard-detail/components/AddChartModal.vue';
import BoostContextMenu from '@/screens/dashboard-detail/components/dashboard-control-bar/BoostContextMenu.vue';
import SortModal from '@/screens/dashboard-detail/components/SortModal.vue';
import WidgetSettingModal from '@/screens/dashboard-detail/components/WidgetSettingModal.vue';
import { cloneDeep, isEqual } from 'lodash';
import { Component, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import {
  ChartInfo,
  ChartInfoType,
  DashboardId,
  DatabaseInfo,
  defaultQueryParameter,
  DIException,
  DynamicFunctionWidget,
  DynamicValues,
  Filterable,
  FilterPanel,
  FunctionControl,
  ImageWidget,
  InlineSqlView,
  Position,
  QueryParameter,
  QuerySetting,
  TabControl,
  TableSchema,
  TabWidget,
  TextWidget,
  UserProfile,
  Widget,
  WidgetId
} from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import {
  ChartDataModule,
  CrossFilterData,
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
import { ContextMenuItem, DashboardMode, Status, VerticalScrollConfigs } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Routers } from '@/shared/enums/Routers';
import ParamInfo, { RouterUtils } from '@/utils/RouterUtils';
import { Inject } from 'typescript-ioc';
import { DataManager } from '@core/common/services';
import { PermissionHandlerModule } from '@/store/modules/PermissionHandler';
import { ActionType, ActionTypeMapActions, ResourceType } from '@/utils/PermissionUtils';
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
import DiShareModal from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { ListUtils } from '@/utils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { DynamicConditionWidget } from '@core/common/domain/model/widget/filter/DynamicConditionWidget';
import { AdhocBuilderConfig, ControlBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';
import { EventBus } from '@/event-bus/EventBus';
import PasswordModal from '@/screens/dashboard-detail/components/PasswordModal.vue';
import { CopiedData, CopiedDataType } from '@/screens/dashboard-detail/intefaces/CopiedData';
import ImageBrowserModal from '@/screens/dashboard-detail/components/upload/ImageBrowserModal.vue';

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
    BoostContextMenu,
    WidgetSettingModal,
    AddChartModal,
    SortModal,
    PasswordModal,
    ImageBrowserModal
  }
})
export default class DashboardDetail extends Vue implements WidgetFullSizeHandler {
  private static readonly FIXED_STYLE: string = 'bar-fixed';
  private readonly dashboardScrollConfigs = VerticalScrollConfigs;
  private directoryHandler: ShareHandler = new ShareDirectoryHandler();

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
  private readonly widgetSettingModal!: WidgetSettingModal;

  @Ref()
  private readonly addChartModal!: AddChartModal;

  @Ref()
  private readonly sortModal!: SortModal;

  @Ref()
  private readonly dashboardHeader?: DashboardHeader;

  @Inject
  private readonly schemaService!: SchemaService;
  @Ref()
  private readonly boostContextMenu?: BoostContextMenu;

  @Ref()
  private readonly dashboard!: DashboardCtrl;

  @Ref()
  private readonly passwordModal!: PasswordModal;

  @Ref()
  private readonly imageBrowserModal!: ImageBrowserModal;

  get paramInfo(): ParamInfo {
    return RouterUtils.parseToParamInfo(this.$route.params.name);
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
    return Math.ceil(height / (this.dashboard.getCellHeight() ?? 1));
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

  handleCreateImage(imageWidget: ImageWidget) {
    if (StringUtils.isNotEmpty(imageWidget.url)) {
      WidgetModule.handleCreateImageWidget(imageWidget);
      this.editTextModal.hide();
    }
  }

  async handleEditImage(imageWidget: ImageWidget) {
    if (!imageWidget.isEmpty) {
      try {
        const isSuccess: boolean = await WidgetModule.handleUpdateWidget(imageWidget);
        if (isSuccess) {
          WidgetModule.setWidget({
            widgetId: imageWidget.id,
            widget: imageWidget
          });
          this.editTextModal.hide();
        }
      } catch (ex) {
        this.showError('Edit text failure! Try again later', ex);
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
    if (this.dashboardHeader?.showEditComponent()) {
      _ConfigBuilderStore.setAllowBack(false);
    } else {
      _ConfigBuilderStore.setAllowBack(true);
    }
    if (await _ConfigBuilderStore.confirmBack()) {
      await next();
      _ThemeStore.clearDashboardStyle();
      _ThemeStore.revertToMainTheme();
      this.clearData();
    } else {
      next(false);
    }
  }

  private clearData() {
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
    ChartDataModule.resetViewAsUser();
  }

  private async loadPermissions() {
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

  private registerEvents() {
    this.$root.$on(DashboardEvents.ShowWidgetFullSize, this.showFullSize);
    this.$root.$on(DashboardEvents.HideWidgetFullSize, this.hideFullSize);
    this.$root.$on(DashboardEvents.AddChart, this.onAddChart);
    this.$root.$on(DashboardEvents.UpdateChart, this.onUpdateChart);
    this.$root.$on(DashboardEvents.AddInnerFilter, this.onAddInnerFilter);
    this.$root.$on(DashboardEvents.UpdateInnerFilter, this.onUpdateInnerFilter);
    this.$root.$on(DashboardEvents.ShowShareModal, this.onShowShareModal);
    this.$root.$on(DashboardEvents.ShowContextMenu, this.onShowContextMenu);
    this.$root.$on(DashboardEvents.ShowEditTextModal, this.onEditTextModal);
    this.$root.$on(DashboardEvents.ApplyCrossFilter, this.onCrossFilterChanged);
    this.$root.$on(DashboardEvents.ShowBoostMenu, this.showBoostMenu);
    this.$root.$on(DashboardEvents.UpdateTab, this.onUpdateTab);
    this.$root.$on(DashboardEvents.AddChartToTab, this.onAddChartToTab);
    this.$root.$on(DashboardEvents.AddFilterToGroup, this.onAddFilterToGroup);
    this.$root.$on(DashboardEvents.RemoveChartFromTab, this.onMoveChartFromTabToDashboard);
    this.$root.$on(DashboardEvents.SortTab, this.onSortTab);
    this.$root.$on(DashboardEvents.AddDynamicControl, this.onAddControl);
    this.$root.$on(DashboardEvents.UpdateDynamicFunctionWidget, this.onUpdateDynamicFunctionWidget);
    this.$root.$on(DashboardEvents.UpdateDynamicConditionWidget, this.onUpdateDynamicConditionWidget);
    this.$root.$on(DashboardEvents.ShowImageBrowserModal, this.showImageBrowserModal);
    EventBus.onRLSViewAs(this.loadViewAsDashboard);
    EventBus.onExitRLSViewAs(this.loadDashboard);
    EventBus.onPasteData(this.processCopiedData);
    window.document.addEventListener('paste', this.handlePasteEvent);
  }

  private unregisterEvents() {
    this.$root.$off(DashboardEvents.ShowWidgetFullSize, this.showFullSize);
    this.$root.$off(DashboardEvents.HideWidgetFullSize, this.hideFullSize);
    this.$root.$off(DashboardEvents.AddChart, this.onAddChart);
    this.$root.$off(DashboardEvents.UpdateChart, this.onUpdateChart);
    this.$root.$off(DashboardEvents.AddInnerFilter, this.onAddInnerFilter);
    this.$root.$off(DashboardEvents.UpdateInnerFilter, this.onUpdateInnerFilter);
    this.$root.$off(DashboardEvents.ShowShareModal, this.onShowShareModal);
    this.$root.$off(DashboardEvents.ShowContextMenu, this.onShowContextMenu);
    this.$root.$off(DashboardEvents.ShowEditTextModal, this.onEditTextModal);
    this.$root.$off(DashboardEvents.ApplyCrossFilter, this.onCrossFilterChanged);
    this.$root.$off(DashboardEvents.ShowBoostMenu, this.showBoostMenu);
    this.$root.$off(DashboardEvents.UpdateTab, this.onUpdateTab);
    this.$root.$off(DashboardEvents.AddChartToTab, this.onAddChartToTab);
    this.$root.$off(DashboardEvents.AddFilterToGroup, this.onAddFilterToGroup);
    this.$root.$off(DashboardEvents.RemoveChartFromTab, this.onMoveChartFromTabToDashboard);
    this.$root.$off(DashboardEvents.SortTab, this.onSortTab);
    this.$root.$off(DashboardEvents.AddDynamicControl, this.onAddControl);
    this.$root.$off(DashboardEvents.UpdateDynamicConditionWidget, this.onUpdateDynamicConditionWidget);
    this.$root.$off(DashboardEvents.ShowImageBrowserModal, this.showImageBrowserModal);
    EventBus.offRLSViewAs(this.loadViewAsDashboard);
    EventBus.offExitRLSViewAs(this.loadDashboard);
    EventBus.offPasteData(this.processCopiedData);
    window.document.removeEventListener('paste', this.handlePasteEvent);
  }

  private async handlePasteEvent(event: ClipboardEvent) {
    const copiedData: string = event.clipboardData?.getData('text') ?? '{}';
    const data: CopiedData | undefined = CopiedData.fromObject(JSON.parse(copiedData));
    await this.processCopiedData(data);
  }

  private async processCopiedData(data: CopiedData | undefined) {
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

  private async pasteChart(data: CopiedData) {
    try {
      const obj = JSON.parse(data.transferData);
      const chartInfo = ChartInfo.fromObject(obj.widget);
      const position = Position.fromObject(obj.position);
      position.resetRowColumn();
      await DashboardModule.addNewChart({
        chartInfo: chartInfo,
        position: position
      });
    } catch (ex) {
      Log.error('handlePasteChart::error', ex);
      PopupUtils.showError('Failed to paste chart');
    }
  }

  private async pasteWidget(data: CopiedData) {
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

  private async loadDashboard(): Promise<void> {
    try {
      const dashboardId = this.paramInfo.idAsNumber();
      await DashboardModule.handleLoadDashboard(dashboardId);
      await DashboardModule.loadDirectoryFromDashboardId(dashboardId);
      await this.updateRouter(dashboardId, DashboardModule.title);
      await this.passwordModal.requirePassword(
        DashboardModule.currentDirectory!,
        DashboardModule.currentDashboard!.ownerId,
        async () => {
          await FilterModule.init();
          await DashboardControllerModule.init();
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

  private loadViewAsDashboard(viewAsUser: UserProfile) {
    Log.debug('DashboardDetail::loadViewAsDashboard::viewAsUser::', viewAsUser);
    return this.loadDashboard();
  }

  private onScrollDashboard(vertical: { process: number }, horizontal: { process: number }, event: MouseEvent) {
    this.$root.$emit('body-scroll', vertical, horizontal, event);
    if (this.actionBar && this.dashboardStatus == Status.Loaded) {
      const { process } = vertical;
      const isStickyHeader = process > 0.05;
      if (isStickyHeader) {
        this.actionBar.classList.add(DashboardDetail.FIXED_STYLE);
      } else {
        this.actionBar.classList.remove(DashboardDetail.FIXED_STYLE);
      }
    }
    TableTooltipUtils.hideTooltip();
  }

  private onAddChart() {
    this.chartBuilderComponent.showModal({
      onCompleted: this.addChart,
      tabControls: this.getDashboardTabControls()
    });
  }

  private getDashboardTabControls(): TabControl[] {
    return WidgetModule.widgets.filter(widget => TabControl.isTabControl(widget) && widget.isControl()) as any;
  }

  private onAddControl() {
    this.chartBuilderComponent.showModal({
      onCompleted: async chart =>
        DynamicConditionWidget.isDynamicConditionChart(chart) ? await this.addDynamicControlWidget(chart) : await this.addDynamicFunctionWidget(chart),
      config: ControlBuilderConfig
    });
  }

  private async onUpdateDynamicConditionWidget(widget: DynamicConditionWidget) {
    this.widgetSettingModal.show(widget, async configWidget => await this.updateDynamicConditionWidget(configWidget as DynamicConditionWidget));
  }

  private async onUpdateDynamicFunctionWidget(widget: DynamicFunctionWidget) {
    const chart = widget.toChart();
    let isRevert = true;
    this.chartBuilderComponent.showModal({
      chart: chart,
      onCompleted: async chartInfo => {
        isRevert = false;
        const widget = DynamicFunctionWidget.fromChart(chartInfo.copyWithId(chart.id)); ///Chuyển đổi Tab Widget => Dynamic Function Widget
        return this.updateDynamicFunctionWidget(widget);
      },
      onCancel: () => {
        if (isRevert) {
          WidgetModule.setWidget({ widgetId: widget.id, widget: widget });
        }
      },
      config: ControlBuilderConfig
    });
    return;
  }

  private async onUpdateTab(tab: TabWidget) {
    this.widgetSettingModal.show(tab, updatedTab => {
      WidgetModule.handleUpdateWidget(updatedTab);
      WidgetModule.setWidget({ widgetId: updatedTab.id, widget: updatedTab });
    });
  }

  private async onAddChartToTab(widget: TabWidget, tabIndex: number) {
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

  private async onAddFilterToGroup(widget: FilterPanel, tabIndex: number) {
    const currentDashboard = DashboardModule.currentDashboard;
    if (currentDashboard) {
      const filtersInDashboard = WidgetModule.widgetInDashboard.filter(
        widget => ChartInfo.isChartInfo(widget) && Filterable.isFilterable(widget.setting) && widget.setting.isEnableFilter()
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

  private async onSortTab(widget: TabWidget) {
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

  private async onMoveChartFromTabToDashboard(
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
        },
        emptyText: content.emptyText,
        actionName: content.actionName,
        title: content.title,
        subTitle: content.subTitle
      });
    }
  }

  private async onUpdateChart(chartInfo: ChartInfo) {
    const currentView: InlineSqlView | undefined = ListUtils.getHead(chartInfo.setting.sqlViews);
    const currentQueryParam: Record<string, string> = this.getQueryParamValuesOfWidget(chartInfo);
    if (currentView) {
      try {
        const tableSchema: TableSchema = await this.getAdhocTable(
          this.assignParameterValues(currentView.query.query, currentQueryParam),
          currentView.aliasName
        );
        //Adhoc Chart
        this.chartBuilderComponent.showModal({
          chart: chartInfo,
          onCompleted: this.updateChart,
          selectedTables: [tableSchema.name],
          database: DatabaseInfo.adhoc(tableSchema),
          config: AdhocBuilderConfig,
          tabControls: this.getDashboardTabControls()
        });
      } catch (e) {
        this.chartBuilderComponent.showModal({
          chart: chartInfo,
          onCompleted: this.updateChart
        });
      }
    } else {
      Log.debug('onUpdateChart::', chartInfo);
      //Normal chart
      this.chartBuilderComponent.showModal({
        chart: chartInfo,
        onCompleted: this.updateChart,
        tabControls: this.getDashboardTabControls()
      });
    }
  }

  private getQueryParamValuesOfWidget(chart: ChartInfo): Record<string, string> {
    const parameterWidgetIds = chart.setting.getChartOption()?.options?.parameterWidgetIds ?? [];
    Log.debug('getQueryParamValuesOfWidget::', parameterWidgetIds);
    return Object.fromEntries(
      parameterWidgetIds
        .map(id => {
          const parameter: QueryParameter = (WidgetModule.widgetAsMap[id] as ChartInfo)?.setting?.toQueryParameter() ?? defaultQueryParameter();
          //TODO: Change it to list when using multi choice
          const value = ListUtils.getHead(DashboardControllerModule.dynamicFilter.get(id) ?? []) ?? parameter.value;
          return [parameter.displayName, QuerySetting.formatParamValue(parameter.valueType, value)];
        })
        .filter(paramEntry => StringUtils.isNotEmpty(paramEntry[0])) //paramEntry[0] => Key (ex: ['xyz', '123'], paramEntry[0] = xyz)
    );
  }

  private async getAdhocTable(query: string, tblName?: string): Promise<TableSchema> {
    const tableSchema = await this.schemaService.detectTableSchema(query);
    tableSchema.name = tblName ?? tableSchema.name;
    return tableSchema;
  }

  private onAddInnerFilter(chartInfo: ChartInfo) {
    this.chartBuilderComponent.showAddInnerFilterModal(chartInfo);
  }

  private onUpdateInnerFilter(chartInfo: ChartInfo) {
    this.chartBuilderComponent.showUpdateInnerFilterModal(chartInfo);
  }

  private async onShowShareModal(dashboardId: DashboardId) {
    const currentDashboardDirectory = DashboardModule.currentDirectory;
    if (currentDashboardDirectory) {
      this.shareModal.showShareDashboard(currentDashboardDirectory);
    }
  }

  private onShowContextMenu(event: MouseEvent, items: ContextMenuItem[]) {
    this.contextMenu.show(event, items);
  }

  private onEditTextModal(widget: TextWidget, isEdit: boolean) {
    if (isEdit) {
      const widgetWidth = `${WidgetModule.getPosition(widget.id).width * (this.dashboard.getCellWidth() ?? 1) - 16}px` ?? '100%';
      const widgetHeight = `${WidgetModule.getPosition(widget.id).height * (this.dashboard.getCellHeight() ?? 1) - 16}px` ?? 'unset';
      this.editTextModal.show(cloneDeep(widget), isEdit, widgetWidth, widgetHeight);
    } else {
      this.editTextModal.show(cloneDeep(widget), isEdit, '100%', 'unset');
    }
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

  //Method xử lí khi 1 dynamic function widget được add vào dashboard
  async addDynamicFunctionWidget(chart: ChartInfo): Promise<void> {
    const position: Position = chart.getDefaultPosition();
    const widget = DynamicFunctionWidget.fromChart(chart); ///Chuyển đổi Tab Widget => Dynamic Function Widget
    const widgetCreated = (await WidgetModule.handleCreateNewWidget({
      widget: widget,
      position: position
    })) as DynamicFunctionWidget;
    await DashboardControllerModule.replaceDynamicFunction({ widget: widgetCreated, selected: widget.getDefaultTableColumns(), apply: true });
    WidgetModule.addWidget({ widget: widgetCreated, position: position });
    ChartDataModule.setStatusLoaded(widgetCreated.id);
  }

  async addDynamicControlWidget(chart: ChartInfo): Promise<void> {
    const position: Position = chart.getDefaultPosition();
    const widget: DynamicConditionWidget = DynamicConditionWidget.fromChart(chart); ///Chuyển đổi Tab Widget => Dynamic Function Widget
    const widgetCreated = (await WidgetModule.handleCreateNewWidget({
      widget: widget,
      position: position
    })) as DynamicConditionWidget;
    await DashboardControllerModule.replaceDynamicValues({ widget: widgetCreated, values: widgetCreated.values, apply: true });
    WidgetModule.addWidget({ widget: widgetCreated, position: position });
    ChartDataModule.setStatusLoaded(widgetCreated.id);
  }

  //Method xử lí khi 1 dynamic function widget được update vào dashboard
  async updateDynamicFunctionWidget(widget: DynamicFunctionWidget): Promise<void> {
    Log.debug('updateDynamicFunctionWidget', widget.values);
    await WidgetModule.handleUpdateWidget(widget);
    const defaultColumns = DashboardControllerModule.dynamicFunctions.get(widget.id);
    const updateDefaultColumns = widget.getDefaultTableColumns();
    if (!isEqual(defaultColumns, updateDefaultColumns)) {
      await DashboardControllerModule.replaceDynamicFunction({ widget: widget, selected: updateDefaultColumns, apply: true });
    }
    Log.debug('updateDynamicFunctionWidget::1', widget.values);
    WidgetModule.setWidget({ widgetId: widget.id, widget: widget });
    ChartDataModule.setStatusLoaded(widget.id);
  }

  async updateDynamicConditionWidget(widget: DynamicConditionWidget): Promise<void> {
    await WidgetModule.handleUpdateWidget(widget);
    const currentFilterValues = DashboardControllerModule.dynamicFilter.get(widget.id);
    const updateFilterValues = widget.values;
    if (!isEqual(currentFilterValues, updateFilterValues)) {
      await DashboardControllerModule.replaceDynamicValues({ widget: widget, values: updateFilterValues, apply: true });
    }
    WidgetModule.setWidget({ widgetId: widget.id, widget: widget });
    ChartDataModule.setStatusLoaded(widget.id);
  }

  //Medthod xử lí khi 1 chart được add vào dashboard
  async addChart(chartInfo: ChartInfo): Promise<void> {
    const position: Position = chartInfo.getDefaultPosition();
    const newChartInfo = (await WidgetModule.handleCreateNewWidget({
      widget: chartInfo,
      position: position
    })) as ChartInfo;
    switch (newChartInfo.getChartInfoType()) {
      case ChartInfoType.normal: {
        if (newChartInfo.setting.hasDynamicFunction) {
          newChartInfo.setting.setDynamicFunctions(DashboardControllerModule.dynamicFunctions);
        }
        if (newChartInfo.setting.hasDynamicCondition) {
          newChartInfo.setting.setDynamicFilter(DashboardControllerModule.dynamicFilter);
        }
        break;
      }
      case ChartInfoType.filter: {
        await FilterModule.addFilterWidget(newChartInfo);
        break;
      }
      case ChartInfoType.dynamicFunction: {
        await DashboardControllerModule.replaceDynamicFunction({
          widget: newChartInfo,
          selected: ((newChartInfo.setting as any) as FunctionControl).getDefaultFunctions(),
          apply: true
        });
        break;
      }
      case ChartInfoType.dynamicValues: {
        await DashboardControllerModule.setDynamicValues({ id: newChartInfo.id, values: ((newChartInfo.setting as any) as DynamicValues).getDefaultValues() });
        break;
      }
    }
    WidgetModule.addWidget({ widget: newChartInfo, position: position });
    QuerySettingModule.setQuerySetting({ id: newChartInfo.id, query: newChartInfo.setting });
    FilterModule.setAffectFilterWidget(newChartInfo);
    const useBoost = DashboardModule.currentDashboard?.useBoost;
    await DashboardControllerModule.renderChart({ id: newChartInfo.id, forceFetch: true, useBoost: useBoost });
  }

  //Medthod xử lí khi 1 chart được update vào dashboard
  async updateChart(chartInfo: ChartInfo) {
    await FilterModule.addFilterWidget(chartInfo);
    await WidgetModule.handleUpdateWidget(chartInfo);
    WidgetModule.setWidget({ widgetId: chartInfo.id, widget: chartInfo });
    ZoomModule.registerZoomData(chartInfo);
    switch (chartInfo.getChartInfoType()) {
      case ChartInfoType.normal: {
        chartInfo.setting = chartInfo.setting.hasDynamicFunction ? DashboardControllerModule.updateDynamicFunctionValue(chartInfo.setting) : chartInfo.setting;
        if (chartInfo.setting.hasDynamicFunction) {
          chartInfo.setting.setDynamicFunctions(DashboardControllerModule.dynamicFunctions);
        }
        if (chartInfo.setting.hasDynamicCondition) {
          chartInfo.setting.setDynamicFilter(DashboardControllerModule.dynamicFilter);
        }
        break;
      }
      case ChartInfoType.filter: {
        await FilterModule.addFilterWidget(chartInfo);
        Log.debug('updateChart::ChartInfoType.filter', chartInfo.id);
        this.$root.$emit(DashboardEvents.UpdateFilter, chartInfo.id);
        break;
      }
      case ChartInfoType.dynamicFunction: {
        const defaultColumns = DashboardControllerModule.dynamicFunctions.get(chartInfo.id);
        const updateDefaultColumns = ((chartInfo.setting as any) as FunctionControl).getDefaultFunctions();
        if (!isEqual(defaultColumns, updateDefaultColumns)) {
          await DashboardControllerModule.replaceDynamicFunction({ widget: chartInfo, selected: updateDefaultColumns, apply: true });
        }
        break;
      }
      case ChartInfoType.dynamicValues: {
        const currentFilterValues = DashboardControllerModule.dynamicFilter.get(chartInfo.id);
        const updateFilterValues = ((chartInfo.setting as any) as DynamicValues).getDefaultValues();
        if (!isEqual(currentFilterValues, updateFilterValues)) {
          await DashboardControllerModule.replaceDynamicValues({ widget: chartInfo, values: updateFilterValues, apply: true });
        }
        break;
      }
    }
    QuerySettingModule.setQuerySetting({ id: chartInfo.id, query: chartInfo.setting });
    FilterModule.setAffectFilterWidget(chartInfo);
    const useBoost = DashboardModule.currentDashboard?.useBoost;
    await DashboardControllerModule.renderChart({ id: chartInfo.id, useBoost: useBoost });
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

  private showBoostMenu(event: MouseEvent) {
    PopupUtils.hideAllPopup();
    const boostInfo = DashboardModule.currentDashboard?.boostInfo;
    this.boostContextMenu?.show(event, boostInfo, async () => {
      await DashboardModule.forceRefresh();
      await DashboardControllerModule.init(false);
    });
  }

  private assignParameterValues(query: string, paramValues: Record<string, string>) {
    let newQuery = cloneDeep(query);
    for (const paramsKey in paramValues) {
      const regex = StringUtils.buildQueryParamRegex(paramsKey);
      newQuery = newQuery.replaceAll(regex, paramValues[paramsKey]);
    }
    return StringUtils.fixCommentInSql(newQuery);
  }

  private showImageBrowserModal(widget?: ImageWidget) {
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

  @Provide('applyFilterPanel')
  private applyFilterPanel(panelId: WidgetId) {
    return FilterModule.handleApplyFilterPanel(panelId);
  }
}
