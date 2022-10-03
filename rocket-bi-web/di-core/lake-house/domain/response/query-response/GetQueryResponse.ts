/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';
import { QueryInfo } from '../../query/QueryInfo';

export class GetQueryResponse extends SparkQueryResponse {
  constructor(public data?: QueryInfo, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new GetQueryResponse(obj.data ? QueryInfo.fromObject(obj.data) : void 0, obj.code, obj.msg);
  }
}
