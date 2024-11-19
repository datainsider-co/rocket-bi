import { Component, Inject, Mixins, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule, SchemaReloadMode } from '@/store/modules/data-builder/DatabaseSchemaStore';
import DiButton from '@/shared/components/common/DiButton.vue';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import TableCreationFromQueryModal from '@/screens/data-management/components/TableCreationFromQueryModal.vue';
import DataComponents from '@/screens/data-management/components/DataComponents';
import { FormulaSuggestionModule } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import DatabaseTreeView from '@/screens/data-management/components/database-tree-view/DatabaseTreeView.vue';
import DatabaseTreeViewCtrl, { DatabaseTreeViewMode } from '@/screens/data-management/components/database-tree-view/DatabaseTreeView';
import AbstractSchemaComponent, { FindSchemaResponse } from '@/screens/data-management/views/AbstractSchemaComponent';
import CalculatedFieldModal from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldModal.vue';
import DataListing from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/DataListing.vue';
import QueryComponent from '@/screens/data-management/components/QueryComponent.vue';
import QueryComponentCtrl from '@/screens/data-management/components/QueryComponent.ts';
import { Log } from '@core/utils';
import {
  ChartInfo,
  CreateDashboardRequest,
  Dashboard,
  DashboardId,
  DatabaseInfo,
  DIException,
  DirectoryId,
  Field,
  ParamValueType,
  QueryParameter,
  RawQuerySetting,
  TableSchema,
  TableType,
  TabWidget,
  Widget,
  WidgetId
} from '@core/common/domain';
import { ChartDataModule, DashboardControllerModule, DashboardModeModule, DashboardModule, WidgetModule } from '@/screens/dashboard-detail/stores';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import MyDataPickDirectory from '@/screens/lake-house/components/move-file/MyDataPickDirectory.vue';
import { clone, get, isEqual, toNumber } from 'lodash';
import MyDataPickFile from '@/screens/lake-house/components/move-file/MyDataPickFile.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import LayoutNoData from '@/shared/components/layout-wrapper/LayoutNoData.vue';
import SplitPanelMixin from '@/shared/components/layout-wrapper/SplitPanelMixin';
import { ActionType, BreadCrumbUtils, DomUtils, ListUtils, ResourceType, RouterUtils, StringUtils } from '@/utils';
import { EditorController } from '@/shared/fomula/EditorController';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { RouterLeavingHook } from '@/shared/components/vue-hook/RouterLeavingHook';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import router from '@/router/Router';
import { Routers } from '@/shared';
import PasswordModal from '@/screens/dashboard-detail/components/PasswordModal.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { PermissionHandlerModule } from '@/store/modules/PermissionHandler';
import { DataManager, DirectoryService } from '@core/common/services';
import { Breadcrumbs } from '@/shared/models';
import { Di } from '@core/common/modules';
import { QueryEditorMode } from './QueryEditorMode';
import { ParameterToChartResolver } from '@/screens/data-management/components/parameter-to-chart-builder/ParameterToChartResolver';
import { ParameterToChartResolverBuilder } from '@/screens/data-management/components/parameter-to-chart-builder/ParameterToChartResolverBuilder';
import { TextParamToChartHandler } from '@/screens/data-management/components/parameter-to-chart-builder/TextParamToChartHandler';
import { NumberParamToChartHandler } from '@/screens/data-management/components/parameter-to-chart-builder/NumberParamToChartHandler';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { FormulaControllerFactoryResolver } from '@/shared/fomula/builder/FormulaControllerFactoryResolver';
import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import EventBus from '@/screens/dashboard-detail/components/chatbot/helpers/EventBus';
import { PromptEvents } from '@/shared/enums/PromptEvents';
import { QueryGenerator } from '@/screens/dashboard-detail/intefaces/chatbot/prompt-2-query/QueryGenerator';

Vue.use(DataComponents);

type ModalComponentType = {
  show: Function;
};

