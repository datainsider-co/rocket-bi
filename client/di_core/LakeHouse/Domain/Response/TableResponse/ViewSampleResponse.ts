/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:23 PM
 */

import { GetListResponse } from '../GetListResponse';

export class ViewSampleResponse extends GetListResponse<string[]> {
  constructor(data: string[][], total: number, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    return new ViewSampleResponse(obj.data, obj.total, obj.code, obj.msg);
  }
}
