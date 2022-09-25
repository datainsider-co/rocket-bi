/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:18 PM
 */

import { FileBrowserResponse } from './FileBrowserResponse';

export class DeleteResponse extends FileBrowserResponse {
  static fromObject(obj: any) {
    return new DeleteResponse(obj.code, obj.msg);
  }
}