@Component({
  components: {
    Split,
    SplitArea,
    TableCreationFromQueryModal,
    DatabaseTreeView,
    DiButton,
    CalculatedFieldModal,
    DataListing,
    QueryComponent,
    MyDataPickDirectory,
    MyDataPickFile,
    LayoutNoData,
    DiRenameModal,
    PasswordModal
  }
})
export default class QueryEditor extends Mixins(AbstractSchemaComponent, SplitPanelMixin) implements RouterLeavingHook {
  private static readonly intervalTime = 5000; //ms
  private formulaController: MonacoFormulaController | null = null;
  private editorController = new EditorController();
  private currentQuery = '';
  private loading = false;
  /**
   * Biến này đc sử dụng để kiểm tra khi back screen.
   *
   * Không update biến này (chỉ đc update lần đầu khi vào screen)
   */
  private tempQuery = '';
  private readonly DatabaseTreeViewMode = DatabaseTreeViewMode;

  private enableAutoSave = true;
  private parameterToChartResolver!: ParameterToChartResolver;

  @Ref()
  private readonly databaseTree?: DatabaseTreeViewCtrl;
  @Ref()
  private readonly queryComponent?: QueryComponentCtrl;

  @Ref()
  private readonly tableCreationModal!: ModalComponentType & TableCreationFromQueryModal;

  @Ref()
  private readonly createAnalysisModal!: DiRenameModal;

  @Ref()
  private readonly directoryPicker!: MyDataPickDirectory;

  @Ref()
  private readonly filePicker!: MyDataPickFile;

  @Ref()
  private readonly passwordModal!: PasswordModal;

  @Inject('setBreadcrumbs')
  private readonly setBreadcrumbs?: (breadcrums: Breadcrumbs[]) => void;

  private allowBack = false;

  async mounted() {
    EventBus.$on(PromptEvents.submitPrompt, this.handleSubmitPrompt);
    await this.init();
  }

  beforeDestroy() {
    EventBus.$off(PromptEvents.submitPrompt, this.handleSubmitPrompt);
    ChartDataModule.reset();
  }

  handleSubmitPrompt(prompt: string) {
    return new QueryGenerator().process(prompt, this.databaseTree?.getExpandingDatabases() ?? []);
  }

  private async init(): Promise<void> {
    await ConnectionModule.init();
    if (this.reloadShortDatabaseInfos) {
      await this.reloadShortDatabaseInfos(SchemaReloadMode.OnlyShortDatabaseInfo);
    }
    this.initFormulaController();
    await this.initQueryBuilder();
    const textParamCreationHandler = new TextParamToChartHandler();
    this.parameterToChartResolver = new ParameterToChartResolverBuilder(textParamCreationHandler)
      .add(ParamValueType.text, textParamCreationHandler)
      .add(ParamValueType.number, new NumberParamToChartHandler())
      .build();
  }

  destroyed() {
    this.resetData();
  }

  resetData() {
    DashboardModule.reset();
    PermissionHandlerModule.reset();
  }

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  private async initQueryBuilder() {
    await this.initSelectedTable();
    await this.initAdhocComponent();
    this.configTest();
  }

  private configTest() {
    ///Bind function set text for testing, monaco-vue is not an input for test can run
    DomUtils.bind('setQuery', this.updateDefaultQuery);
  }

  private initFormulaController() {
    const factory: FormulaControllerFactory = Di.get(FormulaControllerFactoryResolver).resolve(ConnectionModule.sourceType);
    FormulaSuggestionModule.loadSuggestions({
      supportedFunctionInfo: factory.getSupportedFunctionInfo()
    });
    this.formulaController = factory.createFormulaController(FormulaSuggestionModule.allFunctions, DatabaseSchemaModule.databaseInfos);
  }

  get databaseName(): string {
    return (this.$route.query?.database as any) as string;
  }

  set databaseName(value: string) {
    try {
      const cloneQuery = clone(this.$route.query);
      this.$router.replace({ query: { ...cloneQuery, database: value } });
    } catch (ex) {
      //Nothing do to when duplication warning
    }
  }

