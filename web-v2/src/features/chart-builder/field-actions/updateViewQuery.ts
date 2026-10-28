import type { SchemaEditService } from '@/core/schema/SchemaEditService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { expressionColumnsOf } from './fieldActions.utils';

export interface ViewQueryUpdate {
  readonly table: TableSchema;
  /** Display names of the measures and calculated columns the new query can't keep. */
  readonly lost: readonly string[];
}

/**
 * Replaces a view's query (v1 `UpdateTableByQueryModal`). The server recreates the view without its measures and
 * calculated columns (v1 lost them silently), so each is created again on the new view, with its type checked again;
 * those whose formula no longer runs are reported.
 */
export async function updateViewQuery(edit: SchemaEditService, table: TableSchema, query: string): Promise<ViewQueryUpdate> {
  let updated = await edit.updateTableQuery(table, query.trim());
  const lost: string[] = [];
  for (const { kind, column } of expressionColumnsOf(table)) {
    const expression = column.expression ?? '';
    try {
      const type = await edit.detectExpressionType(table, kind, expression);
      updated = await edit.createColumn(table, kind, { name: column.name, displayName: column.displayName, type, expression, description: column.description });
    } catch {
      lost.push(column.displayName);
    }
  }
  return { table: updated, lost };
}
