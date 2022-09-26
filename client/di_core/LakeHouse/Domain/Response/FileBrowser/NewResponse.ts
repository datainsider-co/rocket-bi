/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:18 PM
 */

import { FileBrowserResponse } from './FileBrowserResponse';
import { FileInfo } from '../../FileInfo/FileInfo';

export class NewResponse extends FileBrowserResponse {
  constructor(public data: FileInfo, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    const fileInfo = FileInfo.fromObject(obj.data);
    return new NewResponse(fileInfo, obj.code, obj.msg);
  }
}