  private get tableName() {
    return (this.$route.query?.table as any) as string;
  }

  private get tableDisplayName() {
    return (this.$route.query?.tableDisplayName as any) as string;
  }

  private get tableType() {
    return (this.$route.query?.tableType as any) as TableType;
  }

  private async initSelectedTable(): Promise<void> {
    const database = this.databaseName || '';
    const table = this.tableName || '';
    const foundSchema: FindSchemaResponse = await this.findSchema(database, table);
    if (!foundSchema) {
      return Promise.resolve();
    }
    this.databaseTree?.selectDatabase(foundSchema.database!);
    if (foundSchema.table) {
      await this.selectTable(foundSchema.database!, foundSchema.table);
    }
  }

  private async selectTable(database: DatabaseInfo, table: TableSchema, onSelectComplete?: (database: DatabaseInfo, table: TableSchema) => void) {
    if (!database || !table) {
      this.currentQuery = '';
      return;
    } else {
      // Update selected Table
      if (this.mode === QueryEditorMode.EditTable) {
        this.currentQuery = table.query ?? '';
        this.tempQuery = table.query ?? '';
      } else {
        this.currentQuery = `select * from ${database.name}.${table.name}`;
      }
      // Update Route Query
      if (this.$route.query?.database !== database.name || this.$route.query?.table !== table.name) {
        await this.$router
          .replace({
            query: {
              ...this.$router.currentRoute.query,
              database: database.name,
              table: table.name
            }
          })
          .catch(() => {
            //
          });
      }
      if (onSelectComplete) {
        onSelectComplete(database, table);
      }
    }
  }

  @Track(TrackEvents.AdhocCreateTableFromQuery, {
    query: (_: QueryEditor, args: any) => args[0]
  })
  private showCreateTableModal(query: string) {
    this.currentQuery = query;
    this.tempQuery = query;
    if (!query.trim()) {
      // @ts-ignore
      this.$alert.fire({
        icon: 'error',
        title: 'Can not create Table from query',
        html: 'Your query is empty. <br>Please re-check query and try again!',
        confirmButtonText: 'OK'
        // showCancelButton: false
      });
      return;
    }
    this.tableCreationModal?.show();
  }

  @Track(TrackEvents.AdhocUpdateTableByQuery, {
    database_name: (_: QueryEditor) => _.databaseName,
    table_name: (_: QueryEditor) => _.tableName,
    query: (_: QueryEditor, args: any) => args[0]
  })
  private showUpdateTableModal(query: string) {
    this.currentQuery = query;
    this.tempQuery = query;
    if (!query.trim()) {
      // @ts-ignore
      this.$alert.fire({
        icon: 'error',
        title: 'Can not create Table from query',
        html: 'Your query is empty. <br>Please re-check query and try again!',
        confirmButtonText: 'OK'
        // showCancelButton: false
      });
      return;
    }
    this.tableCreationModal.showUpdateSchemaModal(this.databaseName, this.tableDisplayName, this.tableName, this.tableType);
  }

  protected async handleReloadDatabases() {
    if (this.reloadShortDatabaseInfos) {
      await this.reloadShortDatabaseInfos(SchemaReloadMode.OnlyDatabaseHasTable);
    }
  }

  private showFolderPickerModal(event: Event) {
    this.directoryPicker.show(event);
  }

  private async showFilePickerModal(payload: { event: Event; chart: ChartInfo }) {
    const { event } = payload;
    const chartInfo: ChartInfo | undefined = this.queryComponent?.currentAdhocAnalysis?.chartInfo;
    const queryParameters = this.queryComponent?.parameters ?? {};
    if (chartInfo) {
      await this.filePicker.show2(event, async id => await this.handleSelectFile(id, chartInfo, queryParameters));
    }
  }

  private handleSelectDirectory(directoryId: DirectoryId) {
    this.createAnalysisModal.show('', (newName: string) => {
      this.handleCreateDashboard(newName, directoryId);
    });
  }

