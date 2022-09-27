import {
  AdhocTableCreationRequest,
  CreateTableRequest,
  DatabaseCreateRequest,
  RevokeShareRequest,
  ShareWithUserRequest,
  UpdateShareRequest
} from '@core/domain/Request';
import { Column, ColumnType, DatabaseInfo, DatabaseSchema, TableSchema } from '@core/domain/Model';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules/di';
import { BaseClient } from '@core/services/base.service';
import { CreateColumnRequest } from '@core/schema/domain/CreateColumnRequest';
import { DetectExpressionTypeRequest } from '@core/schema/domain/DetectExpressionTypeRequest';
import { UpdateColumnRequest } from '@core/schema/domain/UpdateColumnRequest';
import { DeleteColumnRequest } from '@core/schema/domain/DeleteColumnRequest';
import { TableCreationFromQueryRequest } from '@core/domain/Request/Schema/TableCreationFromQueryRequest';
import { FullSchemaInfo, ShortSchemaInfo } from '@core/DataWarehouse/ShortSchemaInfo';
import { ResourceInfo } from '@core/domain';
import { ListingResponse } from '@core/DataIngestion';
import { UpdateDatabaseSchema } from '@core/schema/domain/UpdateDatabaseSchema';
import { UpdateTableSchemaRequest } from '@core/schema/domain/UpdateTableSchema';

export abstract class SchemaRepository {
  abstract createDatabase(request: DatabaseCreateRequest): Promise<DatabaseInfo>;

  ///Soft Delete
  abstract dropDatabase(dbName: string): Promise<boolean>;

  abstract deleteDatabase(dbName: string): Promise<boolean>;

  abstract getDatabases(): Promise<DatabaseInfo[]>;

  abstract getDatabaseSchema(dbName: string): Promise<DatabaseSchema>;

  abstract getListDatabaseSchema(dbNames: string[]): Promise<FullSchemaInfo[]>;

  abstract getListDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>>;

  abstract getListTrashDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>>;

  abstract getSharedUsers(dbName: string): Promise<ResourceInfo>;

  abstract revokeUsersPermission(request: RevokeShareRequest): Promise<Map<string, boolean>>;

  abstract shareDatabasePermission(request: ShareWithUserRequest): Promise<Map<string, boolean>>;

  abstract updateUsersPermission(request: UpdateShareRequest): Promise<Map<string, boolean>>;

  abstract createTable(request: CreateTableRequest): Promise<TableSchema>;

  abstract dropTable(dbName: string, tblName: string): Promise<boolean>;

  abstract createColumn(request: CreateColumnRequest): Promise<TableSchema>;

  abstract createMeasureColumn(request: CreateColumnRequest): Promise<TableSchema>;

  abstract createCalculatedColumn(request: CreateColumnRequest): Promise<TableSchema>;

  abstract detectExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType>;

  abstract detectAggregateExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType>;

  abstract createTableFromQuery(request: TableCreationFromQueryRequest): Promise<TableSchema>;

  abstract restoreDatabase(dbName: string): Promise<boolean>;

  abstract updateColumn(request: UpdateColumnRequest): Promise<TableSchema>;

  abstract updateMeasurementColumn(request: UpdateColumnRequest): Promise<TableSchema>;

  abstract updateCalculatedColumn(request: UpdateColumnRequest): Promise<TableSchema>;

  abstract deleteCalculatedColumn(request: DeleteColumnRequest): Promise<TableSchema>;

  abstract deleteCalculated(request: DeleteColumnRequest): Promise<TableSchema>;

  abstract deleteMeasurementColumn(request: DeleteColumnRequest): Promise<TableSchema>;

  abstract updateDatabase(request: UpdateDatabaseSchema): Promise<DatabaseSchema>;

  abstract updateTable(request: UpdateTableSchemaRequest): Promise<TableSchema>;

  abstract getTable(databaseName: string, tableName: string): Promise<TableSchema>;

