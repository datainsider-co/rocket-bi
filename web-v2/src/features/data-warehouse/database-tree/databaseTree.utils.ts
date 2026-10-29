import { z } from 'zod';
import type { DatabaseInfo, DatabaseSchema, SchemaColumn, TableSchema } from '@/core/schema/SchemaService';
import type { ActionItem } from '@/shared/menu/ActionMenuView';
import { toIdentifier } from '@/shared/schema/identifier.utils';

/**
 * The database tree of the Schema, Query Editor and Relationship pages (v1 `DatabaseTreeView`): every database, the
 * tables of those loaded (a database loads when it is opened), the columns of each table.
 */

/** A plain column, a calculated column (computed per row) or a measure (aggregated). */
export type ColumnRole = 'column' | 'calculated' | 'measure';

export interface TreeColumn {
  readonly name: string;
  readonly title: string;
  readonly type: string;
  readonly role: ColumnRole;
}

export interface TreeTable {
  /** Unique in the tree (`tableKey`). */
  readonly key: string;
  readonly dbName: string;
  readonly name: string;
  readonly title: string;
  readonly table: TableSchema;
  readonly columns: readonly TreeColumn[];
}

export interface TreeDatabase {
  readonly name: string;
  readonly title: string;
  /** `undefined` until the database is loaded. */
  readonly tables: readonly TreeTable[] | undefined;
  /** Shown because some of its tables match the search: it opens on them (v1). */
  readonly matchedByTable: boolean;
}

/** The database and table the page shows; their rows are highlighted. */
export interface TreeSelection {
  readonly dbName?: string | undefined;
  readonly tableName?: string | undefined;
}

/**
 * What the page does with the tree. Without `onSelectTable` a table's name opens it; without menus, rows have none.
 * Menus open with "..." or a right click (v1).
 */
export interface TreeHandlers {
  readonly onSelectDatabase?: (name: string) => void;
  readonly onSelectTable?: (table: TreeTable) => void;
  readonly onSelectColumn?: (table: TreeTable, column: TreeColumn) => void;
  readonly tableActionsOf?: (table: TreeTable) => readonly ActionItem<string>[];
  readonly onTableAction?: (table: TreeTable, action: string) => void;
  readonly columnActionsOf?: (table: TreeTable, column: TreeColumn) => readonly ActionItem<string>[];
  readonly onColumnAction?: (table: TreeTable, column: TreeColumn, action: string) => void;
  /** Tables can be dragged out (`tableDrag`), onto the Relationship canvas. */
  readonly draggableTables?: boolean;
}

/** Table names may hold any character, database names only word characters; JSON keeps the pair apart. */
export function tableKey(dbName: string, tableName: string): string {
  return JSON.stringify([dbName, tableName]);
}

const titleOf = (item: { displayName?: string | undefined; name: string }) => item.displayName || item.name;

function toColumns(columns: readonly SchemaColumn[] | undefined, role: ColumnRole): TreeColumn[] {
  return (columns ?? []).map(column => ({ name: column.name, title: titleOf(column), type: column.type, role }));
}

/** The tables of a database by title; each table's columns, then its calculated columns, then its measures. */
export function toTreeTables(schema: DatabaseSchema): TreeTable[] {
  return schema.tables
    .map(table => ({
      key: tableKey(schema.name, table.name),
      dbName: schema.name,
      name: table.name,
      title: titleOf(table),
      table,
      columns: [...toColumns(table.columns, 'column'), ...toColumns(table.calculatedColumns, 'calculated'), ...toColumns(table.expressionColumns, 'measure')]
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function matches(item: { name: string; title: string }, keyword: string): boolean {
  return item.name.toLowerCase().includes(keyword) || item.title.toLowerCase().includes(keyword);
}

/**
 * The databases to show for `keyword` (v1 `DatabaseTreeView.filter`): all without one; with one, a database whose
 * name matches with all its tables, else one with loaded tables that match, with those tables only. Tables of
 * databases not loaded yet can't match.
 */
export function filterDatabases(
  databases: readonly DatabaseInfo[],
  schemas: ReadonlyMap<string, DatabaseSchema>,
  keyword: string
): TreeDatabase[] {
  const search = keyword.trim().toLowerCase();
  return databases.flatMap((database): TreeDatabase[] => {
    const schema = schemas.get(database.name);
    const tables = schema ? toTreeTables(schema) : undefined;
    const node = { name: database.name, title: database.displayName };
    if (!search || matches(node, search)) return [{ ...node, tables, matchedByTable: false }];
    const matching = tables?.filter(table => matches(table, search)) ?? [];
    return matching.length > 0 ? [{ ...node, tables: matching, matchedByTable: true }] : [];
  });
}

/** A database shows its tables when the user opened it, or when the search found some of them. */
export function isDatabaseOpen(database: TreeDatabase, openDatabases: ReadonlySet<string>): boolean {
  return database.matchedByTable || openDatabases.has(database.name);
}

/** `keys` with `key` added, or removed when it was there. */
export function toggleKey(keys: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(keys);
  if (!next.delete(key)) next.add(key);
  return next;
}

/**
 * The name a new database gets from what was typed (v1 `StringUtils.toSnakeCase`): lowercase word characters, without
 * Vietnamese marks. The server only takes `\w+`.
 */
export function toDatabaseName(typed: string): string {
  return toIdentifier(typed).toLowerCase().replace(/^_+|_+$/g, '');
}

/** Why `typed` can't name a new database, or `undefined` when it can. */
export function databaseNameError(typed: string, existing: readonly DatabaseInfo[]): string | undefined {
  if (typed.trim() === '') return 'Database name is required';
  const name = toDatabaseName(typed);
  if (name === '') return 'Use letters or digits';
  if (/^\d/.test(name)) return 'Database name cannot start with a number';
  if (existing.some(database => database.name === name)) return `Database ${name} already exists`;
  return undefined;
}

/** The Create Database form: the name must make a new database (`databaseNameError`). */
export function createDatabaseSchema(existing: readonly DatabaseInfo[]) {
  return z.object({
    name: z.string().superRefine((value, ctx) => {
      const message = databaseNameError(value, existing);
      if (message) ctx.addIssue({ code: 'custom', message });
    })
  });
}

export type CreateDatabaseForm = z.infer<ReturnType<typeof createDatabaseSchema>>;
