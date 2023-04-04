/*
 * @author: tvc12 - Thien Vi
 * @created: 12/4/20, 6:05 PM
 */

import { Column, ColumnType, DatabaseInfo, DatabaseSchema, Expression, TableSchema, UserProfile } from '@core/common/domain/model';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared/enums/Stores';
import { ListUtils, SchemaUtils } from '@/utils';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { CreateColumnRequest } from '@core/schema/domain/CreateColumnRequest';
import { DIException, FormulaException } from '@core/common/domain/exception';
import { DetectExpressionTypeRequest } from '@core/schema/domain/DetectExpressionTypeRequest';
import { IdGenerator } from '@/utils/IdGenerator';
import { StringUtils } from '@/utils/StringUtils';
import { CreateFieldData, DeleteFieldData, EditFieldData } from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldData';
import { Log } from '@core/utils';
import { UpdateColumnRequest } from '@core/schema/domain/UpdateColumnRequest';
import { DeleteColumnRequest } from '@core/schema/domain/DeleteColumnRequest';
import { FullSchemaInfo, ShortSchemaInfo } from '@core/data-warehouse/ShortSchemaInfo';
import { ListingResponse } from '@core/data-ingestion';
import { DataManager } from '@core/common/services';
import { Di } from '@core/common/modules';
import { cloneDeep } from 'lodash';

const getCreateColumnRequest = (fieldData: CreateFieldData, expressionType: ColumnType) => {
  const { tableSchema, expression, displayName, description } = fieldData;
  const columnName: string = IdGenerator.generateName(displayName);
  const column: Column | undefined = Column.fromObject({
    name: columnName,
    displayName: displayName,
    defaultExpression: expression,
    description: description,
    isNullable: true,
    className: expressionType
  });
  if (column) {
    return new CreateColumnRequest(tableSchema.dbName, tableSchema.name, column);
  } else {
    throw new DIException('Cannot create calculated field');
  }
};

@Module({ store: store, name: Stores.databaseSchemaStore, dynamic: true, namespaced: true })
class DatabaseSchemaStore extends VuexModule {
  // state
  databaseInfos: DatabaseInfo[] = [];
  dbNameSelected = '';
  databaseSchemas: DatabaseSchema[] = [];
  dbOwnerAsMap: Map<string, UserProfile> = new Map();
  dataManager = Di.get(DataManager);

  //database listing data warehouse
  listDatabase: ShortSchemaInfo[] = [];
  totalRecord = 0;

  @Inject
  private readonly schemaService!: SchemaService;

  @Mutation
  setDatabases(newDatabaseInfos: DatabaseInfo[]): void {
    this.databaseInfos = newDatabaseInfos;
  }

  @Mutation
  setDatabaseSchema(newDatabaseSchema: DatabaseSchema) {
    // update databaseSchemas
    const schemaIdx = this.databaseSchemas.findIndex(db => db.name === newDatabaseSchema.name);
    if (schemaIdx >= 0) {
      this.databaseSchemas[schemaIdx] = newDatabaseSchema;
      this.databaseSchemas = this.databaseSchemas.concat([]);
    } else {
      const databaseIdx = this.databaseInfos.findIndex(db => db.name === newDatabaseSchema.name);
      if (databaseIdx >= 0) {
        this.databaseSchemas.splice(databaseIdx, 0, newDatabaseSchema);
        this.databaseSchemas = this.databaseSchemas.concat([]);
      }
    }
  }

  // remove db by name
  @Mutation
  removeDatabaseSchema(dbName: string) {
    const databaseIdx = this.databaseInfos.findIndex(db => db.name === dbName);
    if (databaseIdx >= 0) {
      this.databaseSchemas.splice(databaseIdx, 1);
      this.databaseSchemas = this.databaseSchemas.concat([]);
    }
  }

  @Mutation
  reset() {
    this.databaseInfos = [];
    this.dbNameSelected = '';
    this.databaseSchemas = [];
    this.dbOwnerAsMap.clear();
  }

  @Action
  async loadAllDatabaseInfos(): Promise<DatabaseInfo[]> {
    const databaseInfos = await this.schemaService.getDatabases();
    const newDatabaseInfos: DatabaseInfo[] = SchemaUtils.sortDatabaseInfos(databaseInfos);
    this.setDatabases(newDatabaseInfos);
    return newDatabaseInfos;
  }

