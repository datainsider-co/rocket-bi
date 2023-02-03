import MeasureFieldManagement from '@/screens/data-management/views/data-schema/MeasureFieldManagement.vue';
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator';
import DatabaseTreeView from '@/screens/data-management/components/database-tree-view/DatabaseTreeView.vue';
import DatabaseTreeViewCtrl from '@/screens/data-management/components/database-tree-view/DatabaseTreeView';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { ChartInfo, Column, DatabaseSchema, DIException, TableSchema, TableStatus, TableType } from '@core/common/domain';
import { Log } from '@core/utils';
import { DataManagementModule } from '@/screens/data-management/store/DataManagementStore';
import DataManagementChild from '../DataManagementChild';
import { ChartUtils, ListUtils } from '@/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { ContextMenuItem, Routers, Status } from '@/shared';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import Swal from 'sweetalert2';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import { DataSchemaModel, RenameActions, ViewMode } from '@/screens/data-management/views/data-schema/model';
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
export default class DataSchema extends Mixins(DataManagementChild, SplitPanelMixin) {
  private error = '';
  private model: DataSchemaModel | null = null;
  private tableData: ChartInfo | null = null;
  private loadingTableData = false;
  private viewMode: number = ViewMode.ViewDatabase;
  private listIgnoreClassForContextMenu = ['btn-icon-text'];
  private renameModalTitle = 'Rename';
  private columnKeyword = '';

  private fieldManagementStatus: Status = Status.Loaded;

  private refreshTable?: number | undefined;

  private isRLSLoading = false;

  @Ref()
  private readonly contextMenu!: ContextMenu;

  @Ref()
  private readonly renameModal!: DiRenameModal;

  @Ref()
  private readonly fieldManagement!: FieldManagement;

  @Ref()
  private readonly databaseTree!: DatabaseTreeViewCtrl;

  @Ref()
  private manageRLSPolicy?: ManageRLSPolicy;

  @Ref()
  private measureFieldManagement?: MeasureFieldManagement;

  @Ref()
  private calculatedFieldManagement?: CalculatedFieldManagement;

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  mounted() {
    if (this.onInitedDatabaseSchemas) {
      this.onInitedDatabaseSchemas(this.initDataSchema);
    }
  }

  destroy() {
    if (this.offInitedDatabaseSchemas) {
      this.offInitedDatabaseSchemas(this.initDataSchema);
    }
  }

  private get isViewSchema() {
    return this.viewMode === ViewMode.ViewSchema;
  }

  /**
   * Tra ve database name, khong co database name tra ve empty string
   */
  private get databaseName(): string {
    return (this.$route.query?.database || '') as string;
  }

  /**
   * Tra ve table name, khong co table name tra ve empty string
   */
  private get tableName(): string {
    return (this.$route.query?.table || '') as string;
  }

  private clearSearch() {
    this.columnKeyword = '';
  }

  private showNotFoundError(databaseName: string, tblName: string): void {
    if (databaseName && tblName) {
      this.error = `table ${databaseName}/${tblName} NOT FOUND!`;
    } else if (databaseName) {
      this.error = `DATABASE ${databaseName} NOT FOUND!`;
    } else {
      this.error = `DATABASE NOT FOUND!`;
    }
  }

  private async initDataSchema() {
    const foundSchema = this.findSchema ? this.findSchema(this.databaseName, this.tableName) : {};

    Log.debug('DataSchema::initDataSchema::foundSchema', foundSchema);
    // replace database to default if cannot find database
    const selectedDatabase: DatabaseSchema | undefined = foundSchema.database ?? ListUtils.getHead(this.databaseSchemas ?? []);
    await this.selectTable(selectedDatabase, foundSchema.table);
    if (selectedDatabase) {
      this.databaseTree.selectDatabase(selectedDatabase);
    }
  }

  private isSelectedTable(database: DatabaseSchema, table: TableSchema) {
    return this.model?.database === database && this.model?.table === table;
  }

  private updateDatabaseSchema(dbSchema: DatabaseSchema) {
    this.model = { database: dbSchema };
  }

  private handleSubmitTableName(database: DatabaseSchema, displayName: string) {
    const tempTable = TableSchema.empty();
    tempTable.displayName = displayName;
    tempTable.dbName = database.name;
    this.model = { database: database, table: tempTable };
    this.$nextTick(() => {
      this.changeViewMode(ViewMode.CreateTable);
    });
  }

