/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:23 PM
 */

import { TableManagerResponse } from './TableManagerResponse';
import { TableInfo } from '../../table/TableInfo';

export class CreateTableResponse extends TableManagerResponse {
  constructor(public tableInfo: TableInfo, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new CreateTableResponse(TableInfo.fromObject(obj.tableInfo), obj.code, obj.msg);
  }
}
