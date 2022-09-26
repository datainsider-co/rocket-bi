/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';

export class ScheduleQueryResponse extends SparkQueryResponse {
  constructor(public queryId: string, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new ScheduleQueryResponse(obj.queryId, obj.code, obj.msg);
  }
}
