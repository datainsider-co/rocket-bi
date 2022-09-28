/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:21 PM
 */

import { FileInfo } from '../../FileInfo/FileInfo';
import { GetListResponse } from '../GetListResponse';

export class GetListFileResponse extends GetListResponse<FileInfo> {
  constructor(data: FileInfo[], fullPath: string, total: number, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    const fileInfos: FileInfo[] = (obj.data ?? []).map((user: any) => FileInfo.fromObject(user));
    return new GetListFileResponse(fileInfos, obj.fullPath, obj.total, obj.code, obj.msg);
  }
}
