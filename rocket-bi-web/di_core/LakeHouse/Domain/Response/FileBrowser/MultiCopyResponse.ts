/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:21 PM
 */

import { GetListResponse } from '../GetListResponse';

export class MultiCopyResponse extends GetListResponse<string> {
  static fromObject(obj: any) {
    return new MultiCopyResponse(obj.data, obj.total, obj.code, obj.msg);
  }
}
