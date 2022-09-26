/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:23 PM
 */

import { TableInfo } from '../../Table/TableInfo';
import { GetListResponse } from '../GetListResponse';

export class ListTableResponse extends GetListResponse<TableInfo> {
  constructor(data: TableInfo[], total: number, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    const data = (obj.data ?? []).map((item: any) => TableInfo.fromObject(item));
    return new ListTableResponse(data, obj.total, obj.code, obj.msg);
  }
}
