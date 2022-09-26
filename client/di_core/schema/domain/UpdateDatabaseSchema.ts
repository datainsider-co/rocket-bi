import { DatabaseSchema, TableSchema } from '@core/domain';

export class UpdateDatabaseSchema {
  dbSchema: DatabaseSchema;

  constructor(dbSchema: DatabaseSchema) {
    this.dbSchema = dbSchema;
  }

  withDbName(dbName: string): UpdateDatabaseSchema {
    this.dbSchema.displayName = dbName;
    return this;
  }

  withTableName(name: string, newName: string): UpdateDatabaseSchema {
    const tableToRename: TableSchema | undefined = this.dbSchema.tables.find(table => table.name === name);
    if (tableToRename) {
      tableToRename.name = newName;
    }
    return this;
  }

  withTableSchema(table: TableSchema): UpdateDatabaseSchema {
    const indexToUpdate = this.dbSchema.tables.findIndex(table => table.name === name);
    const existTable = indexToUpdate !== -1;
    if (existTable) {
      this.dbSchema.tables[indexToUpdate] = table;
    }
    return this;
  }
}
