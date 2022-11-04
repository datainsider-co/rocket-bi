/* eslint-disable @typescript-eslint/camelcase */
import { Component, Mixins, Prop, Provide, Ref, Watch } from 'vue-property-decorator';
import '@/screens/data-ingestion/components/di-upload-document/assets/style.css';
// @ts-ignore
import TableItem from '@/screens/data-management/views/data-relationship/components/TableItem.vue';
import LeaderLine from 'leader-line-new';
import difference from 'lodash/difference';
import xor from 'lodash/xor';
import { Log } from '@core/utils';
import { Column, DatabaseSchema, InlineSqlView, TableField, TableSchema, ViewField } from '@core/common/domain';
import { increaseDiv } from '@/screens/data-cook/components/manage-etl-operator/Constance';
import Vuescroll from 'vuescroll';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import { LayoutNoData } from '@/shared/components/layout-wrapper';
import SplitPanelMixin from '@/shared/components/layout-wrapper/SplitPanelMixin';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import DatabaseTreeView from '@/screens/data-management/components/database-tree-view/DatabaseTreeView.vue';
import { Inject } from 'typescript-ioc';
import {
  FieldPair,
  QueryView,
  QueryViews,
  Relationship,
  RelationshipExtraData,
  RelationshipInfo,
  RelationshipService,
  TablePosition,
  TableView
} from '@core/data-relationship';
import { SchemaService } from '@core/schema/service/SchemaService';
import { Field } from '@core/common/domain/model/function/Field';
import { TimeoutUtils } from '@/utils';
import { cloneDeep, isEqual } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';
import { RelationshipHandler, RelationshipType } from '@/screens/dashboard-detail/components/relationship/relationship-handler/RelationshipHandler';
import { RelationshipMode } from '@/screens/dashboard-detail/components/relationship/enum/RelationshipMode';
import DashboardRelationshipIcon from '@/shared/components/Icon/DashboardRelationshipIcon.vue';
import { Modals } from '@/utils/Modals';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import TableSchemaItem from './TableSchemaItem';
import { PositionValue } from '@core/data-cook';
import DiagramPanel from '@/screens/data-cook/components/diagram-panel/DiagramPanel.vue';
import CurvedConnector from '@/screens/data-cook/components/diagram-panel/CurvedConnector.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Status } from '@/shared';
import Konva from 'konva';
import TableActionContextMenu from '@/screens/dashboard-detail/components/relationship/TableActionContextMenu.vue';
import ConnectionActionContextMenu from '@/screens/dashboard-detail/components/relationship/ConnectionActionContextMenu.vue';

const DROP_TYPE = 'drop_table';
const $ = window.$;
const DATA_TRANSFER_KEY = {
  Type: 'type',
  DatabaseName: 'database_name',
  TableName: 'table_name'
};

export type LLConnection = LeaderLine & {
  // $el: HTMLElement;
  fromTable: TableSchema;
  fromColumn: Column;
  toTable: TableSchema;
  toColumn: Column;
};

type DraggingConnection = {
  fromId: string;
  toId: string;
};

@Component({
  components: {
    TableItem,
    Split,
    SplitArea,
    LayoutNoData,
    DatabaseTreeView,
    DashboardRelationshipIcon,
    TableSchemaItem,
    DiagramPanel,
    CurvedConnector,
    StatusWidget,
    TableActionContextMenu,
    ConnectionActionContextMenu
  }
})
export default class RelationshipEditor extends Mixins(SplitPanelMixin) {
  private adhocDbName = 'adhoc_analysis';
  private errorMessage = '';
  private loading = false;
  private mapDatabase: Record<string, DatabaseSchema> = {};
  private highlightedTable: TableSchema | null = null;
  private oldConnections: Map<string, LLConnection> = new Map<string, LLConnection>();
  private oldTablePositions: Map<string, TablePosition> = new Map<string, TablePosition>();
  private currentConnections: Map<string, LLConnection> = new Map<string, LLConnection>();
  private deletedConnections: Map<string, LLConnection> = new Map<string, LLConnection>();
  private addedTables: TableSchema[] = [];
  private oldTables: TableSchema[] = [];
  private isPositionsChanged = false;
  private relationshipInfo: RelationshipInfo = new RelationshipInfo([], [], new RelationshipExtraData(new Map<string, TablePosition>()));
  stagePosition: PositionValue = new PositionValue(0, 0);

