/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:26 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';

export class CancelQueryResponse extends SparkQueryResponse {
  static fromObject(obj: any) {
    return new CancelQueryResponse(obj.code, obj.msg);
  }
}
