/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:18 PM
 */

import { FileBrowserResponse } from './FileBrowserResponse';

export class UploadResponse extends FileBrowserResponse {
  static fromObject(obj: any) {
    return new UploadResponse(obj.code, obj.msg);
  }
}
