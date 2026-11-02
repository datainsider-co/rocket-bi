import type { DatabaseInfo, DatabaseSchema, SchemaColumn, TableSchema } from '@/core/schema/SchemaService';
import { functionCompletions } from '@/features/chart-builder/field-actions/completions.utils';
import { escapeIdentifier } from '@/features/chart-builder/field-actions/formula.utils';
import type { FunctionInfo } from '@/features/chart-builder/field-actions/functionCatalog.utils';
import type { CompletionSpec } from '@/shared/code-editor/codeEditor.utils';

/**
 * What the Query Editor suggests where the cursor is (v1 `QueryFormulaController`): every function, database, table
 * and column it knows anywhere, and after `db.` or `table.` only what that name holds. It knows the databases opened so
 * far (in the tree or after `db.`); v1 loaded every database when the page opened.
 */

/** Anything at all, or the members of the names before the dot (`db.`, `db.table.`, `table.`). */
export type CompletionContext = { readonly kind: 'any' } | { readonly kind: 'member'; readonly path: readonly string[] };

export interface SqlSchema {
  readonly databases: readonly DatabaseInfo[];
  /** The databases loaded with their tables. */
  readonly schemas: readonly DatabaseSchema[];
  readonly functions: readonly FunctionInfo[];
}

const NAME = '(?:`[^`]*`|\\w+)';
const MEMBER_PATH = new RegExp(`((?:${NAME}\\.)+)\\w*$`);
const NAME_PART = /`([^`]*)`|(\w+)/g;

/** The context of the word being typed at the end of `textBefore` (the line up to the cursor). */
export function completionContext(textBefore: string): CompletionContext {
  const path = MEMBER_PATH.exec(textBefore)?.[1];
  if (!path) return { kind: 'any' };
  return { kind: 'member', path: Array.from(path.matchAll(NAME_PART), match => match[1] ?? match[2] ?? '') };
}

/** The database `db.` names, when it is one that isn't loaded yet: it loads before suggesting its tables. */
export function databaseToLoad(context: CompletionContext, databases: readonly DatabaseInfo[], schemas: readonly DatabaseSchema[]): string | undefined {
  const name = context.kind === 'member' ? context.path[0] : undefined;
  if (name === undefined || !databases.some(database => database.name === name)) return undefined;
  return schemas.some(schema => schema.name === name) ? undefined : name;
}

function queryableColumns(table: TableSchema): SchemaColumn[] {
  return [...table.columns, ...(table.calculatedColumns ?? [])];
}

/** Columns by name, once each: a name in several tables is suggested once (v1 listed it per table). */
function columnCompletions(tables: readonly TableSchema[]): CompletionSpec[] {
  const byName = new Map<string, CompletionSpec>();
  for (const table of tables) {
    for (const column of queryableColumns(table)) {
      if (byName.has(column.name)) continue;
      byName.set(column.name, { label: column.name, insertText: escapeIdentifier(column.name), kind: 'field', detail: `${table.dbName}.${table.name}`, documentation: column.displayName });
    }
  }
  return [...byName.values()];
}

function tableCompletion(table: TableSchema, qualified: boolean): CompletionSpec {
  const name = escapeIdentifier(table.name);
  return {
    label: qualified ? `${table.dbName}.${table.name}` : table.name,
    insertText: qualified ? `${escapeIdentifier(table.dbName)}.${name}` : name,
    kind: 'table',
    detail: qualified ? 'Table' : `Table of ${table.dbName}`,
    documentation: table.displayName
  };
}

function memberCompletions(path: readonly string[], { databases, schemas }: SqlSchema): CompletionSpec[] {
  const [first, second] = path;
  const database = schemas.find(schema => schema.name === first);
  if (path.length === 1 && databases.some(item => item.name === first)) return (database?.tables ?? []).map(table => tableCompletion(table, false));
  if (path.length === 2 && database) return columnCompletions(database.tables.filter(table => table.name === second));
  if (path.length === 1) return columnCompletions(schemas.flatMap(schema => schema.tables).filter(table => table.name === first));
  return [];
}

export function sqlCompletions(context: CompletionContext, schema: SqlSchema): CompletionSpec[] {
  if (context.kind === 'member') return memberCompletions(context.path, schema);
  const tables = schema.schemas.flatMap(item => item.tables);
  return [
    ...functionCompletions(schema.functions),
    ...schema.databases.map((database): CompletionSpec => ({ label: database.name, insertText: escapeIdentifier(database.name), kind: 'database', detail: 'Database' })),
    ...tables.map(table => tableCompletion(table, true)),
    ...columnCompletions(tables)
  ];
}
