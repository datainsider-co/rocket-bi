/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:18 PM
 */

import { FileBrowserResponse } from './FileBrowserResponse';
import { FileInfo } from '../../file-info/FileInfo';

export class GetInfoResponse extends FileBrowserResponse {
  constructor(public readonly data: FileInfo, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    const data = FileInfo.fromObject(obj.data);
    return new GetInfoResponse(data, obj.code, obj.msg);
  }
}
