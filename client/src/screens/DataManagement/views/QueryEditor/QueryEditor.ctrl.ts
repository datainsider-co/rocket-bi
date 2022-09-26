import { Component, Mixins, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data_builder/DatabaseSchemaStore';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { FormulaController } from '@/shared/fomula/FormulaController';
import TableCreationFromQueryModal from '@/screens/DataManagement/components/TableCreationFromQueryModal.vue';
import DataComponents from '@/screens/DataManagement/components/data_component';
import { FormulaSuggestionModule } from '@/screens/ChartBuilder/ConfigBuilder/DatabaseListing/FormulaSuggestionStore';
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import DatabaseTreeView from '@/screens/DataManagement/components/DatabaseTreeView/DatabaseTreeView.vue';
import DatabaseTreeViewCtrl, { DatabaseTreeViewMode } from '@/screens/DataManagement/components/DatabaseTreeView/DatabaseTreeView.ctrl';
import DataManagementChild from '@/screens/DataManagement/views/DataManagementChild';
import CalculatedFieldModal from '@/screens/ChartBuilder/ConfigBuilder/DatabaseListing/CalculatedFieldModal.vue';
import DataListing from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/DataListing.vue';
import QueryComponent from '@/screens/DataManagement/components/QueryComponent.vue';
import { Log } from '@core/utils';
import {
  ChartInfo,
  Column,
  CreateQueryRequest,
  Dashboard,
  DashboardId,
  DatabaseSchema,
  DIException,
  DirectoryId,
  Field,
  Position,
  RawQuerySetting,
  TableColumn,
  TableSchema,
  TableStatus,
  TableType
} from '@core/domain';
import { _ChartStore, DashboardControllerModule, DashboardModule, WidgetModule } from '@/screens/DashboardDetail/stores';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import DirectoryCreate from '@/screens/Directory/components/DirectoryCreate.vue';
import MyDataPickDirectory from '@/screens/LakeHouse/Components/MoveFile/MyDataPickDirectory.vue';
import { get, toNumber } from 'lodash';
import MyDataPickFile from '@/screens/LakeHouse/Components/MoveFile/MyDataPickFile.vue';
import { PopupUtils } from '@/utils/popup.utils';
import LayoutNoData from '@/shared/components/LayoutWrapper/LayoutNoData.vue';
import SplitPanelMixin from '@/shared/components/LayoutWrapper/SplitPanel.mixin';
import { ListUtils, PositionUtils } from '@/utils';
import { EditorController } from '@/shared/fomula/EditorController';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { RouterLeavingHook } from '@/shared/components/VueHook/RouterLeavingHook';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';

Vue.use(DataComponents);

export enum QueryEditorMode {
  Dashboard,
  EditTable,
  Query
}

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
    DirectoryCreate,
    MyDataPickDirectory,
    MyDataPickFile,
    LayoutNoData
  }
})
export default class QueryEditor extends Mixins(DataManagementChild, SplitPanelMixin) implements RouterLeavingHook {
  private static readonly intervalTime = 1000; //ms
  private formulaController: FormulaController | null = null;
  private editorController = new EditorController();
  private currentQuery = '';
  /**
   * Biến này đc sử dụng để kiểm tra khi back screen.
   *
   * Không update biến này (chỉ đc update lần đầu khi vào screen)
   */
  private tempQuery = '';
  private readonly DatabaseTreeViewMode = DatabaseTreeViewMode;

  private enableAutoSave = true;

  @Ref()
  private readonly databaseTree?: DatabaseTreeViewCtrl;
  @Ref()
  private readonly queryComponent?: QueryComponent;

  @Ref()
  private readonly tableCreationModal!: ModalComponentType & TableCreationFromQueryModal;

  @Ref()
  private readonly mdCreateDirectory!: DirectoryCreate;

  @Ref()
  private readonly directoryPicker!: MyDataPickDirectory;

  @Ref()
  private readonly filePicker!: MyDataPickFile;

  mounted() {
    if (this.onInitedDatabaseSchemas) {
      this.onInitedDatabaseSchemas(this.initQueryBuilder);
    }
  }

  destroyed() {
    if (this.offInitedDatabaseSchemas) {
      this.offInitedDatabaseSchemas(this.initQueryBuilder);
    }
  }

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  private async initQueryBuilder() {
    this.initFormulaController();
    await this.initSelectedTable();
    await this.initAdhocComponent();
  }

  private initFormulaController() {
    FormulaSuggestionModule.initSuggestFunction({
      fileNames: ['clickhouse_syntax.json']
    });
    this.formulaController = new QueryFormulaController(FormulaSuggestionModule.allFunctions, DatabaseSchemaModule.databaseSchemas);
  }

