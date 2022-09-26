import {
  AdhocTableCreationRequest,
  CreateTableRequest,
  DatabaseCreateRequest,
  RevokeShareRequest,
  ShareWithUserRequest,
  UpdateShareRequest
} from '@core/domain/Request';
import { Inject } from 'typescript-ioc';
import { SchemaRepository } from '@core/schema/repository/SchemaRepository';
import { Column, ColumnType, DatabaseInfo, DatabaseSchema, TableSchema, TableStatus, TableType } from '@core/domain/Model';
import { CreateColumnRequest } from '@core/schema/domain/CreateColumnRequest';
import { DetectExpressionTypeRequest } from '@core/schema/domain/DetectExpressionTypeRequest';
import { TableCreationFromQueryRequest } from '@core/domain/Request/Schema/TableCreationFromQueryRequest';
import { UpdateColumnRequest } from '@core/schema/domain/UpdateColumnRequest';
import { DeleteColumnRequest } from '@core/schema/domain/DeleteColumnRequest';
import { FullSchemaInfo, ShortSchemaInfo } from '@core/DataWarehouse/ShortSchemaInfo';
import { ResourceInfo } from '@core/domain';
import { ListingResponse } from '@core/DataIngestion';
import { ListUtils, RandomUtils } from '@/utils';
import { StringUtils } from '@/utils/string.utils';
import { UpdateDatabaseSchema } from '@core/schema/domain/UpdateDatabaseSchema';
import { UpdateTableSchemaRequest } from '@core/schema/domain/UpdateTableSchema';
import { IdGenerator } from '@/utils/id_generator';

export abstract class SchemaService {
  abstract createDatabase(request: DatabaseCreateRequest): Promise<DatabaseInfo>;

  abstract dropDatabase(dbName: string): Promise<boolean>;

  abstract deleteDatabase(dbName: string): Promise<boolean>;

  abstract getDatabases(): Promise<DatabaseInfo[]>;

  abstract getDatabaseSchema(dbName: string): Promise<DatabaseSchema>;

  abstract getListDatabaseSchema(dbNames: string[], chunkSize?: number): Promise<FullSchemaInfo[]>;

  abstract getListDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>>;

  abstract getListTrashDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>>;

  abstract getSharedUsers(dbName: string): Promise<ResourceInfo>;

  abstract shareDatabasePermission(request: ShareWithUserRequest): Promise<Map<string, boolean>>;

  abstract createTable(request: CreateTableRequest): Promise<TableSchema>;

  abstract dropTable(dbName: string, tblName: string): Promise<boolean>;

  abstract createColumn(request: CreateColumnRequest): Promise<TableSchema>;

  abstract detectExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType>;

  abstract detectAggregateExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType>;

  abstract detectTableSchema(query: string): Promise<TableSchema>;

  abstract createTableFromQuery(request: TableCreationFromQueryRequest): Promise<TableSchema>;

  abstract restoreDatabase(dbName: string): Promise<boolean>;

  abstract updateColumn(request: UpdateColumnRequest): Promise<TableSchema>;

  abstract updateUsersPermission(request: UpdateShareRequest): Promise<Map<string, boolean>>;

  abstract deleteCalculatedColumn(request: DeleteColumnRequest): Promise<TableSchema>;

  abstract revokeUsersPermission(request: RevokeShareRequest): Promise<Map<string, boolean>>;

  abstract updateDatabase(request: UpdateDatabaseSchema): Promise<DatabaseSchema>;

  abstract updateTable(request: UpdateTableSchemaRequest): Promise<TableSchema>;

  abstract getTable(databaseName: string, tableName: string): Promise<TableSchema>;

  abstract updateTableName(dbName: string, oldTbName: string, newName: string): Promise<boolean>;

  abstract createMeasureColumn(request: CreateColumnRequest): Promise<TableSchema>;

  abstract updateMeasurementColumn(request: UpdateColumnRequest): Promise<TableSchema>;

  abstract deleteMeasurementColumn(request: DeleteColumnRequest): Promise<TableSchema>;

  abstract createCalculatedColumn(request: CreateColumnRequest): Promise<TableSchema>;

  abstract updateCalculatedColumn(request: UpdateColumnRequest): Promise<TableSchema>;

  abstract deleteCalculated(request: DeleteColumnRequest): Promise<TableSchema>;
}

export class SchemaServiceImpl extends SchemaService {
  constructor(@Inject private schemaRepository: SchemaRepository) {
    super();
  }

