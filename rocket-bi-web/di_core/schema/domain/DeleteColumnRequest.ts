/*
 * @author: tvc12 - Thien Vi
 * @created: 5/7/21, 3:23 PM
 */

export class DeleteColumnRequest {
  dbName: string;
  tblName: string;
  columnName: string;

  constructor(dbName: string, tblName: string, columnName: string) {
    this.dbName = dbName;
    this.tblName = tblName;
    this.columnName = columnName;
  }
}