  private draggingConnector: DraggingConnection = { fromId: '', toId: '' };
  private relatedColumnAsMap: Map<string, Column[]> = new Map<string, Column[]>();

  @Ref('container')
  private container: HTMLElement | undefined;

  @Ref()
  vs!: Vuescroll;

  @Ref()
  relationshipEditor!: HTMLElement;

  @Ref()
  dbContainer!: HTMLElement;

  @Ref()
  private tableActionContextMenu!: TableActionContextMenu;

  @Ref()
  private diagramPanel?: DiagramPanel;

  @Ref()
  private curvedConnectors?: CurvedConnector[];

  @Ref()
  private tableSchemaItems?: TableSchemaItem[];

  @Ref()
  private pointerConnector?: CurvedConnector;

  @Ref()
  private connectionActionContextMenu?: ConnectionActionContextMenu;

  @Prop()
  private handler!: RelationshipHandler;

  @Prop({ default: RelationshipMode.View })
  private mode!: RelationshipMode;

  @Inject
  private relationshipService!: RelationshipService;

  @Inject
  private schemaService!: SchemaService;

  get canSave() {
    return !this.loading && (this.isDifferenceConnections() || !isEqual(this.oldTables, this.addedTables) || this.isPositionsChanged);
  }

  private isDifferenceConnections() {
    for (const key in this.currentConnections) {
      if (!this.oldConnections.has(key)) {
        return true;
      }
    }
    return false;
  }

  private getRelatedColumns(dbName: string, tblName: string): Column[] {
    return this.relatedColumnAsMap.get(this.tableId(dbName, tblName)) ?? [];
  }

  @Watch('canSave')
  onCanSaveChanged(canSave: boolean) {
    if (canSave && this.mode === RelationshipMode.Edit) {
      _ConfigBuilderStore.setAllowBack(false);
    } else {
      _ConfigBuilderStore.setAllowBack(true);
    }
  }

  get error() {
    return StringUtils.isNotEmpty(this.errorMessage);
  }

  private get status() {
    return this.loading ? Status.Loading : Status.Loaded;
  }

  private get isDashboardRelationship() {
    return this.handler.className === RelationshipType.Dashboard;
  }

  @Provide('tableId')
  private tableId(dbName: string, tblName: string) {
    return StringUtils.toSnakeCase([dbName, tblName].join('_'));
  }

  @Provide('columnId')
  private columnId(dbName: string, tblName: string, colName: string) {
    return StringUtils.toSnakeCase([this.tableId(dbName, tblName), colName].join('_'));
  }

  private getTablePosition(dbName: string, tblName: string, tableIndex: number) {
    return this.relationshipInfo.extraData.tablePositions.get(this.getTablePositionKey(dbName, tblName)) ?? this.defaultTablePosition(tableIndex);
  }

  private defaultTablePosition(tableIndex: number) {
    return new TablePosition(tableIndex * 200, 0);
  }

  private get isEditMode() {
    return this.mode === RelationshipMode.Edit;
  }

  async mounted() {
    await this.initData();
    await this.wait(500);
    Log.debug('RelationshipEditor::mounted::connector::', this.curvedConnectors);

    this.diagramPanel?.autoResize();
  }

  private async initData() {
    try {
      this.loading = true;
      this.relationshipInfo = await this.handler.getRelationshipInfo();
      this.oldTablePositions = cloneDeep(this.relationshipInfo.extraData.tablePositions);
      await this.renderTableItems(this.relationshipInfo.views, this.relationshipInfo.extraData.tablePositions);
      await this.renderConnections(this.relationshipInfo.relationships);
      this.oldTables = cloneDeep(this.addedTables);
      this.errorMessage = '';
    } catch (e) {
      Log.error('RelationshipEditor::initData::error::', e.message);
      this.errorMessage = e.message;
    } finally {
      this.loading = false;
    }
  }

  private async getDatabaseSchema(dbName: string): Promise<DatabaseSchema> {
    let databaseSchema = DatabaseSchemaModule.databaseSchemas.find(db => db.name === dbName);
    if (!databaseSchema) {
      databaseSchema = await DatabaseSchemaModule.selectDatabase(dbName);
    }
    return databaseSchema;
  }

