/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:22 PM
 */

import { LakeHouseResponse } from '../LakeHouseResponse';

export class TableManagerResponse extends LakeHouseResponse {
  static fromObject(obj: any) {
    return new TableManagerResponse(obj.code, obj.msg);
  }
}
