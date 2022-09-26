/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:58 PM
 */

import {
  CreateTableAction,
  CreateTableActionRequest,
  CreateTableRequest,
  ExportTableRequest,
  ListTableRequest,
  PrepareCreateTableRequest,
  QuickCreateTableRequest,
  TableAction
} from '../Domain/Request/Table';
import { CreateTableResponse, ExportTableResponse, ListTableResponse, ParquetTableResponse, ViewSampleResponse } from '../Domain/Response/TableResponse';
import { TableManagerRequest } from '@core/LakeHouse/Domain/Request/Table/TableManagerRequest';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services';

export abstract class TableManagementRepository {
  abstract getTables(request: ListTableRequest): Promise<ListTableResponse>;

  abstract getTableInfo(tableId: string): Promise<CreateTableResponse>;

  abstract viewSampleDataTable(tableId: string, sampleSource: string): Promise<ViewSampleResponse>;

  abstract action(action: TableAction, request: TableManagerRequest): Promise<any>;

  abstract create(request: CreateTableRequest): Promise<CreateTableResponse>;

  abstract prepareCreateTable(request: PrepareCreateTableRequest): Promise<ParquetTableResponse>;

  abstract quickCreateTable(request: QuickCreateTableRequest): Promise<CreateTableResponse>;

  abstract quickCreateTableAction(action: CreateTableAction, request: CreateTableActionRequest): Promise<any>;

  abstract exportTable(request: ExportTableRequest): Promise<ExportTableResponse>;

  abstract checkExportTable(request: ExportTableRequest): Promise<ExportTableResponse>;
}

export class TableManagementRepositoryImpl extends TableManagementRepository {
  @InjectValue(DIKeys.LakeHouseClient)
  private readonly client!: BaseClient;

  action(action: TableAction, request: TableManagerRequest): Promise<any> {
    return this.client.post(
      '/table/action',
      JSON.stringify(request),
      {
        cmd: action
      },
      {
        'Content-Type': 'application/x-www-form-urlencoded;'
      }
    );
  }

  checkExportTable(request: ExportTableRequest): Promise<ExportTableResponse> {
    return this.client
      .post('/table/export/check', JSON.stringify(request), void 0, {
        'Content-Type': 'application/x-www-form-urlencoded;'
      })
      .then(result => ExportTableResponse.fromObject(result));
  }

  create(request: CreateTableRequest): Promise<CreateTableResponse> {
    return this.client
      .post('/table/create', JSON.stringify(request), void 0, {
        'Content-Type': 'application/x-www-form-urlencoded;'
      })
      .then(result => CreateTableResponse.fromObject(result));
  }

  exportTable(request: ExportTableRequest): Promise<ExportTableResponse> {
    return this.client
      .post('/table/export', JSON.stringify(request), void 0, {
        'Content-Type': 'application/x-www-form-urlencoded;'
      })
      .then(result => ExportTableResponse.fromObject(result));
  }

  getTableInfo(tableId: string): Promise<CreateTableResponse> {
    return this.client.get('/table/info', { tableId: tableId }).then(result => CreateTableResponse.fromObject(result));
  }

  getTables(request: ListTableRequest): Promise<ListTableResponse> {
    return this.client.get('/table', request).then(result => ListTableResponse.fromObject(result));
  }

  prepareCreateTable(request: PrepareCreateTableRequest): Promise<ParquetTableResponse> {
    return this.client
      .post('/table/create/prepare', JSON.stringify(request), void 0, {
        'Content-Type': 'application/x-www-form-urlencoded;'
      })
      .then(result => ParquetTableResponse.fromObject(result));
  }

  quickCreateTable(request: QuickCreateTableRequest): Promise<CreateTableResponse> {
    return this.client
      .post('/table/quickcreate', JSON.stringify(request), void 0, {
        'Content-Type': 'application/x-www-form-urlencoded;'
      })
      .then(result => CreateTableResponse.fromObject(result));
  }

  quickCreateTableAction(action: CreateTableAction, request: CreateTableActionRequest): Promise<any> {
    return this.client
      .get(
        '/table/quickcreate',
        { cmd: action },
        {
          'Content-Type': 'application/x-www-form-urlencoded;'
        },
        JSON.stringify(request)
      )
      .then(result => CreateTableResponse.fromObject(result));
  }

  viewSampleDataTable(tableId: string, sampleSource: string): Promise<ViewSampleResponse> {
    return this.client.post('/view/sampledata', { tableId: tableId, sampleSource: sampleSource }).then(result => ViewSampleResponse.fromObject(result));
  }
}
