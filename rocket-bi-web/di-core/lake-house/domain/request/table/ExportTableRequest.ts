/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 5:37 PM
 */

import { QueryOutputTemplate } from '../../query/QueryOutputTemplate';

export class ExportTableRequest {
  constructor(public tableName: string, public outputs: QueryOutputTemplate[]) {}
}