  private async handleCreateDashboard(name: string, parentId: DirectoryId): Promise<void> {
    try {
      this.createAnalysisModal.setLoading(true);
      const createRequest = CreateDashboardRequest.createQueryRequest({
        name: name,
        parentDirectoryId: parentId,
        widgets: this.queryComponent?.allChartInfos ?? []
      });
      const dashboard: Dashboard = await DirectoryModule.createDashboard(createRequest);
      this.createAnalysisModal.hide();
      this.handleQueryCreated(dashboard);
      this.$nextTick(async () => {
        this.allowBack = true;
        this.navigateToMyData(name, parentId);
      });
      Log.debug('handleCreateDashboard::', this.tempQuery);
    } catch (ex) {
      Log.error('QueryEditor::handleCreateDashboard::error', ex);
      this.createAnalysisModal.setError('Failed to create dashboard');
    } finally {
      this.createAnalysisModal.setLoading(false);
    }
  }

  private async navigateToMyData(name: string, parentDirectoryId: DirectoryId): Promise<void> {
    await RouterUtils.to(Routers.AllData, {
      params: {
        name: RouterUtils.buildParamPath(parentDirectoryId, name)
      },
      query: {
        token: RouterUtils.getToken(router.currentRoute)
      }
    });
  }

  private async handleSelectFile(directoryId: DirectoryId, chartInfo: ChartInfo, parameters: Record<string, QueryParameter>) {
    try {
      const paramWidgetIds: WidgetId[] = (await this.createParametersWidgets(directoryId, parameters)).map(widget => widget.id);
      const adhocChart: ChartInfo = await this.createAdhocWidget(directoryId, chartInfo, paramWidgetIds);

      if (paramWidgetIds.length > 0) {
        await this.createTabWidget(directoryId, [...paramWidgetIds, adhocChart.id]);
      }
      PopupUtils.showSuccess('Save Ad hoc visualization successfully.');
    } catch (ex) {
      Log.error(ex);
      PopupUtils.showError('Save Ad hoc visualization failed.');
    }
  }

  private async createParametersWidgets(directoryId: DirectoryId, parameters: Record<string, QueryParameter>): Promise<Widget[]> {
    const result = [];
    for (const paramName in parameters) {
      const paramWidget = this.parameterToChartResolver.buildChart(parameters[paramName]);
      const position = paramWidget.getDefaultPosition();
      const widget = await WidgetModule.handleCreateNewWidget({
        widget: paramWidget,
        position: position,
        dashboardId: directoryId
      });
      result.push(widget);
    }
    return result;
  }

  private async createAdhocWidget(directoryId: DirectoryId, chartInfo: ChartInfo, paramWidgetIds: WidgetId[]): Promise<ChartInfo> {
    const position = chartInfo.getDefaultPosition();
    chartInfo.setting.getChartOption()?.setOption('parameterWidgetIds', paramWidgetIds);
    return (await WidgetModule.handleCreateNewWidget({
      widget: chartInfo,
      position: position,
      dashboardId: directoryId
    })) as ChartInfo;
  }

  private async createTabWidget(directoryId: DirectoryId, widgetIds: WidgetId[]): Promise<Widget> {
    const tabWidget: TabWidget = TabWidget.empty();
    tabWidget.tabItems[0].addWidgets(widgetIds);
    const position = tabWidget.getDefaultPosition();
    return (await WidgetModule.handleCreateNewWidget({
      widget: tabWidget,
      position: position,
      dashboardId: directoryId
    })) as ChartInfo;
  }

  private async initAdhocComponent() {
    switch (this.mode) {
      case QueryEditorMode.Dashboard: {
        const adhocId = this.queryDashboardId;
        await this.initAnalysis(adhocId!);
        break;
      }
      case QueryEditorMode.EditTable: {
        await this.initTableSchemaBreadcrumbs();
        await this.queryComponent?.handleExecuteQuery();
        break;
      }
      case QueryEditorMode.Query:
        break;
    }
  }

