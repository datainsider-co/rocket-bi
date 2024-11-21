import MeasureFieldManagement from '@/screens/data-management/views/data-schema/MeasureFieldManagement.vue';
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator';
import DatabaseTreeView from '@/screens/data-management/components/database-tree-view/DatabaseTreeView.vue';
import DatabaseTreeViewCtrl from '@/screens/data-management/components/database-tree-view/DatabaseTreeView';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import {
  ChartInfo,
  Column,
  DatabaseInfo,
  DIException,
  QuerySetting,
  TableChartOption,
  TableQueryChartSetting,
  TableSchema,
  TableStatus,
  TableType,
  WidgetCommonData,
  WidgetSetting
} from '@core/common/domain';
import { Log } from '@core/utils';
import { DataManagementModule, DataManagementStore } from '@/screens/data-management/store/DataManagementStore';
import AbstractSchemaComponent, { FindSchemaResponse } from '../AbstractSchemaComponent';
import { ChartUtils, ListUtils } from '@/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { ContextMenuItem, Routers, Status } from '@/shared';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { DatabaseSchemaModule, SchemaReloadMode } from '@/store/modules/data-builder/DatabaseSchemaStore';
import Swal from 'sweetalert2';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import { DataSchemaModel, ViewMode } from '@/screens/data-management/views/data-schema/model';
import FieldManagement from '@/screens/data-management/views/data-schema/FieldManagement.vue';
import TableManagement from '@/screens/data-management/views/data-schema/TableManagement.vue';
import FieldCreationManagement from '@/screens/data-management/views/data-schema/FieldCreationManagement.vue';
import DiLoading from '@/shared/components/DiLoading.vue';
// import { LayoutContent, LayoutHeader, LayoutWrapper } from '@/shared/components/LayoutWrapper';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import { LayoutNoData } from '@/shared/components/layout-wrapper';
import SplitPanelMixin from '@/shared/components/layout-wrapper/SplitPanelMixin';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import ManageRLSPolicy from '@/screens/data-management/views/data-schema/row-level-security/manage-policy/ManageRLSPolicy.vue';
import { StringUtils } from '@/utils/StringUtils';
import CalculatedFieldManagement from '@/screens/data-management/views/data-schema/CalculatedFieldManagement.vue';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import { AtomicAction } from '@core/common/misc';

enum SwitchMode {
  SelectDatabase,
  SelectTable,
  SelectEmpty,
  SameDatabaseAndTable
}

@Component({
  components: {
    DatabaseTreeView,
    ChartHolder,
    DiRenameModal,
    InputSetting,
    DiDatePicker,
    DiButtonGroup,
    FieldManagement,
    TableManagement,
    FieldCreationManagement,
    DiLoading,
    Split,
    SplitArea,
    LayoutNoData,
    MeasureFieldManagement,
    ManageRLSPolicy,
    CalculatedFieldManagement
  }
})
export default class DataSchema extends Mixins(AbstractSchemaComponent, SplitPanelMixin) {
  protected error = '';
  protected model: DataSchemaModel | null = null;
  protected tableData: ChartInfo | null = null;
  protected loadingTableData = false;
  protected viewMode: number = ViewMode.ViewDatabase;
  protected listIgnoreClassForContextMenu = ['btn-icon-text'];
  protected renameModalTitle = 'Rename';
  protected columnKeyword = '';

  protected fieldManagementStatus: Status = Status.Loaded;

  protected refreshTable?: number | undefined;

  protected isRLSLoading = false;
  @Ref()
  protected readonly contextMenu!: ContextMenu;

  @Ref()
  protected readonly renameModal!: DiRenameModal;

  @Ref()
  protected readonly fieldManagement!: FieldManagement;

  @Ref()
  protected readonly databaseTree!: DatabaseTreeViewCtrl;

  @Ref()
  protected manageRLSPolicy?: ManageRLSPolicy;

