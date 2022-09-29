/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:23 PM
 */

import { Column, TableSchema } from '../../model';
import { StringUtils } from '@/utils/StringUtils';

export class CreateTableRequest {
  dbName!: string;
  tblName!: string;
  columns!: Column[];
  primaryKeys!: string[];
  orderBys!: string[];
  displayName?: string;

  constructor(dbName: string, tblName: string, columns: Column[], primaryKeys: string[], orderBys: string[], displayName?: string) {
    this.dbName = dbName;
    this.tblName = tblName;
    this.columns = columns;
    this.primaryKeys = primaryKeys;
    this.orderBys = orderBys;
    this.displayName = displayName;
  }
  static withTable(table: TableSchema): CreateTableRequest {
    const name = StringUtils.normalizeTableName(table.displayName);
    return new CreateTableRequest(table.dbName, name, table.columns, [], [], table.displayName);
  }
}
