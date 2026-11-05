import { EtlOperatorClassName, type EtlOperator, type SqlQueryOperator, type TableConfiguration } from '@/core/data-cook/EtlOperator';
import type { TableSchema } from '@/core/schema/SchemaService';
import { functionCompletions } from '@/features/chart-builder/field-actions/completions.utils';
import { escapeIdentifier } from '@/features/chart-builder/field-actions/formula.utils';
import type { FunctionInfo } from '@/features/chart-builder/field-actions/functionCatalog.utils';
import type { CompletionSpec, EditorLanguage } from '@/shared/code-editor/codeEditor.utils';
import { newOperatorBase } from './operators.utils';

/**
 * SQL Query (v1 `QueryTable` with the data-cook `QueryBuilder`): SQL on the table it reads, in the ETL's preview
 * database. The dialog shows it without that database (v1 `removeDatabase`); the saved SQL names it, since the server
 * runs it with no database selected (DC0).
 */

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Quoted strings are left alone: a name inside one is text.
const QUOTED = String.raw`'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"`;

/** The SQL without `db.` before its tables, as the dialog shows it. */
export function withoutDatabase(sql: string, dbName: string): string {
  if (dbName === '') return sql;
  const db = escapeRegExp(dbName);
  const pattern = new RegExp(`${QUOTED}|(?<![\\w.\`])(?:\`${db}\`|${db}(?![\\w$]))\\s*\\.\\s*`, 'g');
  return sql.replace(pattern, match => (match.startsWith("'") || match.startsWith('"') ? match : ''));
}

/**
 * The SQL with `db.` before each of `tables` (v1 `FormulaUtils.toETLQuery`). A name already qualified, a column after
 * a dot or a name in quotes stays as it is.
 */
export function withDatabase(sql: string, dbName: string, tables: readonly string[]): string {
  return tables.reduce((current, tblName) => {
    const db = escapeRegExp(dbName);
    const tbl = escapeRegExp(tblName);
    const pattern = new RegExp(`${QUOTED}|(?<![\\w.\`$])(?:(?:\`${db}\`|${db})\\s*\\.\\s*)?(?:\`${tbl}\`|${tbl}(?![\\w$\`]))`, 'g');
    const qualified = `${escapeIdentifier(dbName)}.${escapeIdentifier(tblName)}`;
    return current.replace(pattern, match => (match.startsWith("'") || match.startsWith('"') ? match : qualified));
  }, sql);
}

/** What a new SQL Query starts with: every row of the table it reads. */
export function defaultSql(table: Pick<TableSchema, 'name'>): string {
  return `select * from ${escapeIdentifier(table.name)}`;
}

export function newSqlOperator(parent: EtlOperator, destTable: TableConfiguration, query: string): SqlQueryOperator {
  return { ...newOperatorBase(EtlOperatorClassName.SqlQuery, destTable), kind: 'sql', parent, query };
}

/** The editor's suggestions: the data source's functions, the table by its name, its columns. */
export function sqlLanguage(table: TableSchema, functions: readonly FunctionInfo[]): EditorLanguage {
  const tableSpec: CompletionSpec = { label: table.name, insertText: escapeIdentifier(table.name), kind: 'table', detail: 'Table', documentation: table.displayName };
  const columns = table.columns.map(
    (column): CompletionSpec => ({ label: column.name, insertText: escapeIdentifier(column.name), kind: 'field', detail: table.name, documentation: column.displayName })
  );
  return {
    completions: [...functionCompletions(functions), tableSpec, ...columns],
    highlight: { functions: functions.map(info => info.name), fields: table.columns.map(column => column.name) }
  };
}
