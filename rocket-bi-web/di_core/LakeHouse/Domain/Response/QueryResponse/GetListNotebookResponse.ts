/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { GetListResponse } from '../GetListResponse';
import { NotebookInfo } from '../../Query/NotebookInfo';

export class GetListNotebookResponse extends GetListResponse<NotebookInfo> {
  constructor(data: NotebookInfo[], total: number, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    const data = (obj.data ?? []).map((item: any) => NotebookInfo.fromObject(item));
    return new GetListNotebookResponse(data, obj.total, obj.code, obj.msg);
  }
}
