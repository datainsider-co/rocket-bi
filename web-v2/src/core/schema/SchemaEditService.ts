import type { KyInstance } from 'ky';
import { token, type DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { withoutUndefined, type JsonObject } from '@/core/json/json';
import { tableSchemaFromJson, type TableSchema } from './SchemaService';

/**
 * Changes to a database's tables from the ChartBuilder (v1 `SchemaRepository`): measures and calculated columns,
 * a view's query, dropping a table. Paths and keys are the backend's (`SchemaController`, Jackson SNAKE_CASE).
 */

/** A calculated column is computed per row (`calc_column`), a measure aggregates the rows (`expr_column`). */
export type ExpressionColumnKind = 'calculated' | 'measure';

export type TableRef = Pick<TableSchema, 'dbName' | 'name'>;

/** A measure or calculated column as the server stores it. */
export interface ExpressionColumn {
  name: string;
  displayName: string;
  /** `class_name`, from `detectExpressionType`. */
  type: string;
  expression: string;
  description?: string;
}

/** v1 `Column` of a `MaterializedExpression`, always nullable. */
export function expressionColumnToJson(column: ExpressionColumn): JsonObject {
  return withoutUndefined({
    class_name: column.type,
    name: column.name,
    display_name: column.displayName,
    description: column.description,
    is_nullable: true,
    default_expression: { default_type: 'MATERIALIZED', expr: column.expression }
  });
}

const COLUMN_PATHS: Record<ExpressionColumnKind, { column: string; detect: string }> = {
  calculated: { column: 'calc_column', detect: 'expression' },
  measure: { column: 'expr_column', detect: 'aggregate_expression' }
};

export interface SchemaEditService {
  /**
   * The type of `expression` on the table (a column's `class_name`). The server runs it, so a wrong formula fails with
   * the database's message. A measure's expression must aggregate.
   */
  detectExpressionType(table: TableRef, kind: ExpressionColumnKind, expression: string): Promise<string>;
  createColumn(table: TableRef, kind: ExpressionColumnKind, column: ExpressionColumn): Promise<TableSchema>;
  /** Replaces the column of the same name. */
  updateColumn(table: TableRef, kind: ExpressionColumnKind, column: ExpressionColumn): Promise<TableSchema>;
  deleteColumn(table: TableRef, kind: ExpressionColumnKind, columnName: string): Promise<void>;
  /**
   * Replaces a view's query (`from_query` with `is_override`). The server drops the view and creates it again from the
   * query, without its measures and calculated columns.
   */
  updateTableQuery(table: TableRef & Pick<TableSchema, 'displayName' | 'tableType'>, query: string): Promise<TableSchema>;
  /** Removes the table from the schema. */
  dropTable(table: TableRef): Promise<void>;
}

export const SchemaEditService = token<SchemaEditService>('SchemaEditService');

const tablePath = (table: TableRef) => `databases/${encodeURIComponent(table.dbName)}/tables/${encodeURIComponent(table.name)}`;

export class HttpSchemaEditService implements SchemaEditService {
  constructor(private readonly http: KyInstance) {}

  async detectExpressionType(table: TableRef, kind: ExpressionColumnKind, expression: string): Promise<string> {
    // The server answers with the type as plain text.
    const type = await this.http.post(`${tablePath(table)}/${COLUMN_PATHS[kind].detect}`, { json: { expression } }).text();
    return type.trim();
  }

  async createColumn(table: TableRef, kind: ExpressionColumnKind, column: ExpressionColumn): Promise<TableSchema> {
    const json = await this.http.post(`${tablePath(table)}/${COLUMN_PATHS[kind].column}`, { json: { column: expressionColumnToJson(column) } }).json();
    return tableSchemaFromJson(json, table.dbName);
  }

  async updateColumn(table: TableRef, kind: ExpressionColumnKind, column: ExpressionColumn): Promise<TableSchema> {
    const json = await this.http.put(`${tablePath(table)}/${COLUMN_PATHS[kind].column}`, { json: { column: expressionColumnToJson(column) } }).json();
    return tableSchemaFromJson(json, table.dbName);
  }

  async deleteColumn(table: TableRef, kind: ExpressionColumnKind, columnName: string): Promise<void> {
    await this.http.delete(`${tablePath(table)}/${COLUMN_PATHS[kind].column}/${encodeURIComponent(columnName)}`);
  }

  async updateTableQuery(table: TableRef & Pick<TableSchema, 'displayName' | 'tableType'>, query: string): Promise<TableSchema> {
    const body = {
      tbl_name: table.name,
      display_name: table.displayName || table.name,
      query,
      table_type: table.tableType,
      is_override: true
    };
    const json = await this.http.post(`databases/${encodeURIComponent(table.dbName)}/tables/from_query`, { json: withoutUndefined(body) }).json();
    return tableSchemaFromJson(json, table.dbName);
  }

  async dropTable(table: TableRef): Promise<void> {
    await this.http.delete(tablePath(table));
  }
}

export const SchemaEditModule: DiModule = di => {
  di.bindSingleton(SchemaEditService, d => new HttpSchemaEditService(d.get(ApiClient)));
};
