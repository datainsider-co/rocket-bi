/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { GetListResponse } from '../GetListResponse';

export class CheckQueryResponse extends GetListResponse<string[]> {
  constructor(public outputFields: string[], data: string[][], total: number, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: CheckQueryResponse) {
    return new CheckQueryResponse(obj.outputFields ?? [], obj.data ?? [], obj.total, obj.code, obj.msg);
  }
}
