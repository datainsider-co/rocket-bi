/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:18 PM
 */

import { FileBrowserResponse } from './FileBrowserResponse';

export class GetPathResponse extends FileBrowserResponse {
  constructor(public path: string, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new GetPathResponse(obj.path, obj.code, obj.msg);
  }
}
