/*
 * @author: tvc12 - Thien Vi
 * @created: 12/4/20, 6:05 PM
 */

import { Column, ColumnType, DatabaseInfo, Expression, ShortDatabaseInfo, TableSchema } from '@core/common/domain/model';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared/enums/Stores';
import { ListUtils, SchemaUtils } from '@/utils';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { CreateColumnRequest } from '@core/schema/domain/CreateColumnRequest';
import { DIException } from '@core/common/domain/exception';
import { FormulaException } from '@core/common/domain/exception/FormulaException';
import { DetectExpressionTypeRequest } from '@core/schema/domain/DetectExpressionTypeRequest';
import { IdGenerator } from '@/utils/IdGenerator';
import { CreateFieldData, DeleteFieldData, EditFieldData } from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldData';
import { Log } from '@core/utils';
import { UpdateColumnRequest } from '@core/schema/domain/UpdateColumnRequest';
import { DeleteColumnRequest } from '@core/schema/domain/DeleteColumnRequest';
import { UpdateTableSchemaRequest } from '@core/schema/domain/UpdateTableSchema';
import Vue from 'vue';
import { FullSchemaResponse } from '@core/data-warehouse/ShortSchemaResponse';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';

export enum SchemaReloadMode {
  All,
  OnlyShortDatabaseInfo,
  OnlyDatabaseHasTable
}

