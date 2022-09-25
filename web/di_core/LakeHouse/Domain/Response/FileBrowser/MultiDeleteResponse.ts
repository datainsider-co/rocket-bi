/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:21 PM
 */

import { GetListResponse } from '../GetListResponse';

export class MultiDeleteResponse extends GetListResponse<string> {
  static fromObject(obj: any) {
    return new MultiDeleteResponse(obj.data, obj.total, obj.code, obj.msg);
  }
}
