/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 5:10 PM
 */

import { TableManagerRequest } from './TableManagerRequest';
import { AccessType, FieldInfo, ParseFailMode, TableInfo } from '../../Table';
import { PrepareCreateTableRequest } from '@core/LakeHouse';

export class UpdateTableRequest extends TableManagerRequest {
  public id: string;
  public tableName?: string;
  public dataSource?: string[];
  public schema?: FieldInfo[];
  public delimiter?: string;
  public description?: string;
  public parseFailMode?: ParseFailMode;
  public accessType?: AccessType;

  constructor(data: {
    id: string;
    tableName?: string;
    dataSource?: string[];
    schema?: FieldInfo[];
    delimiter?: string;
    description?: string;
    parseFailMode?: ParseFailMode;
    accessType?: AccessType;
  }) {
    super();
    this.id = data.id;
    this.tableName = data.tableName;
    this.dataSource = data.dataSource;
    this.schema = data.schema;
    this.delimiter = data.delimiter;
    this.description = data.description;
    this.parseFailMode = data.parseFailMode;
    this.accessType = data.accessType;
  }

  static fromPrepareRequest(request: PrepareCreateTableRequest): UpdateTableRequest {
    return new UpdateTableRequest({
      id: '',
      tableName: request.tableName,
      dataSource: request.dataSource,
      schema: [],
      accessType: request.accessType,
      description: request.description,
      delimiter: request.delimiter,
      parseFailMode: ParseFailMode.Ignore
    });
  }

  static fromTableInfo(table: TableInfo): UpdateTableRequest {
    const { schema, tableName, description, delimiter, parseFailMode, accessType, id, dataSource } = table;
    return new UpdateTableRequest({
      id: id,
      tableName: tableName,
      schema: schema,
      description: description,
      delimiter: delimiter,
      parseFailMode: parseFailMode,
      accessType: accessType,
      dataSource: dataSource
    });
  }
}