  @Action
  addNewDatabaseInfo(dataInfo: DatabaseInfo) {
    const updatedDataInfos = [...this.databaseInfos];
    updatedDataInfos.push(dataInfo);
    Log.debug('DatabaseSchemaStore::addNewDataInfo::databaseInfos::', updatedDataInfos);
    this.setDatabases(updatedDataInfos);
  }

  @Action
  async selectDatabase(dbName: string): Promise<DatabaseSchema> {
    this.setDbNameSelected(dbName);
    const databaseSchema: DatabaseSchema = await this.handleGetDatabaseSchema(dbName);
    this.setDatabaseSchema(databaseSchema);
    return databaseSchema;
  }

  @Action
  async handleGetDatabaseSchema(dbName: string): Promise<DatabaseSchema> {
    const databaseSchema = await this.schemaService.getDatabaseSchema(dbName.replace(/ /g, '+'));
    return SchemaUtils.sort(databaseSchema);
  }

  @Action
  async loadAllDatabaseSchemas(): Promise<void> {
    // Log.debug('loadAllDatabaseSchemas::', this.databaseInfos.map(dbInfo => dbInfo.name));
    const databaseSchemas: FullSchemaInfo[] = await this.schemaService.getListDatabaseSchema(this.databaseInfos.map(dbInfo => dbInfo.name));
    // const databaseSchemas = await Promise.all(futureAllDatabaseSchemas);
    this.setDatabaseSchemas(databaseSchemas.sort((a, b) => StringUtils.compare(a.database.displayName, b.database.displayName)));
  }

  @Mutation
  setDatabaseSchemas(dbInfos: FullSchemaInfo[]) {
    this.databaseSchemas = dbInfos.map(dbInfo => dbInfo.database);
    this.dbOwnerAsMap = new Map(dbInfos.filter(dbInfo => dbInfo.owner).map(dbInfo => [dbInfo.database.name, dbInfo.owner!]));
  }

  @Action
  async createCalculatedField(calculatedFieldData: CreateFieldData): Promise<void> {
    const expressionType = await this.detectExpressionType(calculatedFieldData);
    const createColumnRequest: CreateColumnRequest = getCreateColumnRequest(calculatedFieldData, expressionType);
    try {
      await this.schemaService.createCalculatedColumn(createColumnRequest);
    } catch (ex) {
      Log.error('createCalculatedField::ex', ex);
      return Promise.reject(new DIException('Can not create new column'));
    }
  }

  @Action
  async deleteCalculatedField(payload: DeleteFieldData): Promise<void> {
    const request = new DeleteColumnRequest(payload.dbName, payload.tblName, payload.fieldName);
    await this.schemaService.deleteCalculated(request);
  }

  @Action
  async editCalculatedField(payload: EditFieldData): Promise<TableSchema> {
    const { tableSchema, newExpression, displayName, editingColumn } = payload;
    const expressionType = await this.detectExpressionType({ tableSchema: tableSchema, expression: newExpression });
    const newColumn: Column = Object.assign({}, editingColumn, {
      displayName: displayName,
      defaultExpression: newExpression,
      className: expressionType
    });
    const request = new UpdateColumnRequest(tableSchema.dbName, tableSchema.name, newColumn);
    try {
      return await this.schemaService.updateCalculatedColumn(request);
    } catch (ex) {
      Log.error('editCalculatedField::exception', ex);
      return Promise.reject(new DIException(`Can not edit column ${payload.editingColumn.displayName}`));
    }
  }

  @Action
  async detectExpressionType(payload: { tableSchema: TableSchema; expression: Expression }): Promise<ColumnType> {
    try {
      const { tableSchema, expression } = payload;
      const detectExpressionTypeRequest = new DetectExpressionTypeRequest(tableSchema.dbName, tableSchema.name, expression.expr);
      const expressionType = await this.schemaService.detectExpressionType(detectExpressionTypeRequest);
      return expressionType;
    } catch (ex) {
      Log.error('detectExpressionType::exception', ex);
      return Promise.reject(new FormulaException('Formula invalid'));
    }
  }

  @Action
  async reload(dbName: string): Promise<void> {
    await this.selectDatabase(dbName);
  }

