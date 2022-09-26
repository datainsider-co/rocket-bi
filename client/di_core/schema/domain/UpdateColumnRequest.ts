/*
 * @author: tvc12 - Thien Vi
 * @created: 5/7/21, 2:57 PM
 */

import { Column } from '@core/domain/Model';

export class UpdateColumnRequest {
  dbName: string;
  tblName: string;
  column: Column;

  constructor(dbName: string, tblName: string, column: Column) {
    this.dbName = dbName;
    this.tblName = tblName;
    this.column = column;
  }
}