  abstract updateTableName(dbName: string, oldTbName: string, newName: string): Promise<boolean>;

  abstract detectTableSchema(query: string): Promise<TableSchema>;
}

export class SchemaRepositoryImpl extends SchemaRepository {
  @InjectValue(DIKeys.SchemaClient)
  private httpClient!: BaseClient;

  createDatabase(request: DatabaseCreateRequest): Promise<DatabaseInfo> {
    return this.httpClient
      .post<DatabaseInfo>(`/databases`, request, undefined, {
        'DI-SERVICE-KEY': '123' // TODO: change this later
      })
      .then(obj => DatabaseInfo.fromObject(obj));
  }

  getDatabases(): Promise<DatabaseInfo[]> {
    return this.httpClient
      .get<DatabaseInfo[]>(`/databases`, undefined, {
        'DI-SERVICE-KEY': '123'
      })
      .then(list => list.map(obj => DatabaseInfo.fromObject(obj)));
  }

  getDatabaseSchema(dbName: string): Promise<DatabaseSchema> {
    return this.httpClient
      .get<DatabaseSchema>(`/databases/${dbName}`, undefined, {
        'DI-SERVICE-KEY': '123'
      })
      .then(obj => DatabaseSchema.fromObject(obj));
  }

  getListDatabaseSchema(dbNames: string[]): Promise<FullSchemaInfo[]> {
    return this.httpClient
      .post<FullSchemaInfo[]>(`/databases/multi_gets`, { dbNames: dbNames }, {})
      .then(list => list.map(obj => FullSchemaInfo.fromObject(obj)));
  }

  dropDatabase(dbName: string): Promise<boolean> {
    return this.httpClient.put(`/databases/${dbName}/remove`, undefined, undefined, {
      'DI-SERVICE-KEY': '123'
    });
  }

  deleteDatabase(dbName: string): Promise<boolean> {
    return this.httpClient.delete(`/databases/${dbName}`, undefined, undefined, {
      'DI-SERVICE-KEY': '123'
    });
  }

  createTable(request: CreateTableRequest): Promise<TableSchema> {
    return this.httpClient
      .post<TableSchema>(`/databases/${request.dbName}/tables`, request, undefined, {
        'DI-SERVICE-KEY': '123'
      })
      .then(obj => TableSchema.fromObject(obj));
  }

  dropTable(dbName: string, tblName: string): Promise<boolean> {
    return this.httpClient.delete(`/databases/${dbName}/tables/${tblName}`, { adminSecretKey: 12345678 }, undefined, {
      'DI-SERVICE-KEY': '123'
    });
  }

  createColumn(request: CreateColumnRequest): Promise<TableSchema> {
    return this.httpClient.post(`/databases/${request.dbName}/tables/${request.tblName}/column`, request).then((resp: any) => TableSchema.fromObject(resp));
  }

  createMeasureColumn(request: CreateColumnRequest): Promise<TableSchema> {
    return this.httpClient
      .post(`/databases/${request.dbName}/tables/${request.tblName}/expr_column`, request)
      .then((resp: any) => TableSchema.fromObject(resp));
  }

  detectExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType> {
    return this.httpClient.post<ColumnType>(`/databases/${request.dbName}/tables/${request.tblName}/expression`, request);
  }
  detectAggregateExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType> {
    return this.httpClient.post<ColumnType>(`/databases/${request.dbName}/tables/${request.tblName}/aggregate_expression`, request);
  }

  createTableFromQuery(request: TableCreationFromQueryRequest): Promise<TableSchema> {
    return this.httpClient
      .post(`/databases/${request.dbName}/tables/from_query`, { ...request, adminSecretKey: 12345678 })
      .then(response => TableSchema.fromObject(response as TableSchema));
  }

  restoreDatabase(dbName: string): Promise<boolean> {
    return this.httpClient.put(`/databases/${dbName}/restore`);
  }

