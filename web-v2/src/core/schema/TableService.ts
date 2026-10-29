import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { tablePath, type TableRef } from './SchemaEditService';
import { tableDefinitionFromJson, tableDefinitionToJson, type TableDefinition } from './TableDefinition';

/**
 * A table's schema as the Schema page reads and changes it (v1 `SchemaRepository`). Measures, calculated columns,
 * replacing a view's query and dropping a table are in `SchemaEditService`.
 */

/** A table made from a query (`from_query`). The server takes the columns from what the query returns. */
export interface TableFromQuery {
  readonly dbName: string;
  readonly name: string;
  readonly displayName: string;
  readonly query: string;
  /** `view` on every connector; `materialized` answers 501 on MySQL. */
  readonly tableType: string;
}

export interface TableService {
  getTable(table: TableRef, signal?: AbortSignal): Promise<TableDefinition>;
  createTable(table: TableDefinition): Promise<TableDefinition>;
  /** Changes columns in the database too: a new type converts the column, a new column is added. */
  updateTable(table: TableDefinition): Promise<TableDefinition>;
  /** Fails with a 400 when a table of that name exists. */
  createTableFromQuery(table: TableFromQuery): Promise<TableDefinition>;
}

export const TableService = token<TableService>('TableService');

/** Paths and bodies are the backend's (`SchemaController`), checked on the local stack (DW0). */
export class HttpTableService implements TableService {
  constructor(private readonly http: KyInstance) {}

  async getTable(table: TableRef, signal?: AbortSignal): Promise<TableDefinition> {
    return tableDefinitionFromJson(await this.http.get(tablePath(table), { signal }).json(), table.dbName);
  }

  async createTable(table: TableDefinition): Promise<TableDefinition> {
    const { name, columns, primary_keys = [], order_bys = [], ...json } = tableDefinitionToJson(table);
    const body = { ...json, tbl_name: name, columns, primary_keys, order_bys };
    const reply = await this.http.post(`databases/${encodeURIComponent(table.dbName)}/tables`, { json: body }).json();
    return tableDefinitionFromJson(reply, table.dbName);
  }

  async updateTable(table: TableDefinition): Promise<TableDefinition> {
    const reply = await this.http.put(tablePath(table), { json: { table_schema: tableDefinitionToJson(table) } }).json();
    return tableDefinitionFromJson(reply, table.dbName);
  }

  async createTableFromQuery(table: TableFromQuery): Promise<TableDefinition> {
    const body = {
      db_name: table.dbName,
      tbl_name: table.name,
      display_name: table.displayName,
      query: table.query,
      table_type: table.tableType,
      is_override: false
    };
    const reply = await this.http.post(`databases/${encodeURIComponent(table.dbName)}/tables/from_query`, { json: body }).json();
    return tableDefinitionFromJson(reply, table.dbName);
  }
}