  private getQueryViewDbName(queryView: QueryView) {
    switch (queryView.className) {
      case QueryViews.Table:
        return (queryView as TableView).dbName;
      case QueryViews.SQL:
        return this.adhocDbName;
    }
  }

  private async getDatabaseSchemas(views: QueryView[]): Promise<Record<string, DatabaseSchema>> {
    const mapDatabaseSchema: Record<string, DatabaseSchema> = {};
    for (const view of views) {
      if (!mapDatabaseSchema[this.getQueryViewDbName(view)]) {
        mapDatabaseSchema[this.getQueryViewDbName(view)] = await this.getDatabaseSchemaFromQueryView(view);
      } else {
        if (!QueryView.isTableView(view)) {
          const databaseSchema = await this.getDatabaseSchemaFromQueryView(view);
          mapDatabaseSchema[databaseSchema.name].tables = mapDatabaseSchema[databaseSchema.name].tables.concat(databaseSchema.tables);
        }
      }
    }
    return mapDatabaseSchema;
  }

  private getLocalTableSchemaFromQueryView(queryView: QueryView): TableSchema | undefined {
    try {
      let dbName = '';
      let tblName = '';
      if (QueryView.isTableView(queryView)) {
        dbName = (queryView as TableView).dbName;
        tblName = (queryView as TableView).tblName;
      } else {
        dbName = this.adhocDbName;
        tblName = queryView.aliasName;
      }
      if (this.mapDatabase[dbName]) {
        return this.mapDatabase[dbName].tables.find(tb => tb.name === tblName);
      } else {
        return undefined;
      }
    } catch (e) {
      Log.error('RelationshipEditor::error::', e.message);
      return undefined;
    }
  }

  private async getDatabaseSchemaFromQueryView(queryView: QueryView): Promise<DatabaseSchema> {
    try {
      if (QueryView.isTableView(queryView)) {
        return await this.getDatabaseSchema((queryView as TableView).dbName);
      } else {
        const tableSchema = await this.getViewTableSchema(queryView as InlineSqlView);
        return new DatabaseSchema(this.adhocDbName, -1, '', [tableSchema]);
      }
    } catch (e) {
      Log.error('RelationshipEditor::getDatabaseSchemaFromQueryView::error::', e.message);
      return new DatabaseSchema('', -1, '', []);
    }
  }

  private getColumn(colName: string, tableSchema: TableSchema) {
    return tableSchema.columns.find(col => col.name === colName);
  }

  private getTableSchema(dbName: string, tblName: string): Promise<TableSchema> {
    const database: DatabaseSchema | undefined = DatabaseSchemaModule.databaseSchemas.find(db => db.name === dbName);
    let tableSchema = null;
    if (database && tblName) {
      tableSchema = (database.tables as TableSchema[]).find(t => t.name === tblName);
    }
    if (tableSchema) {
      return Promise.resolve(tableSchema);
    } else {
      return this.schemaService.getTable(dbName, tblName);
    }
  }

  private async getViewTableSchema(sqlView: InlineSqlView) {
    const tableSchema = await this.schemaService.detectTableSchema(sqlView.query.query);
    tableSchema.dbName = this.adhocDbName;
    tableSchema.name = sqlView.aliasName;
    return tableSchema;
  }

  private highlightTable(table: TableSchema) {
    this.highlightedTable = table;
    setTimeout(() => {
      this.highlightedTable = null;
    }, 2000);
  }

  @Provide('findSchema')
  private findSchema(dbName: string, tableName: string, columnName?: string) {
    const database = this.mapDatabase[dbName];
    let table = null;
    let column = null;
    if (database && tableName) {
      table = database.tables.find(t => t.name === tableName);
    }
    if (table && columnName) {
      column = table.columns.find(c => c.name === columnName);
    }
    return {
      database,
      table,
      column
    };
  }

