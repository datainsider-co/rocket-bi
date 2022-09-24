/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';
import { QueryInfo } from '../../Query/QueryInfo';

export class GetNotebookResponse extends SparkQueryResponse {
  constructor(public data?: QueryInfo, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new GetNotebookResponse(obj.data ? QueryInfo.fromObject(obj.data) : void 0, obj.code, obj.msg);
  }
}