  @Action
  dropTable(payload: { dbName: string; tblName: string }): Promise<boolean> {
    const { dbName, tblName } = payload;
    return this.schemaService.dropTable(dbName, tblName);
  }

  @Action
  loadListDatabase(payload: { from: number; size: number }): Promise<ListingResponse<ShortSchemaInfo>> {
    return this.schemaService.getListDatabase(payload.from, payload.size).then(resp => {
      this.saveListDatabase(resp.data.sort((a, b) => StringUtils.compare(a.database.displayName, b.database.displayName)));
      this.saveTotalRecord(resp.total);
      return resp;
    });
  }

  @Action
  loadListTrashDatabase(payload: { from: number; size: number }): Promise<ListingResponse<ShortSchemaInfo>> {
    return this.schemaService.getListTrashDatabase(payload.from, payload.size).then(resp => {
      this.saveListDatabase(resp.data.sort((a, b) => StringUtils.compare(a.database.displayName, b.database.displayName)));
      this.saveTotalRecord(resp.total);
      return resp;
    });
  }

  @Mutation
  saveListDatabase(databases: ShortSchemaInfo[]) {
    this.listDatabase = databases;
  }

  @Mutation
  saveTotalRecord(totalRecord: number) {
    this.totalRecord = totalRecord;
  }

  /**
   * @deprecated
   * */
  @Action
  moveToTrash(dbName: string) {
    return this.schemaService.dropDatabase(dbName);
  }

  @Action
  deleteDatabase(dbName: string) {
    return this.schemaService.deleteDatabase(dbName);
  }

  @Action
  restoreDatabase(dbName: string) {
    return this.schemaService.restoreDatabase(dbName);
  }

  @Action
  getTableSchema(tblSchema: TableSchema) {
    return this.schemaService.getTable(tblSchema.dbName, tblSchema.name);
  }

  @Mutation
  setDbNameSelected(dbName: string) {
    this.dbNameSelected = dbName;
  }

  @Action
  async createMeasurementField(fieldData: CreateFieldData): Promise<void> {
    const expressionType = await this.detectAggregateExpressionType(fieldData);
    const createColumnRequest: CreateColumnRequest = getCreateColumnRequest(fieldData, expressionType);
    try {
      await this.schemaService.createMeasureColumn(createColumnRequest);
    } catch (ex) {
      Log.error('createCalculatedField::ex', ex);
      return Promise.reject(new DIException('Can not create new column'));
    }
  }

  @Action
  async editMeasurementField(payload: EditFieldData): Promise<TableSchema> {
    const { tableSchema, newExpression, displayName, editingColumn } = payload;
    const expressionType = await this.detectAggregateExpressionType({ tableSchema: tableSchema, expression: newExpression });
    const newColumn: Column = Object.assign({}, editingColumn, {
      displayName: displayName,
      defaultExpression: newExpression,
      className: expressionType
    });
    const request = new UpdateColumnRequest(tableSchema.dbName, tableSchema.name, newColumn);
    try {
      return await this.schemaService.updateMeasurementColumn(request);
    } catch (ex) {
      Log.error('editCalculatedField::exception', ex);
      return Promise.reject(new DIException(`Can not edit column ${payload.editingColumn.displayName}`));
    }
  }

  @Action
  async deleteMeasurementField(payload: DeleteFieldData): Promise<void> {
    const request = new DeleteColumnRequest(payload.dbName, payload.tblName, payload.fieldName);
    await this.schemaService.deleteMeasurementColumn(request);
  }

  @Action
  async detectAggregateExpressionType(payload: { tableSchema: TableSchema; expression: Expression }): Promise<ColumnType> {
    try {
      const { tableSchema, expression } = payload;
      const detectExpressionTypeRequest = new DetectExpressionTypeRequest(tableSchema.dbName, tableSchema.name, expression.expr);
      const expressionType = await this.schemaService.detectAggregateExpressionType(detectExpressionTypeRequest);
      return expressionType;
    } catch (ex) {
      Log.error('detectExpressionType::exception', ex);
      return Promise.reject(new FormulaException(ex.message));
    }
  }
}

export const DatabaseSchemaModule: DatabaseSchemaStore = getModule(DatabaseSchemaStore);
