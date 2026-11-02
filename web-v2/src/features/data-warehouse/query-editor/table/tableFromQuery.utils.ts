import { z } from 'zod';
import type { QueryParameter } from '@/core/query/queryParameters';
import { inlineParameters, runnableSql } from '@/core/query/rawQuery';
import { TableKind } from '@/core/schema/TableDefinition';
import type { TableFromQuery } from '@/core/schema/TableService';
import { tableNameError, toTableName } from '../../schema/schema-edit/schemaEdit.utils';

/**
 * A table made of the query (v1 `TableCreationFromQueryModal`): a view, or a materialized table (refused on MySQL, 501).
 * The parameters' values go into the SQL, the same for Create and Update Table (v1 only put them in for Create).
 */

export const TABLE_FROM_QUERY_TYPES: readonly { value: string; label: string }[] = [
  { value: TableKind.View, label: 'View' },
  { value: TableKind.Materialized, label: 'Materialized' }
];

/** The SQL the table is made of: the values in, without a closing `;`. */
export function tableQueryOf(sql: string, parameters: readonly QueryParameter[]): string {
  return inlineParameters(runnableSql(sql), parameters);
}

export interface TableFromQueryForm {
  dbName: string;
  name: string;
  tableType: string;
}

/** The form's rules; `existingOf` gives the tables of a database when it is loaded, to refuse a name they have. */
export function tableFromQuerySchema(existingOf: (dbName: string) => readonly string[]) {
  return z
    .object({ dbName: z.string(), name: z.string(), tableType: z.string() })
    .superRefine((form, context) => {
      if (form.dbName === '') context.addIssue({ code: 'custom', path: ['dbName'], message: 'Database is required' });
      const nameError = tableNameError(form.name, existingOf(form.dbName));
      if (nameError) context.addIssue({ code: 'custom', path: ['name'], message: nameError });
    });
}

export function toTableFromQuery(form: TableFromQueryForm, query: string): TableFromQuery {
  return { dbName: form.dbName, name: toTableName(form.name), displayName: form.name.trim(), query, tableType: form.tableType };
}
