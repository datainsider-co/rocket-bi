/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:26 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';

export class DeleteNotebookResponse extends SparkQueryResponse {
  static fromObject(obj: any) {
    return new DeleteNotebookResponse(obj.code, obj.msg);
  }
}
