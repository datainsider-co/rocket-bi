/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';
import { PeriodicQueryInfo } from '@core/LakeHouse';

export class GetPeriodicQueryResponse extends SparkQueryResponse {
  constructor(public data?: PeriodicQueryInfo, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new GetPeriodicQueryResponse(obj.data ? PeriodicQueryInfo.fromObject(obj.data) : void 0, obj.code, obj.msg);
  }
}
