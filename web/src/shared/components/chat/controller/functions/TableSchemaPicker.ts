import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { Column, DatabaseInfo, DIException, TableSchema } from '@core/common/domain';
import { StringUtils } from '@/utils';

export interface ShortInfoColumn {
  name: string;
  type: string;
  description: string;
}

export interface ShortInfoTableSchema {
  database: string;
  table: string;
  columns: ShortInfoColumn[];
}

export interface ShortInfoDatabaseSchema {
  database: string;
  displayName: string;
  tables: ShortInfoTableSchema[];
}

export class TableSchemaPicker {
  /**
   * Retrieves the ShortInfoTableSchema for building a chart.
   *
   * @throws {DIException} If no database and table is selected, or if no table is selected.
   * @returns {ShortInfoTableSchema} The normalized ShortInfoTableSchema.
   */
  static get(): ShortInfoTableSchema {
    this.ensureNotIsEmptyDatabase();
    this.ensureNotIsEmptyTable();
    return this.normalizeTable(_BuilderTableSchemaStore.tableSchemas.find(schema => schema.isExpanded)!.data!);
  }

  static ensureNotIsEmptyDatabase(): void {
    if (this.isEmptyDatabase()) {
      throw new DIException('Please select database and table to build chart');
    }
  }

  static ensureNotIsEmptyTable(): void {
    if (this.isEmptyTable()) {
      throw new DIException('Please select table to build chart');
    }
  }

  static isEmptyDatabase(): boolean {
    return StringUtils.isEmpty(_BuilderTableSchemaStore.selectedDbName.trim()) || !_BuilderTableSchemaStore.databaseSchema;
  }

  static isEmptyTable(): boolean {
    const holdTableSchemaOpening = _BuilderTableSchemaStore.tableSchemas.find(schema => schema.isExpanded);
    return !holdTableSchemaOpening;
  }

  static normalizeTable(tableSchema: TableSchema): ShortInfoTableSchema {
    return {
      database: tableSchema.dbName,
      table: tableSchema.name,
      columns: tableSchema.columns.map(TableSchemaPicker.normalizeColumn)
    };
  }

  static normalizeColumn(column: Column): ShortInfoColumn {
    return {
      name: column.name,
      type: column.className,
      description: column.description ?? ''
    };
  }

  static normalizeDatabase(database: DatabaseInfo): ShortInfoDatabaseSchema {
    return {
      database: database.name,
      displayName: database.displayName,
      tables: database.tables.map(TableSchemaPicker.normalizeTable)
    };
  }
}
