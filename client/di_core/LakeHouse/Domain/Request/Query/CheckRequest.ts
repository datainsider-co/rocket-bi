/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 3:49 PM
 */

import { PrepareQueryRequest } from './PrepareQueryRequest';
import { QueryOutputTemplate } from '../../Query/QueryOutputTemplate';

export class CheckRequest extends PrepareQueryRequest {
  constructor(query: string, public outputs?: QueryOutputTemplate[]) {
    super(query);
  }
}
