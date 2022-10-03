/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:58 PM
 */

import {
  CreateTableAction,
  CreateTableActionRequest,
  CreateTableRequest,
  CreateTableResponse,
  ExportTableRequest,
  ExportTableResponse,
  ListTableRequest,
  ListTableResponse,
  ParquetTableResponse,
  PrepareCreateTableRequest,
  QuickCreateTableRequest,
  TableAction,
  TableManagerRequest,
  UpdateTableRequest,
  ViewSampleResponse
} from '../domain';
import { Inject } from 'typescript-ioc';
import { TableManagementRepository } from '../repository';

export abstract class TableManagementService {
  abstract getTables(request: ListTableRequest): Promise<ListTableResponse>;

  abstract getTableInfo(tableId: string): Promise<CreateTableResponse>;

  abstract viewSampleDataTable(tableId: string, sampleSource: string): Promise<ViewSampleResponse>;

  abstract action(action: TableAction, request: TableManagerRequest): Promise<any>;

  abstract create(request: CreateTableRequest): Promise<CreateTableResponse>;

  abstract update(request: UpdateTableRequest): Promise<CreateTableResponse>;

  abstract prepareCreateTable(request: PrepareCreateTableRequest): Promise<ParquetTableResponse>;

  abstract quickCreateTable(request: QuickCreateTableRequest): Promise<CreateTableResponse>;

  abstract quickCreateTableAction(action: CreateTableAction, request: CreateTableActionRequest): Promise<any>;

  abstract exportTable(request: ExportTableRequest): Promise<ExportTableResponse>;

  abstract checkExportTable(request: ExportTableRequest): Promise<ExportTableResponse>;
}

export class TableManagementServiceImpl extends TableManagementService {
  @Inject
  protected readonly repository!: TableManagementRepository;

  action(action: TableAction, request: TableManagerRequest): Promise<any> {
    return this.repository.action(action, request);
  }

  checkExportTable(request: ExportTableRequest): Promise<ExportTableResponse> {
    return this.repository.checkExportTable(request);
  }

  create(request: CreateTableRequest): Promise<CreateTableResponse> {
    return this.repository.create(request);
  }
  update(request: UpdateTableRequest): Promise<CreateTableResponse> {
    return this.repository.action(TableAction.Update, request);
  }

  exportTable(request: ExportTableRequest): Promise<ExportTableResponse> {
    return this.repository.exportTable(request);
  }

  getTableInfo(tableId: string): Promise<CreateTableResponse> {
    return this.repository.getTableInfo(tableId);
  }

  getTables(request: ListTableRequest): Promise<ListTableResponse> {
    return this.repository.getTables(request);
  }

  prepareCreateTable(request: PrepareCreateTableRequest): Promise<ParquetTableResponse> {
    return this.repository.prepareCreateTable(request);
  }

  quickCreateTable(request: QuickCreateTableRequest): Promise<CreateTableResponse> {
    return this.repository.quickCreateTable(request);
  }

  quickCreateTableAction(action: CreateTableAction, request: CreateTableActionRequest): Promise<any> {
    return this.repository.quickCreateTableAction(action, request);
  }

  viewSampleDataTable(tableId: string, sampleSource: string): Promise<ViewSampleResponse> {
    return this.repository.viewSampleDataTable(tableId, sampleSource);
  }
}
