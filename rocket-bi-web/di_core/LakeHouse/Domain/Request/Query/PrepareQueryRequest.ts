/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 3:48 PM
 */

import { QueryRequest } from './QueryRequest';

export abstract class PrepareQueryRequest extends QueryRequest {
  protected constructor(public query: string) {
    super();
  }
}
