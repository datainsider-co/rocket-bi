/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 3:51 PM
 */

import { QueryRequest } from './QueryRequest';
import { NotifyInfo, Priority, QueryOutputTemplate } from '../../Query';

export class ExecuteRequest extends QueryRequest {
  constructor(public query: string, public priority: Priority, public notifyInfo?: NotifyInfo[], public outputs?: QueryOutputTemplate[]) {
    super();
  }
}