  createDatabase(request: DatabaseCreateRequest): Promise<DatabaseInfo> {
    return this.schemaRepository.createDatabase(request);
  }

  getDatabases(): Promise<DatabaseInfo[]> {
    return this.schemaRepository.getDatabases();
  }

  getDatabaseSchema(dbName: string): Promise<DatabaseSchema> {
    return this.schemaRepository.getDatabaseSchema(dbName);
  }

  async getListDatabaseSchema(dbNames: string[], chunkSize?: number): Promise<FullSchemaInfo[]> {
    const chunks = ListUtils.sliceIntoChunks(dbNames, chunkSize ?? 50);
    return Promise.all(chunks.map(chunk => this.schemaRepository.getListDatabaseSchema(chunk))).then(schemas =>
      schemas.flat().sort((a, b) => StringUtils.compare(a.database.name, b.database.name))
    );
  }

  getListDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>> {
    return this.schemaRepository.getListDatabase(from, size);
  }

  getListTrashDatabase(from: number, size: number): Promise<ListingResponse<ShortSchemaInfo>> {
    return this.schemaRepository.getListTrashDatabase(from, size);
  }

  getSharedUsers(dbName: string): Promise<ResourceInfo> {
    return this.schemaRepository.getSharedUsers(dbName);
  }

  dropDatabase(dbName: string): Promise<boolean> {
    return this.schemaRepository.dropDatabase(dbName);
  }

  deleteDatabase(dbName: string): Promise<boolean> {
    return this.schemaRepository.deleteDatabase(dbName);
  }

  createTable(request: CreateTableRequest): Promise<TableSchema> {
    return this.schemaRepository.createTable(request);
  }

  dropTable(dbName: string, tblName: string): Promise<boolean> {
    return this.schemaRepository.dropTable(dbName, tblName);
  }

  createColumn(request: CreateColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.createColumn(request);
  }

  shareDatabasePermission(request: ShareWithUserRequest): Promise<Map<string, boolean>> {
    return this.schemaRepository.shareDatabasePermission(request);
  }

  detectExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType> {
    return this.schemaRepository.detectExpressionType(request);
  }

  detectAggregateExpressionType(request: DetectExpressionTypeRequest): Promise<ColumnType> {
    return this.schemaRepository.detectAggregateExpressionType(request);
  }

  updateColumn(request: UpdateColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.updateColumn(request);
  }

  updateUsersPermission(request: UpdateShareRequest): Promise<Map<string, boolean>> {
    return this.schemaRepository.updateUsersPermission(request);
  }

  deleteCalculatedColumn(request: DeleteColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.deleteCalculatedColumn(request);
  }

  createTableFromQuery(request: TableCreationFromQueryRequest): Promise<TableSchema> {
    return this.schemaRepository.createTableFromQuery(request);
  }

  restoreDatabase(dbName: string): Promise<boolean> {
    return this.schemaRepository.restoreDatabase(dbName);
  }

  revokeUsersPermission(request: RevokeShareRequest): Promise<Map<string, boolean>> {
    return this.schemaRepository.revokeUsersPermission(request);
  }

  updateDatabase(request: UpdateDatabaseSchema): Promise<DatabaseSchema> {
    return this.schemaRepository.updateDatabase(request);
  }

  updateTable(request: UpdateTableSchemaRequest): Promise<TableSchema> {
    return this.schemaRepository.updateTable(request);
  }

  getTable(databaseName: string, tableName: string): Promise<TableSchema> {
    return this.schemaRepository.getTable(databaseName, tableName);
  }

  updateTableName(dbName: string, oldTbName: string, newName: string): Promise<boolean> {
    return this.schemaRepository.updateTableName(dbName, oldTbName, newName);
  }

  detectTableSchema(query: string): Promise<TableSchema> {
    return this.schemaRepository.detectTableSchema(query);
  }

  createMeasureColumn(request: CreateColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.createMeasureColumn(request);
  }

  updateMeasurementColumn(request: UpdateColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.updateMeasurementColumn(request);
  }
  deleteMeasurementColumn(request: DeleteColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.deleteMeasurementColumn(request);
  }

  createCalculatedColumn(request: CreateColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.createCalculatedColumn(request);
  }

  updateCalculatedColumn(request: UpdateColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.updateCalculatedColumn(request);
  }
  deleteCalculated(request: DeleteColumnRequest): Promise<TableSchema> {
    return this.schemaRepository.deleteCalculated(request);
  }
}
