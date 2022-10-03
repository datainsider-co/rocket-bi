/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:26 PM
 */

import { LakeHouseResponse } from '@core/lake-house/domain/response/LakeHouseResponse';

export class ForceRunResponse extends LakeHouseResponse {
  static fromObject(obj: any) {
    return new ForceRunResponse(obj.code, obj.msg);
  }
}