  private async initAnalysis(adhocId: DashboardId) {
    try {
      this.loading = true;
      await DashboardModule.init(adhocId);
      await DashboardModule.loadDirectory(adhocId);
      await this.loadPermission(adhocId);
      await this.initBreadcrumbs(adhocId, DashboardModule.currentDashboard?.name ?? '');
      this.loading = false;
      await this.passwordModal.requirePassword(
        DashboardModule.currentDirectory!,
        DashboardModule.currentDashboard!.ownerId,
        async () => {
          await this.renderAdhocData();
        },
        () => {
          this.allowBack = true;
          _ConfigBuilderStore.setAllowBack(true);
          history.back();
        }
      );
    } catch (ex) {
      const error = DIException.fromObject(ex);
      PopupUtils.showError(`Failed to load dashboard cause: ${error.getPrettyMessage()}`);
    } finally {
      this.loading = false;
    }
  }

  async initBreadcrumbs(adhocId: DashboardId, dashboardName: string) {
    const directoryService = Di.get(DirectoryService);
    if (AuthenticationModule.isLoggedIn) {
      DirectoryModule.setScreenName(Routers.AllData);
      if ((DashboardModule.currentDirectory?.id ?? -1) >= 0) {
        const parentDirectories = await directoryService.getParents(DashboardModule.currentDirectory!.id);
        DirectoryModule.setParents(parentDirectories);
      } else {
        DirectoryModule.setParents(null);
      }
      this.setBreadcrumbs && dashboardName ? this.setBreadcrumbs(DirectoryModule.getBreadcrumbs) : void 0;
    } else {
      const dashboardBreadCrumb = BreadCrumbUtils.defaultBreadcrumb();
      dashboardBreadCrumb.text = dashboardName;
      this.setBreadcrumbs && dashboardName ? this.setBreadcrumbs([dashboardBreadCrumb]) : void 0;
    }
  }

  async initTableSchemaBreadcrumbs(): Promise<void> {
    const database: string = this.databaseName || '';
    const table: string = this.tableName || '';
    const foundSchema = await this.findSchema(database, table);
    const breadcrumbs: Breadcrumbs[] = [];
    if (foundSchema) {
      breadcrumbs.push(
        ...[
          new Breadcrumbs({
            text: foundSchema.database?.displayName,
            to: {
              name: Routers.DataSchema,
              query: {
                database: database
              }
            },
            disabled: false
          }),
          new Breadcrumbs({
            text: foundSchema.table?.displayName,
            to: {
              name: Routers.DataSchema,
              query: {
                database: database,
                table: table
              }
            },
            disabled: false
          })
        ]
      );
    }
    Log.debug('initTableSchemaBreadcrumbs', breadcrumbs);
    this.setBreadcrumbs ? this.setBreadcrumbs(breadcrumbs) : void 0;
  }

  private get allActions(): Set<ActionType> {
    return PermissionHandlerModule.allActions as Set<ActionType>;
  }

  @Watch('allActions')
  async onActionsChanged(allActions: Set<ActionType>) {
    await DashboardModeModule.handleActionChange(allActions);
  }

  private async loadPermission(adhocId: DashboardId) {
    const token = DataManager.getToken();
    const session = DataManager.getSession();
    if (DashboardModule.isOwner) {
      PermissionHandlerModule.setCurrentActionData({
        token: token,
        actionsFromToken: [],
        actionsFromUser: [ActionType.all]
      });
    } else {
      await PermissionHandlerModule.loadPermittedActions({
        token: token,
        session: session,
        resourceType: ResourceType.dashboard,
        resourceId: `${adhocId}`,
        actions: [ActionType.all, ActionType.edit, ActionType.view, ActionType.create, ActionType.delete, ActionType.download]
      });
    }
  }

