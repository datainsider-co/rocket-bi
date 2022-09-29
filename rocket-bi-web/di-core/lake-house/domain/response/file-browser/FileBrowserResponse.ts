/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:21 PM
 */

import { LakeHouseResponse } from '../LakeHouseResponse';

export class FileBrowserResponse extends LakeHouseResponse {
  constructor(code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new FileBrowserResponse(obj.code, obj.msg);
  }
}