  updateColumn(request: UpdateColumnRequest): Promise<TableSchema> {
    return this.httpClient.put<any>(`/databases/${request.dbName}/tables/${request.tblName}/column`, request).then(table => TableSchema.fromObject(table));
  }

  updateMeasurementColumn(request: UpdateColumnRequest): Promise<TableSchema> {
    return this.httpClient.put<any>(`/databases/${request.dbName}/tables/${request.tblName}/expr_column`, request).then(table => TableSchema.fromObject(table));
  }

  deleteCalculatedColumn(request: DeleteColumnRequest): Promise<TableSchema> {
    return this.httpClient.delete(`/databases/${request.dbName}/tables/${request.tblName}/columns/${request.columnName}`);
  }

  deleteMeasurementColumn(request: DeleteColumnRequest): Promise<TableSchema> {
    return this.httpClient.delete(`/databases/${request.dbName}/tables/${request.tblName}/expr_column/${request.columnName}`);
  }

  getListDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>> {
    return this.httpClient.get(`/databases/my_data?from=${from}&size=${size}`);
  }

  getListTrashDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>> {
    return this.httpClient.get(`/databases/trash?from=${from}&size=${size}`);
  }

  getSharedUsers(dbName: string): Promise<ResourceInfo> {
    return this.httpClient.get(`/databases/${dbName}/share/list`).then(response => ResourceInfo.fromObject(response));
  }

  shareDatabasePermission(request: ShareWithUserRequest): Promise<Map<string, boolean>> {
    return this.httpClient.post(`/databases/${request.resourceId}/share`, request).then(resp => new Map(Object.entries(resp as any)));
  }

  updateUsersPermission(request: UpdateShareRequest): Promise<Map<string, boolean>> {
    return this.httpClient.put(`/databases/${request.resourceId}/share/update`, request).then(resp => new Map(Object.entries(resp as any)));
  }

  revokeUsersPermission(request: RevokeShareRequest): Promise<Map<string, boolean>> {
    return this.httpClient.delete(`/databases/${request.resourceId}/share/revoke`, request).then(resp => new Map(Object.entries(resp as any)));
  }

  updateDatabase(request: UpdateDatabaseSchema): Promise<DatabaseSchema> {
    return this.httpClient.put(`/databases/${request.dbSchema.name}`, request).then(obj => DatabaseSchema.fromObject(obj as DatabaseSchema));
  }

  updateTable(request: UpdateTableSchemaRequest): Promise<TableSchema> {
    return this.httpClient
      .put(`/databases/${request.tableSchema.dbName}/tables/${request.tableSchema.name}`, request)
      .then(obj => TableSchema.fromObject(obj as TableSchema));
  }
  getTable(databaseName: string, tableName: string): Promise<TableSchema> {
    return this.httpClient.get(`/databases/${databaseName}/tables/${tableName}`).then(obj => TableSchema.fromObject(obj as TableSchema));
  }

  updateTableName(dbName: string, oldTbName: string, newName: string): Promise<boolean> {
    return this.httpClient.put(`/databases/${dbName}/tables/${oldTbName}/name`, { newName: newName });
  }

  detectTableSchema(query: string): Promise<TableSchema> {
    return this.httpClient
      .post<any>('/databases/adhoc/tables', { query: query })
      .then(response => TableSchema.fromObject(response));
  }

  createCalculatedColumn(request: CreateColumnRequest): Promise<TableSchema> {
    return this.httpClient
      .post(`/databases/${request.dbName}/tables/${request.tblName}/calc_column`, request)
      .then((resp: any) => TableSchema.fromObject(resp));
  }

  deleteCalculated(request: DeleteColumnRequest): Promise<TableSchema> {
    return this.httpClient.delete(`/databases/${request.dbName}/tables/${request.tblName}/calc_column/${request.columnName}`);
  }

  updateCalculatedColumn(request: UpdateColumnRequest): Promise<TableSchema> {
    return this.httpClient.put<any>(`/databases/${request.dbName}/tables/${request.tblName}/calc_column`, request).then(table => TableSchema.fromObject(table));
  }
}
