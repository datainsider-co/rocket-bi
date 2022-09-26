import { TableSchema } from '@core/domain/Model';
import { DatabaseInfo } from './DatabaseInfo';
import { StringUtils } from '@/utils/string.utils';

export class DatabaseSchema extends DatabaseInfo {
  name!: string;
  organizationId!: number;
  displayName!: string;
  tables!: TableSchema[];

  constructor(name: string, organizationId: number, displayName: string, tables: TableSchema[], createdTime?: number, updatedTime?: number) {
    super(name, organizationId, displayName, createdTime, updatedTime);
    this.tables = tables;
  }

  static fromObject(obj: DatabaseSchema): DatabaseSchema {
    const tables = obj.tables?.map(o => TableSchema.fromObject(o)) ?? [];
    const sortedTables = tables.sort((tbl1: TableSchema, tbl2: TableSchema) => tbl1.displayName.localeCompare(tbl2.displayName));
    return new DatabaseSchema(obj.name, obj.organizationId, obj.displayName, sortedTables, obj.createdTime, obj.updatedTime);
  }

  get keyword() {
    return [this.displayName, this.name, ...this.tables.map(t => t.displayName), ...this.tables.map(t => t.name)].join('|');
  }

  static etlDatabase(dbName: string, displayName: string, tables: TableSchema[]): DatabaseSchema {
    return new DatabaseSchema(dbName, 0, displayName, tables);
  }

  static adhoc(tableSchema: TableSchema): DatabaseSchema {
    return new DatabaseSchema(tableSchema.dbName, tableSchema.organizationId, 'Adhoc Analysis Database', [tableSchema]);
  }

  searchTables(keyword: string): TableSchema[] {
    return this.tables.filter(table => StringUtils.isIncludes(keyword, table.displayName || table.name));
  }

  setTables(tables: TableSchema[]) {
    this.tables = tables;
  }
}
