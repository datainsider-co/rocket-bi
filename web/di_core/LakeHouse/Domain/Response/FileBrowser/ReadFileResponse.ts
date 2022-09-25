/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:18 PM
 */

import { GetListResponse } from '../GetListResponse';

export class ReadFileResponse extends GetListResponse<string> {
  static fromObject(obj: any) {
    return new ReadFileResponse(obj.data, obj.total, obj.code, obj.msg);
  }
}
