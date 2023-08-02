/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:23 PM
 */

import { TableManagerResponse } from './TableManagerResponse';

export class DropTableResponse extends TableManagerResponse {
  static fromObject(obj: any) {
    return new DropTableResponse(obj.code, obj.msg);
  }
}
