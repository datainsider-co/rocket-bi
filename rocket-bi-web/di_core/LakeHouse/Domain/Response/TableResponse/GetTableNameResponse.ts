/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:23 PM
 */

import { TableManagerResponse } from './TableManagerResponse';

export class GetTableNameResponse extends TableManagerResponse {
  constructor(public tableName: string, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new GetTableNameResponse(obj.tableName, obj.code, obj.msg);
  }
}