  private async onDrop(e: DragEvent) {
    if (this.errorMessage) {
      return;
    }
    if (!this.findSchema) return;
    // (e.target as HTMLElement).classList.remove('active');
    const type = e.dataTransfer?.getData(DATA_TRANSFER_KEY.Type);
    if (type !== DROP_TYPE) return;
    const databaseName = e.dataTransfer?.getData(DATA_TRANSFER_KEY.DatabaseName) ?? '';
    const tableName = e.dataTransfer?.getData(DATA_TRANSFER_KEY.TableName) ?? '';

    Log.debug('onDrop1', type, databaseName, tableName);

    const databaseSchema = await this.getDatabaseSchema(databaseName);
    const targetTable = await this.getTableSchema(databaseName, tableName);

    Log.debug('onDrop2', targetTable);
    if (databaseSchema && targetTable) {
      const position: TablePosition = { left: e.offsetX - 40, top: e.offsetY };
      await this.addTable(databaseSchema, targetTable, position);
    } else {
      Log.debug('Not found target table', databaseName, tableName);
    }
  }

  private isAddedTable(table: TableSchema): boolean {
    Log.debug('isAddTable::', table);
    return this.addedTables.findIndex(tbl => table.name === tbl.name && table.dbName === tbl.dbName) >= 0;
  }

  private handlePositionChanged(table: TableSchema, pos: TablePosition) {
    // this.relationshipInfo.extraData.tablePositions.set(this.tableId(table.dbName, table.name), pos);
    this.isPositionsChanged = true;
  }

  @Track(TrackEvents.RelationshipAddTable, {
    table_name: (_: RelationshipEditor, args: any) => args[1].name,
    database_name: (_: RelationshipEditor, args: any) => args[1].dbName
  })
  private async addTable(database: DatabaseSchema, table: TableSchema, position: TablePosition) {
    if (database?.name && !this.mapDatabase[database.name as string]) {
      this.mapDatabase[database.name] = database;
    }
    if (table && StringUtils.isNotEmpty(table.name) && StringUtils.isNotEmpty(table.dbName) && !this.isAddedTable(table)) {
      this.relationshipInfo.extraData.tablePositions.set(this.getTablePositionKey(table.dbName, table.name), position);
      this.addedTables.push(table);
    } else {
      this.highlightTable(table);
    }
  }

  private removeTable(table: TableSchema) {
    this.curvedConnectors?.forEach(conn => {
      if (conn.toId.includes(this.tableId(table.dbName, table.name)) || conn.fromId.includes(this.tableId(table.dbName, table.name))) {
        conn.removeConnector();
      }
    });
    this.removeTableConnection(table);
    // removeConnections.forEach(c => this.removeConnection(c));

    this.addedTables = this.addedTables.filter(i => i !== table);
  }

  private removeTableConnection(table: TableSchema) {
    const clonedConnections = cloneDeep(this.currentConnections);
    clonedConnections.forEach((value, key, map) => {
      if (key.includes(this.tableId(table.dbName, table.name))) {
        this.currentConnections.delete(key);
        this.updateDeletedConnection(value);
      }
    });
    this.currentConnections = cloneDeep(this.currentConnections);
  }

  showDiscardChangesConfirmationModal() {
    Modals.showConfirmationModal('Are you sure you want to discard the changes you made', { onOk: () => this.discardChanges() });
  }