  private async renderAdhocData() {
    Log.debug('Query::initAdhocComponent::', WidgetModule.allQueryWidgets);
    this.$nextTick(async () => {
      this.queryComponent?.setParameters(ListUtils.getHead(WidgetModule.allQueryWidgets)?.setting?.getChartOption()?.options?.queryParameter);
      await DashboardControllerModule.init();
      const firstWidget = ListUtils.getHead(WidgetModule.allQueryWidgets);
      if (firstWidget) {
        const query = firstWidget.setting.getChartOption()?.options?.rawQuery || (firstWidget.setting as RawQuerySetting)?.sql || '';
        this.tempQuery = query;
        this.updateDefaultQuery(query);
      }
      this.queryComponent?.setWidgets(WidgetModule.allQueryWidgets);
      this.queryComponent?.selectChart(0);
      this.autoSave();
    });
  }

  ///Xử lí khi click Save Analysis
  ///Save as => tạo query dashboard
  ///Đang ở editor => tạo query dashboard
  ///Đang ở query dasshboard => update adhoc query (adhoc đầu tiên)
  private async handleSave(payload: { mouseEvent?: Event; saveAs: boolean; hidePopup?: boolean }) {
    const { mouseEvent, saveAs, hidePopup } = payload;
    if (mouseEvent) {
      switch (this.mode) {
        case QueryEditorMode.Dashboard:
          return saveAs ? this.showFolderPickerModal(mouseEvent) : this.saveQueryAnalysis();
        case QueryEditorMode.Query:
          return this.showFolderPickerModal(mouseEvent);
        case QueryEditorMode.EditTable:
          return this.showUpdateTableModal(this.queryComponent?.currentQuery ?? '');
      }
    }
  }

  private async updateQueryDashboard(dashboardId: DashboardId | null | undefined, chart: ChartInfo | null | undefined, hidePopup?: boolean) {
    if (this.mode === QueryEditorMode.Dashboard) {
      try {
        this.ensureDashboard(dashboardId);
        this.ensureWidget(chart);
        const success = await WidgetModule.handleUpdateWidgetAtDashboard({ dashboardId: dashboardId!, widget: chart! });
        if (success) {
          // Log.debug('updateQueryDashboard::', get(chart, 'setting.sql'));
          // this.updateDefaultQuery(get(chart, 'setting.sql', ''));
        }
        if (!hidePopup) {
          this.showPopup(success);
        }
      } catch (e) {
        Log.error(e);
        if (!hidePopup) {
          PopupUtils.showError('Save analysis failed!');
        }
      }
    }
  }

  private showPopup(success: boolean) {
    if (success) {
      PopupUtils.showSuccess('Save analysis successful!');
    } else {
      PopupUtils.showError('Save analysis failed!');
    }
  }

  private ensureDashboard(id: DashboardId | null | undefined) {
    if (!id) {
      throw new DIException('Analysis Not Found!');
    }
  }

  private ensureWidget(widget: ChartInfo | null | undefined) {
    if (!widget) {
      throw new DIException('Adhoc Not Found!');
    }
  }

  ///return null not have id in router
  private get queryDashboardId(): DashboardId | null {
    return toNumber(this.$route.query.adhoc) || null;
  }

  private get mode(): QueryEditorMode {
    if (this.$route.query.mode == 'update') {
      return QueryEditorMode.EditTable;
    }
    if (this.queryDashboardId) {
      return QueryEditorMode.Dashboard;
    }
    return QueryEditorMode.Query;
  }

  private updateDefaultQuery(query: string) {
    this.currentQuery = query;
  }

  private async handleUpdateChart(chart: ChartInfo) {
    if (this.mode == QueryEditorMode.Dashboard) {
      const dashboardId = this.queryDashboardId;
      if (!dashboardId) {
        PopupUtils.showError('Analysis Not Found!');
      } else {
        await WidgetModule.handleUpdateWidgetAtDashboard({ dashboardId: dashboardId, widget: chart });
      }
    }
  }

  private async handleCreateChart(chart: ChartInfo) {
    // if (this.mode == QueryEditorMode.Dashboard) {
    //   const dashboardId = this.queryDashboardId;
    //   if (!dashboardId) {
    //     PopupUtils.showError('Analysis Not Found!');
    //   } else {
    //     const widgetCreated = await WidgetModule.handleCreateNewWidget({
    //       widget: chart,
    //       position: Position.default(),
    //       dashboardId: dashboardId
    //     });
    //   }
    // }
  }