  @Ref()
  protected measureFieldManagement?: MeasureFieldManagement;

  @Ref()
  protected calculatedFieldManagement?: CalculatedFieldManagement;

  @Ref()
  protected readonly searchInput!: DiSearchInput;

  // key is database name, value is loading status
  protected get dbLoadingMap(): { [_: string]: boolean } {
    return DatabaseSchemaModule.databaseLoadingMap;
  }

  protected get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  mounted() {
    this.init();
  }

  protected async init() {
    if (this.loadShortDatabaseInfos) {
      await this.loadShortDatabaseInfos();
    }
    await this.initSelectDatabase();
  }

  protected get isViewSchema() {
    return this.viewMode === ViewMode.ViewSchema;
  }

  /**
   * Tra ve database name, khong co database name tra ve empty string
   */
  protected get databaseName(): string {
    return (this.$route.query?.database || '') as string;
  }

  /**
   * Tra ve table name, khong co table name tra ve empty string
   */
  protected get tableName(): string {
    return (this.$route.query?.table || '') as string;
  }

  protected clearSearch() {
    this.columnKeyword = '';
  }

  protected get previewWidgetSetting(): WidgetSetting {
    const setting = WidgetSetting.default();
    setting.padding = 0;
    setting.border.radius.setAllRadius(4);
    return setting;
  }

  protected showNotFoundError(databaseName: string, tblName: string): void {
    if (databaseName && tblName) {
      this.error = `table ${databaseName}/${tblName} NOT FOUND!`;
    } else if (databaseName) {
      this.error = `DATABASE ${databaseName} NOT FOUND!`;
    } else {
      this.error = `DATABASE NOT FOUND!`;
    }
  }

  protected async initSelectDatabase(): Promise<void> {
    const firstDatabase: DatabaseInfo | undefined = ListUtils.getHead(this.databaseSchemas ?? []);
    const dbName: string = this.databaseName || firstDatabase?.name || '';
    const tblName: string = this.tableName || '';
    const findResponse: FindSchemaResponse = await this.findSchema(dbName, tblName);
    Log.debug('DataSchema::initDataSchema::foundSchema', dbName, tblName, findResponse);

    // replace database to default if cannot find database
    await this.selectTable(findResponse.database, findResponse.table);
    if (findResponse.database) {
      this.databaseTree.selectDatabase(findResponse.database);
    }
  }

  protected isSelectedTable(database: DatabaseInfo, table: TableSchema) {
    return this.model?.database === database && this.model?.table === table;
  }

  protected updateDatabaseSchema(dbSchema: DatabaseInfo) {
    this.model = { database: dbSchema };
  }

  protected handleSubmitTableName(database: DatabaseInfo, displayName: string) {
    const tempTable = TableSchema.empty();
    tempTable.displayName = displayName;
    tempTable.dbName = database.name;
    this.model = { database: database, table: tempTable };
    this.$nextTick(() => {
      this.switchViewMode(ViewMode.CreateTable);
    });
  }

  /**
   * Kiem tra hien tai data schema dang trong mode editing hay khong, neu co se hien confirm khi route change
   */
  protected isEditingMode(): boolean {
    const isEditingSchema: boolean = (this.viewMode === ViewMode.EditSchema && this.fieldManagement.isEditing()) ?? false;
    return isEditingSchema;
  }

  protected async ensureViewMode(): Promise<void> {
    if (this.isEditingMode()) {
      const { isConfirmed } = await this.showEnsureModal(
        'It looks like you have been editing something',
        'If you leave before saving, your changes will be lost.',
        'Leave',
        'Cancel'
      );
      if (!isConfirmed) {
        return Promise.reject(new DIException('Cannot select table cause user cancel select table'));
      }
    }
    return Promise.resolve();
  }