const getCreateColumnRequest = (fieldData: CreateFieldData, expressionType: ColumnType): CreateColumnRequest => {
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

@Module({ store: store, name: Stores.DatabaseSchemaStore, dynamic: true, namespaced: true })
class DatabaseSchemaStore extends VuexModule {
  private readonly DEFAULT_CHUNK_SIZE = 10;
  selectedDbName = '';
  databaseInfos: DatabaseInfo[] = [];
  /**
   * Map from database name to loading status
   * key: database name
   * value: loading status. true: loading, false: not loading
   */
  databaseLoadingMap: { [key: string]: boolean } = {};

  @Inject
  private readonly schemaService!: SchemaService;

  @Mutation
  setDatabaseLoading(payload: { dbName: string; isLoading: boolean }): void {
    Vue.set(this.databaseLoadingMap, payload.dbName, payload.isLoading);
    // this.databaseLoadingMap = { ...this.databaseLoadingMap, [dbName]: isLoading };
  }

  @Mutation
  setDatabasesLoading(payload: { dbNames: string[]; isLoading: boolean }): void {
    payload.dbNames.forEach(dbName => Vue.set(this.databaseLoadingMap, dbName, payload.isLoading));
  }

  @Mutation
  setDatabaseInfo(newDatabaseInfo: DatabaseInfo): void {
    const databaseIndex = this.databaseInfos.findIndex(db => db.name === newDatabaseInfo.name);
    if (databaseIndex >= 0) {
      const existedDatabaseInfo: DatabaseInfo = this.databaseInfos[databaseIndex];
      existedDatabaseInfo.tables = newDatabaseInfo.tables;
      this.databaseInfos = ListUtils.replaceAt(this.databaseInfos, databaseIndex, existedDatabaseInfo);
    } else {
      this.databaseInfos.push(newDatabaseInfo);
      this.databaseInfos = SchemaUtils.sortDatabaseInfos(this.databaseInfos);
    }
  }

  // remove db by name
  @Mutation
  removeDatabaseInfo(dbName: string): void {
    const databaseIdx = this.databaseInfos.findIndex(db => db.name === dbName);
    if (databaseIdx >= 0) {
      this.databaseInfos.splice(databaseIdx, 1);
      this.databaseInfos = this.databaseInfos.concat([]);
    }
  }

  @Mutation
  reset(): void {
    this.selectedDbName = '';
    this.databaseInfos = [];
  }

  @Action
  async loadShortDatabaseInfos(isForceLoad: boolean): Promise<ShortDatabaseInfo[]> {
    if (isForceLoad || ListUtils.isEmpty(this.databaseInfos)) {
      const databaseInfos: ShortDatabaseInfo[] = await this.schemaService.getDatabases();
      const sortedDatabaseInfos: ShortDatabaseInfo[] = SchemaUtils.sortDatabaseInfos(databaseInfos) as ShortDatabaseInfo[];
      this.setDatabaseInfos(sortedDatabaseInfos);
      return sortedDatabaseInfos;
    } else {
      return this.databaseInfos;
    }
  }

  /**
   * handle reload databases info
   */
  @Action
  async reloadDatabaseInfos(reloadMode: SchemaReloadMode): Promise<ShortDatabaseInfo[]> {
    if (AuthenticationModule.isLoggedIn) {
      const shortDatabaseInfos: ShortDatabaseInfo[] = await this.schemaService.getDatabases();
      const mergedShortDatabaseInfos: ShortDatabaseInfo[] = SchemaUtils.mergeDatabaseInfos(shortDatabaseInfos, this.databaseInfos);
      const dbNames = await this.getDatabaseNamesMustReload({ dbInfos: mergedShortDatabaseInfos, reloadMode: reloadMode });
      const latestDatabaseInfos: DatabaseInfo[] = await this.fetchDatabaseInfos({ dbNames: dbNames });
      const allDatabaseInfos = SchemaUtils.mergeDatabaseInfos(mergedShortDatabaseInfos, latestDatabaseInfos);
      const sortedDatabaseInfos: DatabaseInfo[] = SchemaUtils.sortDatabaseInfos(allDatabaseInfos);
      this.setDatabaseInfos(sortedDatabaseInfos);
      return sortedDatabaseInfos;
    } else {
      return [];
    }
  }

  @Action
  private async getDatabaseNamesMustReload(payload: { dbInfos: DatabaseInfo[]; reloadMode: SchemaReloadMode }): Promise<string[]> {
    switch (payload.reloadMode) {
      case SchemaReloadMode.OnlyDatabaseHasTable: {
        return payload.dbInfos.filter(db => ListUtils.isNotEmpty(db.tables)).map(db => db.name);
      }
      case SchemaReloadMode.OnlyShortDatabaseInfo: {
        return payload.dbInfos.filter(db => ListUtils.isEmpty(db.tables)).map(db => db.name);
      }
      case SchemaReloadMode.All: {
        return payload.dbInfos.map(db => db.name);
      }
    }
  }

  /**
   * lazy load database info by chunk size, default chunk size is 10
   */
  @Action
  private async fetchDatabaseInfos(payload: { dbNames: string[]; chunkSize?: number }): Promise<DatabaseInfo[]> {
    const responseList: FullSchemaResponse[] = await this.schemaService.getListDatabaseSchema(payload.dbNames, payload.chunkSize);
    const databases: DatabaseInfo[] = responseList.map(response => response.database);
    return databases;
  }

  @Mutation
  private setSelectedDbName(dbName: string) {
    this.selectedDbName = dbName;
  }

  /**
   * method set selected db name and load database info
   */
  @Action
  async selectDatabase(payload: { dbName: string; forceLoad?: boolean }): Promise<DatabaseInfo> {
    this.setSelectedDbName(payload.dbName);
    return this.loadDatabaseInfo(payload);
  }

  /**
   * method load database info, if database info is not exist in store, it will fetch from backend
   */
  @Action
  async loadDatabaseInfo(payload: { dbName: string; forceLoad?: boolean }): Promise<DatabaseInfo> {
    this.setDatabaseLoading({ dbName: payload.dbName, isLoading: true });
    try {
      const { dbName, forceLoad } = payload;
      const dbInfo: DatabaseInfo | null = this.databaseInfos.find(db => db.name === dbName) || null;
      if (!forceLoad && dbInfo && !ShortDatabaseInfo.isShortDatabaseInfo(dbInfo)) {
        return dbInfo;
      } else {
        const databaseSchema: DatabaseInfo = await this.fetchDatabaseInfo(dbName);
        this.setDatabaseInfo(databaseSchema);
        return databaseSchema;
      }
    } finally {
      this.setDatabaseLoading({ dbName: payload.dbName, isLoading: false });
    }
  }

  /**
   * fetch database info from backend
   * @param dbName
   */
  @Action
  async fetchDatabaseInfo(dbName: string): Promise<DatabaseInfo> {
    const databaseSchema = await this.schemaService.getDatabaseSchema(dbName.replace(/ /g, '+'));
    return SchemaUtils.sort(databaseSchema);
  }

  @Mutation
  setDatabaseInfos(databaseInfos: DatabaseInfo[]): void {
    this.databaseInfos = databaseInfos;
    this.databaseLoadingMap = {};
  }

  @Action
  async createCalculatedField(fieldData: CreateFieldData): Promise<void> {
    const expressionType = await this.detectExpressionType(fieldData);
    const createColumnRequest: CreateColumnRequest = getCreateColumnRequest(fieldData, expressionType);
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
  private async detectExpressionType(payload: { tableSchema: TableSchema; expression: Expression }): Promise<ColumnType> {
    try {
      const { tableSchema, expression } = payload;
      const detectExpressionTypeRequest = new DetectExpressionTypeRequest(tableSchema.dbName, tableSchema.name, expression.expr);
      return await this.schemaService.detectExpressionType(detectExpressionTypeRequest);
    } catch (ex) {
      Log.error('detectExpressionType::exception', ex);
      return Promise.reject(new FormulaException('Formula invalid'));
    }
  }

  @Action
  async reload(dbName: string): Promise<DatabaseInfo> {
    return await this.selectDatabase({ dbName, forceLoad: true });
  }

  @Action
  async dropTable(payload: { dbName: string; tblName: string }): Promise<boolean> {
    const { dbName, tblName } = payload;
    return await this.schemaService.dropTable(dbName, tblName);
  }

  /**
   * @deprecated this method is deprecated because it is unsupported by backend
   * */
  @Action
  moveToTrash(dbName: string): Promise<boolean> {
    return this.schemaService.dropDatabase(dbName);
  }

  @Action
  async deleteDatabase(dbName: string): Promise<boolean> {
    const result: Promise<boolean> = this.schemaService.deleteDatabase(dbName);
    this.removeDatabaseInfo(dbName);
    return result;
  }

  @Action
  restoreDatabase(dbName: string): Promise<boolean> {
    return this.schemaService.restoreDatabase(dbName);
  }

  @Action
  fetchTableSchema(payload: { dbName: string; tblName: string }): Promise<TableSchema> {
    return this.schemaService.getTable(payload.dbName, payload.tblName);
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

  @Action
  async loadTableSchema(payload: { dbName: string; tableName: string; forceLoad?: boolean }): Promise<TableSchema | undefined> {
    const { dbName, tableName, forceLoad } = payload;
    const dbInfo = await this.loadDatabaseInfo({ dbName, forceLoad });
    return dbInfo.tables.find(table => table.name === tableName);
  }

  /**
   * update table schema, and reload table schema in store
   * @param tableSchema
   */
  @Action
  async updateTableSchema(tableSchema: TableSchema): Promise<TableSchema> {
    const request: UpdateTableSchemaRequest = { tableSchema: tableSchema };
    return await this.schemaService.updateTable(request);
  }
}

export const DatabaseSchemaModule: DatabaseSchemaStore = getModule(DatabaseSchemaStore);