  private get databaseName(): string {
    return (this.$route.query?.database as any) as string;
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

  private async initSelectedTable() {
    const database = this.$route.query?.database || '';
    const table = this.$route.query?.table || '';
    const foundSchema = this.findSchema ? this.findSchema(database.toString(), table.toString()) : {};
    if (foundSchema.database && foundSchema.table) {
      await this.selectTable(foundSchema.database, foundSchema.table);
      this.$nextTick(() => {
        this.databaseTree?.selectDatabase(foundSchema.database!);
      });
    }
  }

  private get isUpdateSchemaMode(): boolean {
    return this.mode === QueryEditorMode.EditTable;
  }

  private async selectTable(database: DatabaseSchema, table: TableSchema, onSelectComplete?: (database: DatabaseSchema, table: TableSchema) => void) {
    if (!database || !table) {
      this.currentQuery = '';
      return;
    } else {
      // Update selected Table
      if (this.isUpdateSchemaMode) {
        this.currentQuery = table.query ?? '';
      } else {
        this.currentQuery = `select * from ${database.name}.${table.name}`;
      }
      // Update Route Query
      if (this.$route.query?.database !== database.name || this.$route.query?.table !== table.name) {
        await this.$router.replace({ query: { database: database.name, table: table.name } });
      }

      // Query Table Data
      this.$nextTick(async () => {
        // @ts-ignore
        await this.queryComponent?.handleQuery();
      });
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

  private handleReloadDatabases() {
    if (this.loadDatabases) {
      this.loadDatabases();
    }
  }

  beforeDestroy() {
    _ChartStore.reset();
  }

  private showFolderPickerModal(event: Event) {
    this.directoryPicker.show(event);
  }

  private async showFilePickerModal(payload: { event: Event; chart: ChartInfo }) {
    const { event } = payload;
    await this.filePicker.show(event);
  }

  private handleSelectDirectory(directoryId: DirectoryId) {
    const createRequest = new CreateQueryRequest({ name: '', parentDirectoryId: directoryId, widgets: this.queryComponent?.allChartInfos });
    this.mdCreateDirectory.show(createRequest);
  }

  private handleSelectFile(directoryId: DirectoryId) {
    const widgetToCreate = this.queryComponent?.currentAdhocAnalysis?.chartInfo;
    if (widgetToCreate) {
      const position = PositionUtils.getPosition(widgetToCreate);
      WidgetModule.handleCreateNewWidget({ widget: widgetToCreate, position: position, dashboardId: directoryId })
        .then(widget => {
          PopupUtils.showSuccess('Save Ad hoc visualization successfully.');
        })
        .catch(ex => {
          Log.error(ex);
          PopupUtils.showError('Save Ad hoc visualization failed.');
        });
    }
  }

  private async initAdhocComponent() {
    switch (this.mode) {
      case QueryEditorMode.Dashboard: {
        const adhocId = this.queryDashboardId;
        await DashboardModule.handleLoadDashboard(adhocId!);
        await DashboardControllerModule.renderAllChartOrFilters();
        const query = (ListUtils.getHead(WidgetModule.allQueryWidgets)?.setting as RawQuerySetting)?.sql ?? '';
        Log.debug('initAdhocComponent::query::', query);
        this.tempQuery = query;
        this.updateDefaultQuery(query);
        this.queryComponent?.setWidgets(WidgetModule.allQueryWidgets);
        this.queryComponent?.selectChart(0);
        this.autoSave();
        break;
      }
      case QueryEditorMode.EditTable:
        break;
      case QueryEditorMode.Query:
        break;
    }
  }

  ///Xử lí khi click Save Analysis
  ///Save as => tạo query dashboard
  ///Đang ở editor => tạo query dashboard
  ///Đang ở query dasshboard => update adhoc query (adhoc đầu tiên)
  private async handleSave(payload: { mouseEvent?: Event; saveAs: boolean; hidePopup?: boolean }) {
    const { mouseEvent, saveAs, hidePopup } = payload;
    if (mouseEvent) {
      await this.showFolderPickerModal(mouseEvent);
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
    if (this.mode == QueryEditorMode.Dashboard) {
      const dashboardId = this.queryDashboardId;
      if (!dashboardId) {
        PopupUtils.showError('Analysis Not Found!');
      } else {
        await WidgetModule.handleCreateNewWidget({
          widget: chart,
          position: Position.default(),
          dashboardId: dashboardId
        });
      }
    }
  }

  private resizeChart() {
    this.queryComponent?.resizeChart();
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
    if (currentQuery !== this.tempQuery) {
      this.showEnsureModal('It looks like you have been editing something', 'If you leave before saving, your changes will be lost.', 'Leave', 'Cancel').then(
        res => {
          next(res.isConfirmed ? undefined : false);
        }
      );
    } else {
      next();
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
        this.queryComponent!.isSavingAdhocChart = true;
        await this.updateQueryDashboard(this.queryDashboardId, this.queryComponent?.getQuery(), true);
        this.tempQuery = this.queryComponent!.currentQuery;
        this.queryComponent!.isSavingAdhocChart = false;
      }
      setTimeout(this.autoSave, QueryEditor.intervalTime);
    }
  }

  private clearAutoSave() {
    this.enableAutoSave = false;
  }

  private handleQueryCreated(dashboard: Dashboard) {
    const query = get(dashboard, 'widgets[0].setting.sqlViews[0].query.query', '');
    Log.debug('handleQueryCreated:: query', query);
    this.tempQuery = query;
  }
}