  protected getSwitchMode(dbName?: string, tblName?: string): SwitchMode {
    const currentDbName: string = this.model?.database?.name || '';
    const currentTblName: string = this.model?.table?.name || '';
    if (dbName === currentDbName && tblName === currentTblName) {
      return SwitchMode.SameDatabaseAndTable;
    }
    if (StringUtils.isNotEmpty(tblName) && tblName !== currentTblName) {
      return SwitchMode.SelectTable;
    }
    if (StringUtils.isNotEmpty(dbName) && dbName !== currentDbName) {
      return SwitchMode.SelectDatabase;
    }
    if (dbName == this.databaseName && tblName == this.tableName) {
      return SwitchMode.SameDatabaseAndTable;
    }
    if (dbName == this.databaseName) {
      return SwitchMode.SelectDatabase;
    }
    return SwitchMode.SelectEmpty;
  }

  protected async switchPage(
    database?: DatabaseInfo,
    table?: TableSchema,
    onSelectComplete?: (database: DatabaseInfo, table?: TableSchema) => void
  ): Promise<void> {
    const switchMode: SwitchMode = this.getSwitchMode(database?.name, table?.name);
    switch (switchMode) {
      case SwitchMode.SelectEmpty: {
        Log.debug('DatabaseSchemaView.switchPage: SelectEmpty');
        this.model = null;
        this.tableData = null;
        this.showNotFoundError(this.databaseName, this.tableName);
        break;
      }
      case SwitchMode.SelectDatabase: {
        Log.debug('DatabaseSchemaView.switchPage: SelectDatabase');
        this.model = { database: database! };
        this.tableData = null;
        this.viewMode = ViewMode.ViewDatabase;
        try {
          await this.$router.replace({ query: { database: database!.name } });
        } catch (ex) {
          Log.debug('Router to', database?.name, 'has error');
          // ignore exception, just log
        }
        if (onSelectComplete) {
          onSelectComplete(database!);
        }
        break;
      }
      case SwitchMode.SelectTable: {
        Log.debug('DatabaseSchemaView.switchPage: SelectTable');
        this.model = { database: database!, table: table! };
        this.error = '';
        this.viewMode = ViewMode.ViewSchema;
        try {
          await this.$router.replace({ query: { database: database!.name, table: table!.name } });
        } catch (ex) {
          Log.debug('Router to', database?.name, table?.name, 'has error');
          // ignore exception, just log
        }
        if (onSelectComplete) {
          onSelectComplete(database!, table!);
        }
        break;
      }
      case SwitchMode.SameDatabaseAndTable: {
        Log.debug('DatabaseSchemaView.switchPage: SameDatabaseAndTable');
        this.model = { database: database!, table: table! };
        if (onSelectComplete) {
          onSelectComplete(database!, table!);
        }
        break;
      }
    }
  }

  protected async selectTable(database?: DatabaseInfo, table?: TableSchema, onSelectComplete?: (database: DatabaseInfo, table?: TableSchema) => void) {
    try {
      await this.ensureViewMode();
      this.clearSearch();
      await this.switchPage(database, table, onSelectComplete);
    } catch (ex) {
      Log.debug(`selectTable:: error cause ${ex.message}`, ex);
    }
  }

  protected async queryTableData(table: TableSchema) {
    try {
      this.tableData = null;
      this.error = '';
      this.loadingTableData = true;
      await DataManagementModule.handleLoadTableData(table);
      this.tableData = this.toPreviewChartInfo();
      this.loadingTableData = false;
    } catch (ex) {
      this.loadingTableData = false;
      this.tableData = null;
      this.error = ex.message;
    }
  }

  protected toPreviewChartInfo(): ChartInfo {
    const query: TableQueryChartSetting = TableQueryChartSetting.default();
    const chartOption: TableChartOption | undefined = query.getChartOption<TableChartOption>();
    if (chartOption) {
      // chartOption.
    }
    const commonSetting: WidgetCommonData = { id: DataManagementStore.DEFAULT_TABLE_ID, name: '', description: '' };
    return new ChartInfo(commonSetting, query);
  }

