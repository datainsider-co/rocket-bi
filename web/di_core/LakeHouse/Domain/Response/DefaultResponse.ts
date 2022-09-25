/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:08 PM
 */

import { LakeHouseResponse } from './LakeHouseResponse';

export class DefaultResponse extends LakeHouseResponse {
  constructor(public data: object, code: number, msg?: string | null) {
    super(code, msg);
  }

  static fromJson(obj: any) {
    return new DefaultResponse(obj.data, obj.code, obj.msg);
  }
}
