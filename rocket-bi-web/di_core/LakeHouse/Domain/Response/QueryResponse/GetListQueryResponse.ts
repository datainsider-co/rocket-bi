/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { GetListResponse } from '../GetListResponse';
import { QueryInfo } from '../../Query/QueryInfo';

export class GetListQueryResponse extends GetListResponse<QueryInfo> {
  constructor(data: QueryInfo[], total: number, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    const data = (obj.data ?? []).map((item: any) => QueryInfo.fromObject(item));
    return new GetListQueryResponse(data, obj.total, obj.code, obj.msg);
  }
}
