import type { TableSchema } from '@/core/schema/SchemaService';
import { escapeIdentifier } from './formula.utils';
import type { FunctionInfo } from './functionCatalog.utils';

/**
 * What the code editor suggests and colours, without Monaco's types (v1 `FormulaUtils.createSuggest*`, the
 * `MonacoFormulaController`s): kept as data so it is tested here and the editor stays a thin chunk.
 */

export type CompletionKind = 'function' | 'field' | 'table';

export interface CompletionSpec {
  readonly label: string;
  readonly insertText: string;
  readonly kind: CompletionKind;
  readonly detail?: string;
  readonly documentation?: string;
}

/** Words the editor colours: function names, and the names it shows as columns. */
export interface Highlight {
  readonly functions: readonly string[];
  readonly fields: readonly string[];
}

export interface EditorLanguage {
  readonly completions: readonly CompletionSpec[];
  readonly highlight: Highlight;
}

export function functionCompletions(functions: readonly FunctionInfo[]): CompletionSpec[] {
  return functions.map(info => ({ label: info.name, insertText: info.name, kind: 'function', detail: info.title, documentation: info.description }));
}

/** A calculated column's columns, written `[Display Name]`. */
function displayNameCompletions(table: TableSchema): CompletionSpec[] {
  return table.columns.map(column => ({ label: column.displayName, insertText: `[${column.displayName}]`, kind: 'field', detail: 'Field', documentation: `Field ${column.displayName}` }));
}

/** A measure's columns, written by name as SQL reads them. */
function columnCompletions(table: TableSchema): CompletionSpec[] {
  const source = `${table.dbName}.${table.displayName || table.name}`;
  return table.columns.map(column => ({ label: column.name, insertText: escapeIdentifier(column.name), kind: 'field', detail: source, documentation: `Column ${column.displayName}` }));
}

/** The editor of a measure's or calculated column's formula on `table` (v1 `MeasureController`, `CalculatedFieldController`). */
export function formulaLanguage(kind: 'calculated' | 'measure', table: TableSchema, functions: readonly FunctionInfo[]): EditorLanguage {
  const fields = kind === 'calculated' ? displayNameCompletions(table) : columnCompletions(table);
  return {
    completions: [...functionCompletions(functions), ...fields],
    highlight: { functions: functions.map(info => info.name), fields: kind === 'calculated' ? [] : table.columns.map(column => column.name) }
  };
}

/**
 * The editor of a view's query: the database's tables (`db.table`) and their columns, and every function and keyword
 * (v1 `MonacoFormulaControllerImpl`, without its suggestions by position).
 */
export function queryLanguage(dbName: string, tables: readonly TableSchema[], functions: readonly FunctionInfo[]): EditorLanguage {
  const tableCompletions: CompletionSpec[] = tables.map(table => ({
    label: `${dbName}.${table.name}`,
    insertText: `${escapeIdentifier(dbName)}.${escapeIdentifier(table.name)}`,
    kind: 'table',
    detail: 'Table'
  }));
  const columns = [...new Map(tables.flatMap(columnCompletions).map(spec => [spec.label, spec])).values()];
  return {
    completions: [...functionCompletions(functions), ...tableCompletions, ...columns],
    highlight: { functions: functions.map(info => info.name), fields: columns.map(spec => spec.label) }
  };
}