  private resizeChart() {
    this.queryComponent?.resizeChart();
  }

  protected async onToggleDatabase(dbName: string, isShowing: boolean): Promise<void> {
    if (isShowing) {
      this.databaseName = dbName;
      await DatabaseSchemaModule.loadDatabaseInfo({ dbName });
    }
  }

  private handleClickTable(table: TableSchema) {
    const tblQuery = FormulaUtils.toQuery(table.dbName, table.name);
    Log.debug('click table', tblQuery);
    this.editorController.appendText(tblQuery);
  }

  private handleClickField(field: Field) {
    const fieldQuery = FormulaUtils.toQuery(field.tblName, field.fieldName);
    Log.debug('click field', fieldQuery);
    this.editorController.appendText(fieldQuery);
  }

  beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>): void {
    const currentQuery = this.queryComponent?.currentQuery;
    Log.debug('current query', currentQuery, 'query', this.tempQuery);
    this.allowBack = isEqual(currentQuery, this.tempQuery);
    if (!this.allowBack) {
      this.showEnsureModal('It looks like you have been editing something', 'If you leave before saving, your changes will be lost.', 'Leave', 'Cancel').then(
        res => {
          next(res.isConfirmed ? undefined : false);
        }
      );
    } else {
      next(undefined);
    }
    this.clearAutoSave();
  }

  private async showEnsureModal(title: string, html: string, confirmButtonText?: string, cancelButtonText?: string) {
    //@ts-ignore
    return this.$alert.fire({
      icon: 'warning',
      title: title,
      html: html,
      confirmButtonText: confirmButtonText ?? 'Yes',
      showCancelButton: true,
      cancelButtonText: cancelButtonText ?? 'No'
    });
  }

  private async autoSave() {
    if (this.enableAutoSave) {
      const isDiffQuery = this.tempQuery !== this.queryComponent?.currentQuery;
      if (isDiffQuery) {
        await this.saveQueryAnalysis();
      }
      setTimeout(this.autoSave, QueryEditor.intervalTime);
    }
  }

  private async saveQueryAnalysis() {
    this.queryComponent!.isSavingAdhocChart = true;
    await this.updateQueryDashboard(this.queryDashboardId, this.queryComponent?.getQuery(), true);
    this.tempQuery = this.queryComponent!.currentQuery;
    this.queryComponent!.isSavingAdhocChart = false;
  }

  private clearAutoSave() {
    this.enableAutoSave = false;
  }

  private handleQueryCreated(dashboard: Dashboard): void {
    WidgetModule.setWidgets(dashboard.widgets ?? []);
    const query = get(dashboard, 'widgets[0].setting.sqlViews[0].query.query', '');
    Log.debug('handleQueryCreated:: query', query);
    this.tempQuery = query;
    this.currentQuery = query;
  }

  private get isReadOnly(): boolean {
    switch (this.mode) {
      case QueryEditorMode.Dashboard:
        return !DashboardModeModule.canEdit;
      case QueryEditorMode.EditTable:
      case QueryEditorMode.Query:
        return false;
    }
  }

  private get isEnableDownloadCsv(): boolean {
    switch (this.mode) {
      case QueryEditorMode.Dashboard:
        return DashboardModeModule.canDownload;
      case QueryEditorMode.EditTable:
      case QueryEditorMode.Query:
        return true;
    }
  }

  private checkAllowBack() {
    if (this.allowBack) {
      return this.allowBack;
    } else {
      switch (this.mode) {
        case QueryEditorMode.Query:
          return StringUtils.isEmpty(this.queryComponent?.currentQuery);
        case QueryEditorMode.EditTable:
          return isEqual(this.queryComponent?.currentQuery, this.tempQuery);
        default:
          return false;
      }
    }
  }

  @Provide('getDatabaseSelected')
  getSelectedDatabases(): DatabaseInfo[] {
    return this.databaseTree?.getExpandingDatabases() ?? [];
  }
}
