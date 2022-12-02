/*
 * @author: tvc12 - Thien Vi
 * @created: 4/19/21, 1:46 PM
 */

import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { TableSchema, TableType } from '@core/common/domain/model/schema';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { SlTreeNode, SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { ListUtils, TimeoutUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';

import SlVueTree from '@/shared/components/builder/treemenu/SlVueTree.vue';
import { LabelNode, Status, VerticalScrollConfigs } from '@/shared';
import CalculatedFieldModal from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldModal.vue';
import VueContext from 'vue-context';
import DataListing from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/DataListing.vue';
import { Column, ExpressionField, Field, FieldType, TabControlData } from '@core/common/domain/model';
import { PopupUtils } from '@/utils/PopupUtils';
import { DIException } from '@core/common/domain/exception';
import { Log } from '@core/utils';
import { DeleteFieldData } from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldData';
import { Modals } from '@/utils/Modals';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import Vuescroll from 'vuescroll';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import UpdateTableByQueryModal from '@/screens/chart-builder/config-builder/database-listing/UpdateTableByQueryModal.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import Swal from 'sweetalert2';
import { WidgetModule } from '@/screens/dashboard-detail/stores';
import SearchInput from '@/shared/components/SearchInput.vue';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';

enum DataManagementAction {
  AddCalculatedField = 'add_calculated_field',
  UpdateTableByQuery = 'update_table_by_query',
  EditCalculatedField = 'edit_calculated_field',
  DeleteCalculatedField = 'delete_calculated_field',
  AddMeasurementField = 'add_measurement_field',
  EditMeasurementField = 'edit_measurement_field',
  DeleteMeasurementField = 'delete_measurement_field',
  DeleteTable = 'delete_table'
}

export enum DatabaseListingAs {
  Edit = 'edit',
  Normal = 'normal'
}

export enum DatabaseListingMode {
  Editing = 'editing',
  // can emit click field & table
  Query = 'query',
  None = 'none'
}

export enum DisplayListing {
  Database = 'database',
  TabControl = 'TabControl'
}

@Component({
  components: {
    SlVueTree,
    CalculatedFieldModal,
    VueContext,
    DataListing,
    EmptyDirectory,
    StatusWidget,
    UpdateTableByQueryModal,
    DiSearchInput
  }
})
export default class DatabaseListing extends Vue {
  $alert!: typeof Swal;
  private readonly DatabaseEditionMode = DatabaseListingMode;
  private readonly DisplayListings = DisplayListing;
  @Prop({ default: DatabaseListingAs.Normal })
  databaseListingAs!: DatabaseListingAs;

  @Prop({ default: false, required: false, type: Boolean })
  showSelectTabControl!: boolean;

  @Prop({ default: false, required: false, type: Boolean })
  hideTableAction!: boolean;

  private options = VerticalScrollConfigs;
  private enableSearch = false;
  private keyword = '';
  private displayListing = DisplayListing.Database;
  @Ref()
  private readonly tableMenu?: VueContext;

  @Ref()
  private readonly columnMenu?: VueContext;
  @Ref()
  private readonly expressionColumnMenu?: VueContext;

  @Ref()
  private readonly searchInput?: HTMLInputElement;

  @Ref()
  private readonly calculatedFieldModal?: CalculatedFieldModal;

  @Ref()
  private readonly updateTableByQueryModal!: UpdateTableByQueryModal;

  @Ref()
  private readonly treeNodeScroller?: Vuescroll;

  @Prop({ type: Boolean, default: true })
  private readonly showSelectDatabase!: boolean;

  // @Prop({ type: Boolean, default: true })
  // private readonly showAction!: boolean;

  @Prop({ type: String, required: false, default: DatabaseListingMode.Editing })
  private readonly mode!: string;

  @Prop({ required: false, default: Status.Loaded })
  status!: Status;

  @Prop({ required: false, default: 'Load fail' })
  error!: string;

  @Prop({ required: false, default: false })
  private readonly hideRetry!: boolean;

  get databaseInfos(): any[] {
    return DatabaseSchemaModule.databaseInfos || [];
  }

  get isLoading() {
    return this.status == Status.Loading;
  }

  get isError() {
    return this.status == Status.Error;
  }

  get isLoaded() {
    return this.status == Status.Loaded;
  }

  get isEmptyTableSchema() {
    return this.displayListing === DisplayListing.Database ? this.tableSchemas.length <= 0 : this.tabControls.length <= 0;
  }

  private get isActiveSearch() {
    return StringUtils.isNotEmpty(this.keyword);
  }

  get isShowClearSearchButton(): boolean {
    return StringUtils.isNotEmpty(this.keyword);
  }

  private submitKeywordChanged(keyword: string) {
    this.keyword = keyword;
  }

  private get tableSchemas(): SlTreeNodeModel<TableSchema>[] {
    if ((this.enableSearch || !this.showSelectDatabase) && StringUtils.isNotEmpty(this.keyword)) {
      return _BuilderTableSchemaStore.searchTablesAndColumns(this.keyword);
    } else {
      return _BuilderTableSchemaStore.tableSchemas;
    }
  }

  private get tabControls(): SlTreeNodeModel<TabControlData>[] {
    if (this.enableSearch && StringUtils.isNotEmpty(this.keyword)) {
      return _BuilderTableSchemaStore.searchTabControls(this.keyword);
    } else {
      return _BuilderTableSchemaStore.tabControls;
    }
  }

  private get haveDatabase() {
    return ListUtils.isNotEmpty(DatabaseSchemaModule.databaseInfos);
  }

  private finalTableActions(tableSchema: TableSchema): LabelNode[] {
    return ListUtils.remove(this.tableActions(tableSchema), item => item?.isHidden === true);
  }

  private tableActions(tableSchema: TableSchema): LabelNode[] {
    switch (this.databaseListingAs) {
      case DatabaseListingAs.Normal:
        return [
          { label: 'Add Calculated Field', type: DataManagementAction.AddCalculatedField.toString() },
          { label: 'Add Measure', type: DataManagementAction.AddMeasurementField.toString() },
          { label: 'Update Table By Query', type: DataManagementAction.UpdateTableByQuery.toString(), isHidden: !this.isViewTable(tableSchema) }
        ];
      case DatabaseListingAs.Edit:
        return [
          { label: 'Add Calculated Field', type: DataManagementAction.AddCalculatedField.toString() },
          { label: 'Add Measure', type: DataManagementAction.AddMeasurementField.toString() },
          { label: 'Update Table By Query', type: DataManagementAction.UpdateTableByQuery.toString(), isHidden: !this.isViewTable(tableSchema) },
          { label: 'Delete', type: DataManagementAction.DeleteTable }
        ];
      default:
        return [];
    }
  }

  private isViewTable(tableSchema: TableSchema) {
    return tableSchema.tableType === TableType.View && StringUtils.isNotEmpty(tableSchema.dbName);
  }

  private get fieldOptions(): LabelNode[] {
    return [
      {
        label: 'Edit Column',
        type: DataManagementAction.EditCalculatedField.toString()
      },
      {
        label: 'Delete Column',
        type: DataManagementAction.DeleteCalculatedField.toString()
      }
    ];
  }

  private get expressionFieldOptions(): LabelNode[] {
    return [
      {
        label: 'Edit Measure',
        type: DataManagementAction.EditMeasurementField.toString()
      },
      {
        label: 'Delete Measure',
        type: DataManagementAction.DeleteMeasurementField.toString()
      }
    ];
  }

  private get databaseSelected(): string {
    return _BuilderTableSchemaStore.dbNameSelected ?? '';
  }

  private set databaseSelected(dbName: string) {
    this.handleSetDatabaseSelected(dbName);
  }

  private async handleSetDatabaseSelected(dbName: string) {
    this.$emit('updateStatus', Status.Loading);
    if (StringUtils.isNotEmpty(dbName) && dbName != this.databaseSelected) {
      this.displayListing = this.DisplayListings.Database;
      await _BuilderTableSchemaStore.selectDatabase(dbName);
    }
    this.$emit('updateStatus', Status.Loaded);
  }

  handleUnFocus() {
    if (StringUtils.isEmpty(this.keyword)) {
      this.enableSearch = false;
    }
  }

  private handleDragStart() {
    PopupUtils.hideAllPopup();
    this.setIsDragging(true);
  }

  private handleDragEnd() {
    this.setIsDragging(false);
  }

  @Emit('update:isDragging')
  private setIsDragging(isDragging: boolean): boolean {
    return isDragging;
  }

  private showCreateCalculatedFieldModal(tableSchema: TableSchema): void {
    this.calculatedFieldModal?.showCreateModal(tableSchema);
  }

  private showCreateMeasurementFieldModal(tableSchema: TableSchema): void {
    this.calculatedFieldModal?.showCreateModal(tableSchema, false);
  }

  private showUpdateTableByQuery(tableSchema: TableSchema): void {
    this.updateTableByQueryModal.show(tableSchema);
  }

  private showMoreOption(node: any, event: Event) {
    const tableSchema: TableSchema | undefined = node.parent.tag as TableSchema;
    event.stopPropagation();
    // workaround: use event.stopPropagation(), because other popup will not close.
    PopupUtils.hideAllPopup();
    TimeoutUtils.waitAndExec(
      null,
      () => {
        this.tableMenu?.open(event, { tableSchema: tableSchema });
      },
      80
    );
  }

  private handleConfigTable(tableSchema: TableSchema, node: LabelNode) {
    const selectedAction: string | undefined = node.type as any;
    switch (selectedAction) {
      case DataManagementAction.AddCalculatedField:
        this.showCreateCalculatedFieldModal(tableSchema);
        this.tableMenu?.close();
        break;
      case DataManagementAction.AddMeasurementField:
        this.showCreateMeasurementFieldModal(tableSchema);
        this.tableMenu?.close();
        break;
      case DataManagementAction.DeleteTable:
        //drop table
        this.tableMenu?.close();
        // this.handleDropTable(tableSchema);
        Modals.showConfirmationModal(`Are you sure to delete table '${tableSchema.displayName}'?`, {
          onOk: () => this.handleDropTable(tableSchema),
          onCancel: () => {
            Log.debug('onCancel');
          }
        });
        break;
      case DataManagementAction.UpdateTableByQuery: {
        Log.debug('Update::schema::', tableSchema);
        this.showUpdateTableByQuery(tableSchema);
        this.tableMenu?.close();
        break;
      }
    }
  }

  private toggleSearch() {
    this.enableSearch = !this.enableSearch;
  }

  private handleClearSearchInput() {
    this.keyword = '';
    this.searchInput?.focus();
  }

  private handleRightClickNode(node: SlTreeNode<TableSchema>, event: MouseEvent) {
    if (this.mode === DatabaseListingMode.Editing) {
      const field: Field | undefined = node.tag as Field;
      const tableSchema: TableSchema | undefined = node.data as TableSchema;
      let canShowMenu = false;
      let column: Column | undefined = void 0;
      const isExpressionColumn: boolean = field?.className === FieldType.ExpressionField;
      const isCalculatedColumn: boolean = field?.className === FieldType.CalculatedField;
      if (isExpressionColumn) {
        column = tableSchema?.expressionColumns.find(column => column.name === field.fieldName);
        canShowMenu = (node.isLeaf && field && tableSchema && column && column.isMaterialized()) ?? false;
      } else if (isCalculatedColumn) {
        column = tableSchema?.calculatedColumns.find(column => column.name === field.fieldName);
        canShowMenu = (node.isLeaf && field && tableSchema && column && column.isMaterialized()) ?? false;
      } else {
        canShowMenu = false;
      }
      if (canShowMenu) {
        event.preventDefault();
        if (isExpressionColumn) {
          this.expressionColumnMenu?.open(event, { column: column!, tableSchema: tableSchema, field: Field });
        } else {
          this.columnMenu?.open(event, { column: column!, tableSchema: tableSchema, field: Field });
        }
      }
    }
  }

  private handleConfigColumn(tableSchema: TableSchema, column: Column, node: LabelNode) {
    const selectedAction: DataManagementAction | undefined = node.type as any;

    switch (selectedAction) {
      case DataManagementAction.DeleteCalculatedField:
        this.showConfirmDeleteCalculatedField(tableSchema, column);
        break;
      case DataManagementAction.EditCalculatedField:
        this.editCalculatedField(tableSchema, column);
        break;
      case DataManagementAction.DeleteMeasurementField:
        this.showConfirmDeleteMeasureField(tableSchema, column);
        break;
      case DataManagementAction.EditMeasurementField:
        this.editMeasurementField(tableSchema, column);
        break;
    }

    this.columnMenu?.close();
    this.expressionColumnMenu?.close();
  }

  private async deleteCalculatedField(tableSchema: TableSchema, column: Column): Promise<void> {
    try {
      const deletingFieldData: DeleteFieldData = {
        dbName: tableSchema.dbName,
        tblName: tableSchema.name,
        fieldName: column.name
      };
      await DatabaseSchemaModule.deleteCalculatedField(deletingFieldData);
      await DatabaseSchemaModule.reload(deletingFieldData.dbName);
      await _BuilderTableSchemaStore.selectDatabase(deletingFieldData.dbName);
      _BuilderTableSchemaStore.collapseAllTable();
      _BuilderTableSchemaStore.expandTables([tableSchema.name]);
    } catch (ex) {
      PopupUtils.showError(`Can not delete column ${column.displayName}`);

      const exception = DIException.fromObject(ex);
      Log.error('deleteCalculatedField::exception', exception);
    }
  }

  private showConfirmDeleteMeasureField(tableSchema: TableSchema, column: Column) {
    Modals.showConfirmationModal(`Are you sure you want to delete measure field "${column.name}"?`, {
      onOk: () => this.deleteMeasurementField(tableSchema, column)
    });
  }

  private showConfirmDeleteCalculatedField(tableSchema: TableSchema, column: Column) {
    Modals.showConfirmationModal(`Are you sure you want to delete calculated field "${column.name}"?`, {
      onOk: () => this.deleteCalculatedField(tableSchema, column)
    });
  }

  private async deleteMeasurementField(tableSchema: TableSchema, column: Column): Promise<void> {
    try {
      const deletingFieldData: DeleteFieldData = {
        dbName: tableSchema.dbName,
        tblName: tableSchema.name,
        fieldName: column.name
      };
      await DatabaseSchemaModule.deleteMeasurementField(deletingFieldData);
      await DatabaseSchemaModule.reload(deletingFieldData.dbName);
      await _BuilderTableSchemaStore.selectDatabase(deletingFieldData.dbName);
      _BuilderTableSchemaStore.collapseAllTable();
      _BuilderTableSchemaStore.expandTables([tableSchema.name]);
    } catch (ex) {
      PopupUtils.showError(`Can not delete column ${column.displayName}`);

      const exception = DIException.fromObject(ex);
      Log.error('deleteCalculatedField::exception', exception);
    }
  }

  private editCalculatedField(tableSchema: TableSchema, column: Column) {
    this.calculatedFieldModal?.showEditModal(tableSchema, column);
  }

  private editMeasurementField(tableSchema: TableSchema, column: Column) {
    this.calculatedFieldModal?.showEditModal(tableSchema, column, false);
  }

  private handleDropTable(tableSchema: TableSchema) {
    DatabaseSchemaModule.dropTable({ dbName: tableSchema.dbName, tblName: tableSchema.name })
      .then(isSuccess => {
        if (isSuccess) {
          DatabaseSchemaModule.selectDatabase(tableSchema.dbName);
        } else {
          PopupUtils.showError(`Can't delete ${tableSchema.displayName}`);
          return Promise.reject(new DIException(`Can't delete ${tableSchema.displayName}`));
        }
      })
      .catch(err => {
        PopupUtils.showError(err.message);
      });
  }

  private handleNodeClick(node: SlTreeNode<TableSchema>, event: Event) {
    this.$emit('nodeclick', node, event);
  }

  private handleClickField(node: SlTreeNode<TableSchema>, event: Event) {
    const field = node.tag as Field;
    Log.debug('handleClickField::', field);
    this.$emit('clickField', field);
  }

  private handleClickTable(node: SlTreeNode<TableSchema>, event: Event) {
    const tableSchema = node.data as TableSchema;
    Log.debug('handleClickTable::', tableSchema);
    this.$emit('clickTable', tableSchema);
  }

  scrollTo(tableName: string) {
    const $dbTree = window.$(this.$el);
    const $target = $dbTree.find(`[data-node=${tableName}]`);

    if ($target.length > 0) {
      Log.info($target.offset().top);
      const dbTreeScrollTop = $target.offset().top - 180;
      this.treeNodeScroller?.scrollTo({ y: dbTreeScrollTop }, 500, 'easeInQuad');
    }
  }

  private updateTable(tableSchema: TableSchema, oldColumn: Column, newColumn: Column) {
    const oldField: Field = new ExpressionField(
      tableSchema.dbName,
      tableSchema.name,
      oldColumn.name,
      oldColumn.className,
      oldColumn.defaultExpression?.expr ?? ''
    );
    const newField: Field = new ExpressionField(
      tableSchema.dbName,
      tableSchema.name,
      newColumn.name,
      newColumn.className,
      newColumn.defaultExpression?.expr ?? ''
    );
    _ConfigBuilderStore.updateField({ oldField, newField });
    _BuilderTableSchemaStore.setTableSchema(tableSchema);
    _BuilderTableSchemaStore.expandTables([tableSchema.name]);
    this.$emit('updateTable');
  }

  private async createTable(tableSchema: TableSchema) {
    await _BuilderTableSchemaStore.selectDatabase(tableSchema.dbName);
    _BuilderTableSchemaStore.collapseAllTable();
    _BuilderTableSchemaStore.expandTables([tableSchema.name]);
  }

  private setDisplayListing(display: DisplayListing) {
    if (this.displayListing !== display) {
      this.displayListing = display;
    }
  }

  @Watch('displayListing')
  onDisplayListingChanged() {
    switch (this.displayListing) {
      case DisplayListing.Database: {
        break;
      }
      case DisplayListing.TabControl: {
        const tabControls = WidgetModule.allTabControls;
        _BuilderTableSchemaStore.selectTabControl(tabControls);
        break;
      }
    }
  }

  private get searchPlaceHolder(): string {
    return this.displayListing === DisplayListing.Database ? 'Search tables & columns' : 'Search tab controls';
  }
}
