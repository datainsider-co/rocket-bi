/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:18 PM
 */

import { FileBrowserResponse } from './FileBrowserResponse';

export class CopyResponse extends FileBrowserResponse {
  static fromObject(obj: any) {
    return new CopyResponse(obj.code, obj.msg);
  }
}
