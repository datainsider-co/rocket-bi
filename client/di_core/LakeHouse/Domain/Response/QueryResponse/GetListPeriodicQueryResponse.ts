/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { GetListResponse } from '../GetListResponse';
import { PeriodicQueryInfo } from '@core/LakeHouse';

export class GetListPeriodicQueryResponse extends GetListResponse<PeriodicQueryInfo> {
  constructor(data: PeriodicQueryInfo[], total: number, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    const data = (obj.data ?? []).map((item: any) => PeriodicQueryInfo.fromObject(item));
    return new GetListPeriodicQueryResponse(data, obj.total, obj.code, obj.msg);
  }
}
