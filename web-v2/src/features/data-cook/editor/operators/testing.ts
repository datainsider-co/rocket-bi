import type { TableSchema } from '@/core/schema/SchemaService';

/** Test-only: a table of the preview database. */
export function previewTable(name: string, columns: readonly [string, string][] = [['region', 'string'], ['cnt', 'int64']]): TableSchema {
  return { dbName: 'preview_etl_2', name, displayName: name, columns: columns.map(([column, type]) => ({ name: column, displayName: column, type })) };
}
