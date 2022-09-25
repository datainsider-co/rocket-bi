/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { GetListResponse } from '../GetListResponse';

export class QueryResultResponse extends GetListResponse<string[]> {
  constructor(public outputFields: string[], data: string[][], total: number, public resultPath?: string, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    return new QueryResultResponse(obj.outputFields, obj.data, obj.total, obj.resultPath, obj.code, obj.msg);
  }
}
