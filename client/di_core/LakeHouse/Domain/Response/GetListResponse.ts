/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 4:56 PM
 */

import { LakeHouseResponse } from './LakeHouseResponse';

export abstract class GetListResponse<T> extends LakeHouseResponse {
  protected constructor(public data: T[], public readonly total: number, code = 0, msg?: string | null) {
    super(code, msg);
  }
}
