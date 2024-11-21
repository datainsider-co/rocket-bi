/*
 * @author: tvc12 - Thien Vi
 * @created: 4/19/21, 5:57 PM
 */

import { Column } from '@core/common/domain/model';

export class CreateColumnRequest {
  public constructor(public dbName: string, public tblName: string, public column: Column) {}
}
