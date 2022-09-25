/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:38 PM
 */

import { QueryOutputInfo } from './QueryOutputInfo';
import { AccessType } from '../Table/TableInfo';

export class QueryOutputTemplate {
  constructor(public id: string, public ownerId: string, public accessType: AccessType, public outputName: string, public output: QueryOutputInfo) {}

  static fromObject(obj: any): QueryOutputTemplate {
    return new QueryOutputTemplate(obj.id, obj.ownerId, obj.accessType, obj.outputName, QueryOutputInfo.fromObject(obj.output));
  }
}
