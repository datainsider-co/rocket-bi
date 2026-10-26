import type { KyInstance } from 'ky';
import { token, type DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';

/**
 * Database schemas (v1 `di-core/schema`, `GET databases/{name}`). Only what the dashboard needs so far: the columns of
 * each table. The schema keeps a column's type in `class_name`.
 */

export interface SchemaColumn {
  name: string;
  displayName: string;
  /** `string`, `int32`, `datetime`, ...: what a `table_field` stores as `field_type`. */
  type: string;
}

export interface TableSchema {
  dbName: string;
  name: string;
  columns: SchemaColumn[];
}

export interface DatabaseSchema {
  name: string;
  tables: TableSchema[];
}

function columnFromJson(value: unknown): SchemaColumn {
  const json = asRecord(value);
  const name = asString(json['name']);
  return { name, displayName: asString(json['display_name']) || name, type: asString(json['class_name']) };
}

export function databaseSchemaFromJson(value: unknown): DatabaseSchema {
  const json = asRecord(value);
  const name = asString(json['name']);
  return {
    name,
    tables: asArray(json['tables']).map(table => {
      const tableJson = asRecord(table);
      return { dbName: asString(tableJson['db_name'], name), name: asString(tableJson['name']), columns: asArray(tableJson['columns']).map(columnFromJson) };
    })
  };
}

/** A column as a query setting refers to it (backend `TableField`). */
export function tableField(table: Pick<TableSchema, 'dbName' | 'name'>, column: SchemaColumn): JsonObject {
  return { class_name: 'table_field', db_name: table.dbName, tbl_name: table.name, field_name: column.name, field_type: column.type };
}

export interface SchemaService {
  getDatabase(dbName: string, signal?: AbortSignal): Promise<DatabaseSchema>;
}

export const SchemaService = token<SchemaService>('SchemaService');

export class HttpSchemaService implements SchemaService {
  constructor(private readonly http: KyInstance) {}

  async getDatabase(dbName: string, signal?: AbortSignal): Promise<DatabaseSchema> {
    return databaseSchemaFromJson(await this.http.get(`databases/${encodeURIComponent(dbName)}`, { signal }).json());
  }
}

export const SchemaModule: DiModule = di => {
  di.bindSingleton(SchemaService, d => new HttpSchemaService(d.get(ApiClient)));
};
