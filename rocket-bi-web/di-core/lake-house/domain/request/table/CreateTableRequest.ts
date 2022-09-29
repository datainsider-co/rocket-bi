/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 5:26 PM
 */

import { AccessType, ParseFailMode, TableInfo } from '../../table/TableInfo';
import { FieldMappingInfo, PrepareCreateTableRequest } from '@core/lake-house';
import { TableManagerRequest } from './TableManagerRequest';

export class CreateTableRequest extends TableManagerRequest {
  constructor(
    public tableName: string,
    public dataSource: string[],
    public schema: FieldMappingInfo[],
    public accessType?: AccessType,
    public description?: string,
    public delimiter?: string,
    public parseFailMode?: ParseFailMode
  ) {
    super();
  }

  static fromPrepareRequest(request: PrepareCreateTableRequest): CreateTableRequest {
    return new CreateTableRequest(request.tableName, request.dataSource, [], request.accessType, request.description, request.delimiter, ParseFailMode.Ignore);
  }

  static fromTableInfo(table: TableInfo): CreateTableRequest {
    const { tableName, dataSource, accessType, description, delimiter, parseFailMode } = table;
    return new CreateTableRequest(tableName, dataSource, [], accessType, description, delimiter, parseFailMode);
  }

  updateSchema(schema: FieldMappingInfo[]) {
    this.schema = schema;
  }
}
