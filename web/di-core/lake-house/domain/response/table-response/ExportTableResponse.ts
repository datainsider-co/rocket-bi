/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:23 PM
 */

import { TableManagerResponse } from './TableManagerResponse';

export class ExportTableResponse extends TableManagerResponse {
  static fromObject(obj: any) {
    return new ExportTableResponse(obj.code, obj.msg);
  }
}
