/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 3:54 PM
 */

import { QueryRequest } from '@core/lake-house/domain/request/query/QueryRequest';

export class SparkQueryRequest extends QueryRequest {
  constructor(public queryId: string) {
    super();
  }
}
