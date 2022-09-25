/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:26 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';

export class ExecuteQueryResponse extends SparkQueryResponse {
  constructor(public queryId: string, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any): ExecuteQueryResponse {
    return new ExecuteQueryResponse(obj.queryId, obj.code, obj.msg);
  }
}