  wait(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  private getNewedConnections(): LLConnection[] {
    const result: LLConnection[] = [];
    for (const key in this.currentConnections) {
      if (!this.oldConnections.has(key)) {
        result.push(this.currentConnections.get(key)!);
      }
    }
    return result;
  }

  private getRemovedConnection() {
    return [...this.deletedConnections.values()];
  }

  private async discardChanges() {
    this.addedTables = cloneDeep(this.oldTables);
    this.getNewedConnections().forEach(connection => {
      this.removeConnection(connection);
    });
    this.getRemovedConnection().forEach(connection => {
      this.renewConnection(connection);
    });
    if (this.isPositionsChanged) {
      this.tableSchemaItems?.forEach(tbl => {
        Log.debug('discardChanges::tblSchemaItem::', tbl);
        const tablePos = this.oldTablePositions.get(this.getTablePositionKey(tbl.tableSchema.dbName, tbl.tableSchema.name))!;
        tbl.onPositionChanged(tablePos);
      });
    }
    this.relationshipInfo.extraData.tablePositions = cloneDeep(this.oldTablePositions);
    this.currentConnections = cloneDeep(this.oldConnections);
    this.deletedConnections.clear();
    this.isPositionsChanged = false;
    this.diagramPanel?.autoResize();
    this.errorMessage = '';
  }

  private renewConnection(connection: LLConnection) {
    const fromColumnId = this.columnId(connection.fromTable.dbName, connection.fromTable.name, connection.fromColumn.name);
    const toColumnId = this.columnId(connection.toTable.dbName, connection.toTable.name, connection.toColumn.name);
    const foundConnection = this.curvedConnectors?.find(
      conn => (conn.fromId === fromColumnId && conn.toId === toColumnId) || (conn.fromId === toColumnId && conn.toId === fromColumnId)
    );
    foundConnection?.redraw();
  }

  @Track(TrackEvents.RelationshipSave)
  private async save() {
    try {
      this.loading = true;
      const relationships: Relationship[] = this.getRelationships([...this.currentConnections.values()]);
      Log.debug('handleSave::relationships', relationships, 'views::', this.relationshipInfo.views);
      const views: QueryView[] =
        this.handler.className === RelationshipType.Global ? this.addedTables.map(tb => new TableView(tb.dbName, tb.name, '')) : this.relationshipInfo.views;
      //todo:remove position from removed table

      await this.handler.saveRelationshipInfo(new RelationshipInfo(views, relationships, this.relationshipInfo.extraData));
      this.isPositionsChanged = false;
      this.oldConnections = cloneDeep(this.currentConnections);
      this.oldTables = cloneDeep(this.addedTables);
      this.oldTablePositions = this.relationshipInfo.extraData.tablePositions;
      this.errorMessage = '';
      this.$emit('saved');
      this.diagramPanel?.autoResize();
    } catch (e) {
      this.errorMessage = e.message;
      Log.error('RelationshipEditor::save::error', e.message);
    } finally {
      this.loading = false;
    }
  }

  private getRelationships(connections: LLConnection[]) {
    const relationships: Relationship[] = [];
    connections.map((connect, index) => {
      const firstView = this.getQueryView(connect.fromTable);
      const secondView = this.getQueryView(connect.toTable);
      const rel = relationships.find(
        relationship =>
          (isEqual(relationship.firstView, firstView) && isEqual(relationship.secondView, secondView)) ||
          (isEqual(relationship.firstView, secondView) && isEqual(relationship.secondView, firstView))
      );
      let firstField = this.getField(connect.fromColumn, firstView);
      let secondField = this.getField(connect.toColumn, secondView);
      if (rel) {
        if (isEqual(rel.firstView, secondView) && isEqual(rel.secondView, firstView)) {
          firstField = this.getField(connect.toColumn, secondView);
          secondField = this.getField(connect.fromColumn, firstView);
        }
        rel.fieldPairs.push(new FieldPair(firstField, secondField));
      } else {
        relationships.push(new Relationship(firstView, secondView, [new FieldPair(firstField, secondField)]));
      }
      Log.debug('connection----', index);
      Log.debug('fromFieldQuery::', firstField, firstView);
      Log.debug('toFieldQuery::', secondField, secondView);
    });
    return relationships;
  }

  getField(colum: Column, view: QueryView): Field {
    if (QueryView.isTableView(view)) {
      return new TableField((view as TableView).dbName, (view as TableView).tblName, colum.name, colum.className);
    } else {
      return new ViewField('', view.aliasName, colum.name, colum.className);
    }
  }

  private getQueryView(tableSchema: TableSchema): QueryView {
    let queryView = this.relationshipInfo.views.find(view => {
      if (QueryView.isTableView(view)) {
        return (view as TableView).dbName === tableSchema.dbName && (view as TableView).tblName === tableSchema.name;
      } else {
        return (view as InlineSqlView).query.query === (tableSchema?.query ?? '');
      }
    });
    if (!queryView) queryView = new TableView(tableSchema.dbName, tableSchema.name, '');
    return queryView;
  }

  private async renderTableItems(views: QueryView[], tablePositions: Map<string, TablePosition>) {
    this.mapDatabase = await this.getDatabaseSchemas(views);
    for (let iter = 0; iter < views.length; iter++) {
      const tableSchema = this.getLocalTableSchemaFromQueryView(views[iter] as InlineSqlView) ?? TableSchema.empty();
      if (QueryView.isTableView(views[iter])) {
        const tableView = views[iter] as TableView;
        await this.addTable(
          this.mapDatabase[tableView.dbName],
          tableSchema,
          tablePositions.get(this.getTablePositionKey(tableView.dbName, tableView.tblName)) ?? this.defaultTablePosition(iter)
        );
      } else {
        await this.addTable(
          this.mapDatabase[this.adhocDbName],
          tableSchema,
          tablePositions.get(this.getTablePositionKey(this.adhocDbName, tableSchema.name)) ?? this.defaultTablePosition(iter)
        );
      }
    }
  }

  private getTablePositionKey(dbName: string, tblName: string): string {
    return StringUtils.toCamelCase(dbName + tblName);
  }

  private async renderConnections(relationships: Relationship[]) {
    try {
      for (const rel of relationships) {
        const fromTableSchema: TableSchema = this.getLocalTableSchemaFromQueryView(rel.firstView) ?? TableSchema.empty();
        const toTableSchema: TableSchema = (await this.getLocalTableSchemaFromQueryView(rel.secondView)) ?? TableSchema.empty();
        Log.debug('rel::', fromTableSchema, toTableSchema);

        if (fromTableSchema && toTableSchema) {
          rel.fieldPairs.map(fieldPair => {
            const fromColumn = this.getColumn(fieldPair.firstField.fieldName, fromTableSchema) ?? Column.default();
            const toColumn = this.getColumn(fieldPair.secondField.fieldName, toTableSchema) ?? Column.default();
            const connection = { fromTable: fromTableSchema, toTable: toTableSchema, fromColumn, toColumn } as LLConnection;
            this.addConnection(connection);
            this.oldConnections.set(this.connectionKey(connection), connection);

            Log.debug('connection::', this.currentConnections);
            // }
          });
        }
      }
    } catch (e) {
      Log.debug('innitConnectionError::', e.message);
    }
  }

  private connectionKey(connection: LLConnection): string {
    const fromColumnId = this.columnId(connection.fromTable.dbName, connection.fromTable.name, connection.fromColumn.name);
    const toColumnId = this.columnId(connection.toTable.dbName, connection.toTable.name, connection.toColumn.name);
    return this.connectionKeyFromId(fromColumnId, toColumnId);
  }

  private connectionKeyFromId(fromId: string, toId: string) {
    return [fromId, toId].sort().join('_');
  }

  private isValidConnection(connection: LLConnection) {
    return !(connection.fromTable.dbName === connection.toTable.dbName && connection.fromTable.name === connection.toTable.name);
  }

  private findConnector(connection: LLConnection, listConnector: CurvedConnector[]): CurvedConnector | undefined {
    const fromColumnId = this.columnId(connection.fromTable.dbName, connection.fromTable.name, connection.fromColumn.name);
    const toColumnId = this.columnId(connection.toTable.dbName, connection.toTable.name, connection.toColumn.name);
    const foundConnector = listConnector.find(conn => conn.fromId === fromColumnId && conn.toId === toColumnId);
    return foundConnector;
  }

  private existConnection(connection: LLConnection): boolean {
    return !!this.currentConnections.get(this.connectionKey(connection));
  }

  private addConnection(connection: LLConnection) {
    if (this.isValidConnection(connection) && !this.existConnection(connection) && this.isEditMode) {
      this.currentConnections.set(this.connectionKey(connection), connection);
      this.currentConnections = cloneDeep(this.currentConnections);
      this.updateRelatedColumnMap(connection.fromTable, connection.fromColumn);
      this.updateRelatedColumnMap(connection.toTable, connection.toColumn);
    }
  }

  private updateRelatedColumnMap(table: TableSchema, column: Column) {
    const tableId = this.tableId(table.dbName, table.name);
    if (this.relatedColumnAsMap.has(tableId)) {
      const columns: Column[] = this.relatedColumnAsMap.get(tableId)!;
      columns.push(column);
      this.relatedColumnAsMap.set(tableId, columns);
    } else {
      this.relatedColumnAsMap.set(tableId, [column]);
    }
  }

  private handleCreateConnector(conn: LLConnection) {
    Log.debug('Relationship::handleCreateConnector::conn::', conn);

    this.addConnection(conn);
  }

  private async handleDraggingColumn(table?: any, column?: any) {
    if (table && column) {
      const tbl = TableSchema.fromObject(table);
      const col = Column.fromObject(column);

      Log.debug('handleDraggingColumn::');
      this.draggingConnector = {
        fromId: this.columnId(tbl.dbName, tbl.name, col!.name),
        toId: this.columnId(tbl.dbName, tbl.name, col!.name)
      } as DraggingConnection;
      this.pointerConnector?.updatePosition(true);
    }
  }

  private async endDraggingColumn() {
    Log.debug('Relationship::endDraggingColumn::removeConnector');
    this.draggingConnector = { fromId: '', toId: '' };
    await TimeoutUtils.sleep(100);
    this.pointerConnector?.updatePosition(true);
  }

  private getDiagramPanelMousePosition(e: MouseEvent) {
    if (this.diagramPanel) {
      const containerRect = this.diagramPanel.getBoundingClientRect();
      const pointerPosition = this.diagramPanel.getPointerPosition();
      if (containerRect && pointerPosition) {
        const top = containerRect.top + (pointerPosition?.y ?? 0);
        const left = containerRect.left + (pointerPosition?.x ?? 0);
        return { top, left };
      }
    }
    return { top: 0, left: 0 };
  }

  private handleShowTableActionMenu(table: TableSchema, isExpanded: boolean, e: MouseEvent) {
    Log.debug('RelationshipEditor::handleShowActionMenu::');
    const pos = this.getDiagramPanelMousePosition(e);
    this.tableActionContextMenu.showPopover(table, isExpanded, this.isEditMode && !this.isDashboardRelationship, pos.top, pos.left);
  }

  private handleShowConnectionActionMenu(fromId: string, toId: string, e: MouseEvent) {
    Log.debug('RelationshipEditor::handleShowActionMenu::');
    const pos = this.getDiagramPanelMousePosition(e);
    this.connectionActionContextMenu?.showPopover(fromId, toId, pos.top, pos.left);
  }

  private hideTable(table: TableSchema) {
    Log.debug('RelationshipEditor::hideTable::tableSchemaItems::', this.tableSchemaItems);
    const foundTableSchemaItem: TableSchemaItem | undefined = this.tableSchemaItems?.find(
      tbl => tbl.tableSchema.dbName === table.dbName && tbl.tableSchema.name === table.name
    );
    foundTableSchemaItem?.hideTable();
  }

  private expandTable(table: TableSchema) {
    Log.debug('RelationshipEditor::expandTable::tableSchemaItems::', this.tableSchemaItems);
    const foundTableSchemaItem: TableSchemaItem | undefined = this.tableSchemaItems?.find(
      tbl => tbl.tableSchema.dbName === table.dbName && tbl.tableSchema.name === table.name
    );
    foundTableSchemaItem?.expand();
  }

  private handleRemoveConnection(fromId: string, toId: string) {
    const foundConnector = this.curvedConnectors?.find(conn => conn.fromId === fromId && conn.toId === toId);
    foundConnector?.removeConnector();
    if (this.currentConnections.has(this.connectionKeyFromId(fromId, toId))) {
      this.updateDeletedConnection(this.currentConnections.get(this.connectionKeyFromId(fromId, toId))!);
      this.currentConnections.delete(this.connectionKeyFromId(fromId, toId));
      this.currentConnections = cloneDeep(this.currentConnections);
    }
  }

  @Track(TrackEvents.RelationshipRemoveRelation, {
    from_table_name: (_: RelationshipEditor, args: any) => args[0].fromTable.name,
    from_database_name: (_: RelationshipEditor, args: any) => args[0].fromTable.dbName,
    from_column_name: (_: RelationshipEditor, args: any) => args[0].fromColumn.name,
    to_table_name: (_: RelationshipEditor, args: any) => args[0].toTable.name,
    to_database_name: (_: RelationshipEditor, args: any) => args[0].toTable.dbName,
    to_column_name: (_: RelationshipEditor, args: any) => args[0].toColumn.name
  })
  private removeConnection(connection: LLConnection) {
    const foundConnector = this.findConnector(connection, this.curvedConnectors ?? []);
    this.currentConnections.delete(this.connectionKey(connection));
    this.currentConnections = cloneDeep(this.currentConnections);
    foundConnector?.removeConnector();
  }

  private updateDeletedConnection(connection: LLConnection) {
    const connectionKey = this.connectionKey(connection);
    if (this.oldConnections.has(connectionKey)) {
      this.deletedConnections.set(connectionKey, connection);
    }
  }
}
