import { TableSchema } from '@core/common/domain/model';
import { StringUtils } from '@/utils/StringUtils';

export class DatabaseInfo {
  name!: string;
  organizationId!: number;
  displayName!: string;
  tables!: TableSchema[];
  createdTime?: number;
  updatedTime?: number;

  constructor(name: string, organizationId: number, displayName: string, tables: TableSchema[], createdTime?: number, updatedTime?: number) {
    this.tables = tables;
    this.name = name;
    this.organizationId = organizationId;
    this.displayName = displayName;
    this.createdTime = createdTime;
    this.updatedTime = updatedTime;
  }

  static fromObject(obj: DatabaseInfo): DatabaseInfo {
    const tables = obj.tables?.map(o => TableSchema.fromObject(o)) ?? [];
    const sortedTables = tables.sort((tbl1: TableSchema, tbl2: TableSchema) => tbl1.displayName.localeCompare(tbl2.displayName));
    return new DatabaseInfo(obj.name, obj.organizationId, obj.displayName, sortedTables, obj.createdTime, obj.updatedTime);
  }

  get keyword() {
    return [this.displayName, this.name, ...this.tables.map(t => t.displayName), ...this.tables.map(t => t.name)].join('|');
  }

  static etlDatabase(dbName: string, displayName: string, tables: TableSchema[]): DatabaseInfo {
    return new DatabaseInfo(dbName, 0, displayName, tables);
  }

  static adhoc(tableSchema: TableSchema): DatabaseInfo {
    return new DatabaseInfo(tableSchema.dbName, tableSchema.organizationId, 'Adhoc Analysis Database', [tableSchema]);
  }

  searchTables(keyword: string): TableSchema[] {
    return this.tables.filter(table => StringUtils.isIncludes(keyword, table.displayName || table.name));
  }

  setTables(tables: TableSchema[]) {
    this.tables = tables;
  }

  findTable(tableName: string): TableSchema | undefined {
    return this.tables.find(tbl => tbl.name === tableName) ?? void 0;
  }
}
