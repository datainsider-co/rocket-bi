/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { LakeHouseResponse } from '../LakeHouseResponse';

export class ScheduleResponse extends LakeHouseResponse {
  constructor(code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new ScheduleResponse(obj.code, obj.msg);
  }
}