  /**
   * Kiem tra hien tai data schema dang trong mode editing hay khong, neu co se hien confirm khi route change
   */
  private isEditingMode(): boolean {
    const isEditingSchema: boolean = (this.viewMode === ViewMode.EditSchema && this.fieldManagement.isEditing()) ?? false;
    return isEditingSchema;
  }

  private async ensureViewMode(): Promise<void> {
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

  private getSwitchMode(dbName?: string, tblName?: string): SwitchMode {
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

  private async switchPage(
    database?: DatabaseSchema,
    table?: TableSchema,
    onSelectComplete?: (database: DatabaseSchema, table?: TableSchema) => void
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
        await this.queryTableData(table!);
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
        // this.viewMode = ViewMode.ViewSchema;
        await this.queryTableData(table!);
        if (onSelectComplete) {
          onSelectComplete(database!, table!);
        }
        break;
      }
    }
  }

  private async selectTable(database?: DatabaseSchema, table?: TableSchema, onSelectComplete?: (database: DatabaseSchema, table?: TableSchema) => void) {
    try {
      await this.ensureViewMode();
      this.clearSearch();
      await this.switchPage(database, table, onSelectComplete);
    } catch (ex) {
      Log.debug(`selectTable:: error cause ${ex.message}`, ex);
    }
  }

  private async queryTableData(table: TableSchema) {
    this.tableData = null;
    this.loadingTableData = true;
    await DataManagementModule.handleLoadTableData(table);
    this.tableData = DataManagementModule.tableChartInfo;
    this.loadingTableData = false;
  }

  private changeViewMode(modeId: number) {
    this.clearSearch();
    this.viewMode = modeId;
    this.trackViewMode(modeId);
  }

  private trackViewMode(viewMode: number) {
    switch (viewMode as ViewMode) {
      case ViewMode.EditSchema:
        TrackingUtils.track(TrackEvents.DataSchemaEditSchema, {
          database_name: this.model?.database.name,
          table_name: this.model?.table?.name
        });
        break;
      case ViewMode.CreateTable:
        TrackingUtils.track(TrackEvents.DataSchemaCreateSchema, {
          database_name: this.model?.database.name,
          table_name: this.model?.table?.displayName
        });
        break;
      case ViewMode.ViewData:
        TrackingUtils.track(TrackEvents.DataSchemaViewData, {
          database_name: this.model?.database.name,
          table_name: this.model?.table?.name
        });
        break;
      case ViewMode.ViewSchema:
        TrackingUtils.track(TrackEvents.DataSchemaViewData, {
          database_name: this.model?.database.name,
          table_name: this.model?.table?.name
        });
        break;
    }
  }

  private async onDropTable(target: TableSchema) {
    if (target.dbName === this.model?.table?.dbName && target.name === this.model?.table?.name) {
      this.model = null;
      this.tableData = null;
      await this.$router.replace({ query: {} });
    }
  }

  private onDeleteColumn(target: TableSchema) {
    this.onUpdateTable(target);
  }

  private onUpdateTable(target: TableSchema) {
    if (target.dbName === this.model?.table?.dbName && target.name === this.model?.table?.name) {
      const foundSchema = this.findSchema ? this.findSchema(target.dbName, target.name) : {};
      if (foundSchema.database && foundSchema.table) {
        Log.debug('onUpdateTable::selectTable');
        return this.selectTable(foundSchema.database, foundSchema.table);
      }
    }
  }

  @Watch('$route.query')
  private watchRouteQuery() {
    Log.debug('Route query change', this.$route.query);
  }

  private async handleReloadDatabaseSchema() {
    if (this.loadDatabases) {
      await this.loadDatabases();
    }
  }

