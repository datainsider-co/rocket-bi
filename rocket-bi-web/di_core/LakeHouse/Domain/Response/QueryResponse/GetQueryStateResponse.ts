/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';

export class GetQueryStateResponse extends SparkQueryResponse {
  static fromObject(obj: any) {
    return new GetQueryStateResponse(obj.code, obj.msg);
  }
}
