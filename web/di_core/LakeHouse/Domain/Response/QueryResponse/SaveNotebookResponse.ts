/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:27 PM
 */

import { SparkQueryResponse } from './SparkQueryResponse';
import { NotebookInfo } from '../../Query/NotebookInfo';

export class SaveNotebookResponse extends SparkQueryResponse {
  constructor(public notebookInfo?: NotebookInfo, code = 0, msg?: string | null) {
    super(code, msg);
  }

  static fromObject(obj: any) {
    return new SaveNotebookResponse(obj.data ? NotebookInfo.fromObject(obj.data) : void 0, obj.code, obj.msg);
  }
}