  protected switchViewMode(newMode: ViewMode): void {
    this.clearSearch();
    this.viewMode = newMode;
    this.$nextTick(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    });
  }

  protected async onDropDatabase(dbName: string): Promise<void> {
    if (dbName === this.model?.database?.name) {
      await this.$router
        .replace({
          query: {}
        })
        .catch(ex => {
          Log.debug('Router to', dbName, 'has error');
          // ignore exception, just log
        });
      await this.initSelectDatabase();
    }
  }

  protected async onDropTable(target: TableSchema): Promise<void> {
    if (target.dbName === this.model?.table?.dbName && target.name === this.model?.table?.name) {
      const database: DatabaseInfo = await DatabaseSchemaModule.loadDatabaseInfo({ dbName: target.dbName });
      await this.switchPage(database);
    }
  }

  protected async onDeleteColumn(target: TableSchema): Promise<void> {
    this.onUpdateTable(target);
  }

  protected async onUpdateTable(target: TableSchema) {
    if (target.dbName === this.model?.table?.dbName && target.name === this.model?.table?.name) {
      const foundSchema = await this.findSchema(target.dbName, target.name);
      if (foundSchema.database && foundSchema.table) {
        Log.debug('onUpdateTable::selectTable');
        return this.selectTable(foundSchema.database, foundSchema.table);
      }
    }
  }

  @Watch('$route.query')
  protected watchRouteQuery() {
    Log.debug('Route query change', this.$route.query);
  }

  protected async handleReloadDatabaseInfos() {
    if (this.reloadShortDatabaseInfos) {
      await this.reloadShortDatabaseInfos(SchemaReloadMode.OnlyDatabaseHasTable);
    }
  }

  protected showActionMenu(event: MouseEvent) {
    const actions = this.getMenuAction(this.model!);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'schema-action', 80);
    this.contextMenu.show(buttonEvent, actions);
  }

  protected getMenuAction(model: DataSchemaModel): ContextMenuItem[] {
    const actions = [
      {
        text: `Query table`,
        disabled: !(this.model?.database && this.model.table),
        click: () => {
          this.contextMenu.hide();
          this.$router.push({
            name: Routers.QueryEditor,
            query: {
              database: this.model!.database.name,
              table: this.model!.table?.name
            }
          });
          TrackingUtils.track(TrackEvents.DataSchemaQueryTable, {
            database: this.model!.database.name,
            table: this.model!.table?.name
          });
        }
      },
      {
        text: `Update schema by query`,
        hidden: !this.isShowUpdateTableByQuery,
        click: () => {
          this.contextMenu.hide();
          this.$router.push({
            name: Routers.QueryEditor,
            query: {
              database: this.model!.database.name,
              table: this.model!.table?.name,
              tableDisplayName: this.model?.table?.displayName,
              tableType: this.model?.table?.tableType,
              mode: 'update'
            }
          });
          TrackingUtils.track(TrackEvents.DataSchemaUpdateSchemaByQuery, {
            database: this.model!.database.name,
            table: this.model!.table?.name
          });
        }
      },
      // {
      //   text: `Edit table`,
      //   click: () => {
      //     this.contextMenu.hide();
      //     this.changeViewMode(VIEW_MODE.EDIT_SCHEMA);
      //   }
      // },
      // {
      //   text: `Add calculated field`,
      //   click: () => {
      //     this.contextMenu.hide();
      //     // @ts-ignore
      //     this.databaseTree?.handleConfigTable(this.model?.table!, this.databaseTree.tableActions[0]);
      //   }
      // },
      // {
      //   text: `Add measure`,
      //   click: () => {
      //     this.contextMenu.hide();
      //     // @ts-ignore
      //     this.databaseTree?.handleConfigTable(this.model?.table!, this.databaseTree.tableActions[1]);
      //   }
      // },
      {
        text: `Delete table`,
        disabled: this.model?.table == undefined,
        click: () => {
          PopupUtils.hideAllPopup();
          // @ts-ignore
          this.databaseTree?.handleConfigTable(this.model?.table!, this.databaseTree.tableActions[2]);
        }
      }
    ] as ContextMenuItem[];

    return ListUtils.remove(actions, action => action.hidden ?? false);
  }

  protected get isShowUpdateTableByQuery() {
    return (
      this.model?.database && this.model?.table && (this.model.table.tableType === TableType.View || this.model.table.tableType === TableType.Materialized)
    );
  }

  protected get editingSchema(): boolean {
    return this.viewMode === ViewMode.EditSchema;
  }

  protected get isRLSEditMode(): boolean {
    return this.viewMode === ViewMode.EditRLS;
  }

  protected get isCalculatedFieldEditMode(): boolean {
    return this.viewMode === ViewMode.EditCalculatedField;
  }

  protected get isMeasureView(): boolean {
    return this.viewMode === ViewMode.ViewMeasure;
  }

  protected get isRLSViewMode(): boolean {
    return this.viewMode === ViewMode.ViewRLS;
  }

  protected get viewingSchema(): boolean {
    return this.viewMode === ViewMode.ViewSchema || this.viewMode === ViewMode.EditSchema;
  }

  protected get viewingMeasure(): boolean {
    return this.viewMode === ViewMode.ViewMeasure;
  }

  protected get creatingSchema(): boolean {
    return this.viewMode === ViewMode.CreateTable && this.model?.table !== undefined;
  }

  protected get viewingDatabase(): boolean {
    return this.viewMode === ViewMode.ViewDatabase && this.model?.database !== undefined;
  }

  protected get isMobile() {
    return ChartUtils.isMobile();
  }

  @AtomicAction()
  protected async handleSave(): Promise<void> {
    try {
      this.fieldManagementStatus = Status.Loading;
      const newTable: TableSchema | undefined = await this.fieldManagement.getEditedTable();
      if (newTable && this.model?.database) {
        this.switchViewMode(ViewMode.ViewSchema);
        await DatabaseSchemaModule.updateTableSchema(newTable);
        const database: DatabaseInfo = await DatabaseSchemaModule.reload(this.model.database.name);
        const newTableSchema: TableSchema | undefined = await DatabaseSchemaModule.loadTableSchema({ dbName: newTable.dbName, tableName: newTable.name });
        this.model = {
          database,
          table: newTableSchema
        };
      }
    } catch (e) {
      Log.error(e);
      await Swal.fire({
        icon: 'error',
        title: 'Edit Table Error',
        html: e.message
      });
    } finally {
      this.fieldManagementStatus = Status.Loaded;
    }
  }

  @Watch('model.table.tableStatus')
  onTableStatusChange(status: TableStatus) {
    if (status === TableStatus.Processing) {
      this.autoRefreshTable();
    } else {
      this.clearRefreshTable();
    }
  }

  protected autoRefreshTable() {
    ///Current not have interval
    if (!this.refreshTable) {
      this.refreshTable = setInterval(async () => {
        const table: TableSchema = this.model!.table!;
        this.model!.table = await DatabaseSchemaModule.fetchTableSchema({ dbName: table.dbName, tblName: table.name });
      }, 30000);
    }
  }

  protected clearRefreshTable() {
    if (this.refreshTable) {
      clearInterval(this.refreshTable);
      this.refreshTable = void 0;
    }
  }

  @Track(TrackEvents.DataSchemaCancel)
  protected async handleCancel() {
    try {
      if (this.model?.table && this.fieldManagement.isEditing()) {
        const { isConfirmed } = await this.showEnsureModal(
          'It looks like you have been editing something',
          'If you leave before saving, your changes will be lost.',
          'Leave',
          'Cancel'
        );
        if (isConfirmed) {
          this.switchViewMode(ViewMode.ViewSchema);
          TrackingUtils.track(TrackEvents.DataSchemaSubmitCancel, {});
        }
      } else {
        this.switchViewMode(ViewMode.ViewSchema);
      }
    } catch (ex) {
      Log.error(ex);
    }
  }

  protected async showEnsureModal(title: string, html: string, confirmButtonText?: string, cancelButtonText?: string) {
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

  protected get buttonInfos(): ButtonInfo[] {
    return [
      {
        displayName: this.isMobile ? 'Schema' : 'Table Schema',
        isActive: this.viewingSchema,
        onClick: () => this.switchViewMode(ViewMode.ViewSchema)
      },
      {
        displayName: this.isMobile ? 'Data' : 'Table Data',
        isActive: this.viewMode === ViewMode.ViewData,
        onClick: () => {
          this.switchViewMode(ViewMode.ViewData);
          this.queryTableData(this.model!.table!);
        }
      },
      {
        displayName: 'Measure Schema',
        isHidden: this.isMobile,
        isActive: this.viewMode === ViewMode.ViewMeasure,
        onClick: () => this.switchViewMode(ViewMode.ViewMeasure)
      },
      {
        displayName: 'Calculated Field',
        isHidden: this.isMobile,
        isActive: this.viewMode === ViewMode.EditCalculatedField,
        onClick: () => this.switchViewMode(ViewMode.EditCalculatedField)
      },
      {
        displayName: 'RLS',
        isActive: this.viewMode === ViewMode.ViewRLS || this.viewMode === ViewMode.EditRLS,
        onClick: () => this.switchViewMode(ViewMode.ViewRLS)
      }
      // { displayName: 'Python', onClick: this.handleSelectPythonRunner }
    ];
  }

  protected get isReadonlyTable(): boolean {
    return this.model?.table?.tableType ? ChartUtils.isReadonlyTable(this.model?.table?.tableType) : true;
  }

  protected async onToggleDatabase(dbName: string, isShowing: boolean): Promise<void> {
    if (isShowing) {
      const database = await DatabaseSchemaModule.loadDatabaseInfo({ dbName });
      await this.selectTable(database);
    }
  }

  @Track(TrackEvents.DataSchemaAddColumn, {
    table_name: (_: DataSchema) => _.model?.table?.name,
    database_name: (_: DataSchema) => _.model?.table?.dbName
  })
  protected handleAddColumn() {
    this.fieldManagement.addColumn();
  }

  protected async handleCreatedTable(table: TableSchema): Promise<void> {
    const database = await this.findSchema(table.dbName, table.name);
    await this.selectTable(database.database, database.table);
  }

  protected get isProcessing(): boolean {
    return this.model?.table?.tableStatus === TableStatus.Processing;
  }

  protected editMeasureField(column: Column) {
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.measureFieldOptions[0]);
  }

  protected editCalculatedField(column: Column) {
    // Log.debug('editCalculatedField', this.databaseTree.fieldOptions);
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.getFieldOptions()[0]);
  }

  protected deleteMeasureField(column: Column) {
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.measureFieldOptions[1]);
  }

  protected deleteCalculatedField(column: Column) {
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.fieldOptions[1]);
  }

  protected handleCancelRLSChanged() {
    this.manageRLSPolicy?.cancelRLS();
    this.switchViewMode(ViewMode.ViewRLS);
  }

  protected async handleSaveRLS() {
    try {
      this.isRLSLoading = false;
      await this.manageRLSPolicy?.handleSavePolicies();
      this.viewMode = ViewMode.ViewRLS;
      this.isRLSLoading = true;
    } catch (e) {
      Log.error('DataSchema::handleSaveRLS::error::', e);
    }
  }

  protected handleAddRLS() {
    this.manageRLSPolicy?.addRLSPolicy();
  }

  protected addMeasureFunction() {
    this.measureFieldManagement?.addMeasureField();
  }

  protected addCalculatedField() {
    this.calculatedFieldManagement?.addCalculatedField();
  }
}
