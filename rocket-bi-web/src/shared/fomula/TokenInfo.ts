/*
 * @author: tvc12 - Thien Vi
 * @created: 10/22/21, 1:42 PM
 */

export class TokenInfo {
  databases: Set<string>;
  tables: Set<string>;
  columns: Set<string>;

  constructor() {
    this.databases = new Set<string>();
    this.tables = new Set<string>();
    this.columns = new Set<string>();
  }

  addDatabase(database: string) {
    this.databases.add(database);
  }

  addTable(table: string) {
    this.tables.add(table);
  }

  addColumn(column: string) {
    this.columns.add(column);
  }
}

export enum KeywordType {
  Keyword = 'keyword',
  Database = 'database',
  Table = 'table',
  Column = 'column',
  Source = 'source',
  Identifier = 'identifier'
}