  private showActionMenu(event: MouseEvent) {
    const actions = this.getMenuAction(this.model!);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'schema-action', 80);
    this.contextMenu.show(buttonEvent, actions);
  }

  private getMenuAction(model: DataSchemaModel): ContextMenuItem[] {
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
        text: `Rename database`,
        click: () => {
          const data: any = {
            model: model,
            action: RenameActions.database
          };
          this.renameModalTitle = `Rename database`;
          this.contextMenu.hide();
          this.renameModal.show(model.database.displayName, (newName: string) => {
            this.handleRenameTable(newName, data);
          });
          TrackingUtils.track(TrackEvents.DataSchemaRenameDatabase, { database: this.model!.database.name });
        }
      },
      {
        text: `Rename table`,
        disabled: !this.model?.database && !this.model?.table,
        click: () => {
          const data: any = {
            model: model,
            action: RenameActions.table
          };
          this.renameModalTitle = `Rename table`;
          this.contextMenu.hide();
          this.renameModal.show(model.table!.name, (newName: string) => {
            this.handleRenameTable(newName, data);
          });
          TrackingUtils.track(TrackEvents.DataSchemaRenameTable, {
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

  private get isShowUpdateTableByQuery() {
    return (
      this.model?.database && this.model?.table && (this.model.table.tableType === TableType.View || this.model.table.tableType === TableType.Materialized)
    );
  }

  private async handleRenameTable(newName: string, data: { model: DataSchemaModel; action: RenameActions }) {
    try {
      const { model, action } = data;
      this.renameModal.hide();
      switch (action) {
        case RenameActions.database: {
          TrackingUtils.track(TrackEvents.DatabaseSubmitRename, {
            database_new_name: newName,
            database_old_name: this.model?.database.name
          });
          const schemaUpdated = await DataManagementModule.updateDatabaseDisplayName({
            newDisplayName: newName,
            dbSchema: model.database
          });
          if (this.model?.database?.name === model.database?.displayName) {
            await this.$router.replace({ query: { ...this.$router.currentRoute.query, database: newName } });
            this.model!.database = schemaUpdated;
          }
          return DatabaseSchemaModule.setDatabaseSchema(schemaUpdated);
        }
        case RenameActions.table: {
          TrackingUtils.track(TrackEvents.TableSubmitRename, {
            table_new_name: newName,
            table_old_name: this.model?.table?.name,
            database_name: data.model.table?.dbName
          });
          const schemaUpdated = await DataManagementModule.updateTableName({
            newName: newName,
            dbSchema: model.database,
            table: model.table!
          });
          if (this.model?.table?.name === model.table?.name) {
            this.model!.table!.name = newName;
            await this.$router.replace({ query: { ...this.$router.currentRoute.query, table: newName } });
            const tableUpdated = schemaUpdated.tables.find(table => table.name === newName);
            if (tableUpdated) {
              this.model = { database: schemaUpdated, table: tableUpdated };
            }
          }
          return DatabaseSchemaModule.setDatabaseSchema(schemaUpdated);
        }
        case RenameActions.column:
          break;
      }
    } catch (e) {
      Log.error(e);
      await Swal.fire({
        icon: 'error',
        title: 'Rename Error',
        html: e.message
      });
    }
  }

  private get editingSchema(): boolean {
    return this.viewMode === ViewMode.EditSchema;
  }

  private get isRLSEditMode(): boolean {
    return this.viewMode === ViewMode.EditRLS;
  }

  private get isCalculatedFieldEditMode(): boolean {
    return this.viewMode === ViewMode.EditCalculatedField;
  }

  private get isMeasureView(): boolean {
    return this.viewMode === ViewMode.ViewMeasure;
  }

  private get isRLSViewMode(): boolean {
    return this.viewMode === ViewMode.ViewRLS;
  }

  private get viewingSchema(): boolean {
    return this.viewMode === ViewMode.ViewSchema || this.viewMode === ViewMode.EditSchema;
  }

  private get viewingMeasure(): boolean {
    return this.viewMode === ViewMode.ViewMeasure;
  }

  private get creatingSchema(): boolean {
    return this.viewMode === ViewMode.CreateTable && this.model?.table !== undefined;
  }

  private get viewingDatabase(): boolean {
    return this.viewMode === ViewMode.ViewDatabase && this.model?.database !== undefined;
  }

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  @Track(TrackEvents.TableSubmitSchema, {
    table_name: (_: DataSchema) => _.model?.table?.name,
    database_name: (_: DataSchema) => _.model?.database?.name
  })
  private async handleSave() {
    try {
      this.fieldManagementStatus = Status.Loading;
      const tableToEdit = await this.fieldManagement.getEditedTable();
      if (tableToEdit && this.model?.database) {
        this.changeViewMode(ViewMode.ViewSchema);
        ///Update
        const tableUpdated = await DataManagementModule.updateTableInfo({ table: tableToEdit });
        ///Query
        // const tableIdx = this.model!.database.tables.findIndex(table => table.name === tableUpdated.name);
        // if (tableIdx >= 0) {
        //   this.model!.database.tables[tableIdx] = tableUpdated;
        //   await DatabaseSchemaModule.setDatabaseSchema(this.model!.database);
        // }
        await DatabaseSchemaModule.reload(tableUpdated.dbName);
        Log.debug('handleSave::selectTable');
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

  private autoRefreshTable() {
    ///Current not have interval
    if (!this.refreshTable) {
      this.refreshTable = setInterval(async () => {
        this.model!.table = await DatabaseSchemaModule.getTableSchema(this.model!.table!);
      }, 30000);
    }
  }

  private clearRefreshTable() {
    if (this.refreshTable) {
      clearInterval(this.refreshTable);
      this.refreshTable = void 0;
    }
  }

  @Track(TrackEvents.DataSchemaCancel)
  private async handleCancel() {
    try {
      if (this.model?.table && this.fieldManagement.isEditing()) {
        const { isConfirmed } = await this.showEnsureModal(
          'It looks like you have been editing something',
          'If you leave before saving, your changes will be lost.',
          'Leave',
          'Cancel'
        );
        if (isConfirmed) {
          this.changeViewMode(ViewMode.ViewSchema);
          TrackingUtils.track(TrackEvents.DataSchemaSubmitCancel, {});
        }
      } else {
        this.changeViewMode(ViewMode.ViewSchema);
      }
    } catch (ex) {
      Log.error(ex);
    }
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

  private get buttonInfos(): ButtonInfo[] {
    return [
      {
        displayName: this.isMobile ? 'Schema' : 'Table Schema',
        isActive: this.viewingSchema,
        onClick: () => this.changeViewMode(ViewMode.ViewSchema)
      },
      {
        displayName: this.isMobile ? 'Data' : 'Table Data',
        isActive: this.viewMode === ViewMode.ViewData,
        onClick: () => this.changeViewMode(ViewMode.ViewData)
      },
      {
        displayName: 'Measure Schema',
        isHidden: this.isMobile,
        isActive: this.viewMode === ViewMode.ViewMeasure,
        onClick: () => this.changeViewMode(ViewMode.ViewMeasure)
      },
      {
        displayName: 'Calculated Field',
        isHidden: this.isMobile,
        isActive: this.viewMode === ViewMode.EditCalculatedField,
        onClick: () => this.changeViewMode(ViewMode.EditCalculatedField)
      },
      {
        displayName: 'RLS',
        isActive: this.viewMode === ViewMode.ViewRLS || this.viewMode === ViewMode.EditRLS,
        onClick: () => this.changeViewMode(ViewMode.ViewRLS)
      }
      // { displayName: 'Python', onClick: this.handleSelectPythonRunner }
    ];
  }

  private get isReadonlyTable(): boolean {
    return this.model?.table?.tableType ? ChartUtils.isReadonlyTable(this.model?.table?.tableType) : true;
  }

  private async onToggleDatabase(database: DatabaseSchema, isShowing: boolean) {
    if (isShowing) {
      await this.selectTable(database);
    }
  }

  @Track(TrackEvents.DataSchemaAddColumn, {
    table_name: (_: DataSchema) => _.model?.table?.name,
    database_name: (_: DataSchema) => _.model?.table?.dbName
  })
  private handleAddColumn() {
    this.fieldManagement.addColumn();
  }

  private handleCreatedTable(table: TableSchema) {
    const newTableExisted: boolean =
      this.model?.database !== undefined && this.model.database.tables.find(tableToFind => tableToFind.name === table.name) !== undefined;
    if (!newTableExisted) {
      this.model?.database.tables.push(table);
      this.selectTable(this.model!.database, table);
    }
  }

  private get isProcessing(): boolean {
    return this.model?.table?.tableStatus === TableStatus.Processing;
  }

  private editMeasureField(column: Column) {
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.measureFieldOptions[0]);
  }

  private editCalculatedField(column: Column) {
    Log.debug('editCalculatedField', this.databaseTree.fieldOptions);
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.fieldOptions[0]);
  }

  private deleteMeasureField(column: Column) {
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.measureFieldOptions[1]);
  }

  private deleteCalculatedField(column: Column) {
    // @ts-ignore
    this.databaseTree?.handleConfigColumn(this.model?.table!, column, this.databaseTree.fieldOptions[1]);
  }

  private handleCancelRLSChanged() {
    this.manageRLSPolicy?.cancelRLS();
    this.changeViewMode(ViewMode.ViewRLS);
  }

  private async handleSaveRLS() {
    try {
      this.isRLSLoading = false;
      await this.manageRLSPolicy?.handleSavePolicies();
      this.viewMode = ViewMode.ViewRLS;
      this.isRLSLoading = true;
    } catch (e) {
      Log.error('DataSchema::handleSaveRLS::error::', e);
    }
  }

  private handleAddRLS() {
    this.manageRLSPolicy?.addRLSPolicy();
  }

  private addMeasureFunction() {
    this.measureFieldManagement?.addMeasureField();
  }

  private addCalculatedField() {
    this.calculatedFieldManagement?.addCalculatedField();
  }
}
