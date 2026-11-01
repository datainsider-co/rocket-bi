import { QueryViewType, type QueryView, type SqlView } from '@/core/relationship/QueryView';
import type { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import type { DatabaseSchema, SchemaColumn, SchemaService } from '@/core/schema/SchemaService';
import { viewTableId, type RelationshipColumn, type TableColumns } from './relationship.utils';

/**
 * Keys of every relationship query. A dashboard without relationships of its own reads the global ones, so saving
 * either kind makes all of them stale.
 */
export const relationshipKeys = {
  all: ['relationship'] as const,
  dashboard: (dashboardId: number) => ['relationship', 'dashboard', dashboardId] as const,
  global: ['relationship', 'global'] as const
};

/** What the editor loads: the saved relationships and the columns of every view. */
export interface RelationshipData {
  readonly info: RelationshipInfo;
  readonly columns: TableColumns;
}

function toColumns(columns: readonly SchemaColumn[]): RelationshipColumn[] {
  return columns.map(column => ({ name: column.name, type: column.type }));
}

/** Columns of a database table, sorted by display name like v1's schema store; empty if the table is gone. */
export function tableColumns(database: DatabaseSchema | undefined, tblName: string): RelationshipColumn[] {
  const table = database?.tables.find(candidate => candidate.name === tblName);
  if (!table) return [];
  return toColumns([...table.columns].sort((a, b) => a.displayName.localeCompare(b.displayName)));
}

async function loadDatabases(schema: SchemaService, views: readonly QueryView[]) {
  const dbNames = [...new Set(views.flatMap(view => (view.className === QueryViewType.Table ? [view.dbName] : [])))];
  const results = await Promise.allSettled(dbNames.map(dbName => schema.getDatabase(dbName)));
  return new Map(
    dbNames.map((dbName, index) => {
      const result = results[index];
      return [dbName, result?.status === 'fulfilled' ? result.value : undefined];
    })
  );
}

async function loadSqlViewColumns(schema: SchemaService, view: SqlView): Promise<RelationshipColumn[]> {
  try {
    return toColumns((await schema.detectTableSchema(view.query.query)).columns);
  } catch {
    return [];
  }
}

/**
 * The relationships `load` gives and the schema of each view: a table's from its database, a SQL view's by running
 * schema detection on its query. A schema that fails to load gives a table without columns, as in v1, so the
 * other tables still show.
 */
export async function loadRelationshipData(load: () => Promise<RelationshipInfo>, schema: SchemaService): Promise<RelationshipData> {
  const info = await load();
  const [databases, sqlColumns] = await Promise.all([
    loadDatabases(schema, info.views),
    Promise.all(info.views.map(view => (view.className === QueryViewType.Sql ? loadSqlViewColumns(schema, view) : undefined)))
  ]);

  const columns: Record<string, readonly RelationshipColumn[]> = {};
  info.views.forEach((view, index) => {
    columns[viewTableId(view)] = view.className === QueryViewType.Table ? tableColumns(databases.get(view.dbName), view.tblName) : (sqlColumns[index] ?? []);
  });
  return { info, columns };
}

/**
 * Loaded fresh each time an editor opens (nothing is cached once it closes) and never refetched while it is open:
 * the editor copies the data into its own state, which a refetch would reset.
 */
export const RELATIONSHIP_QUERY_DEFAULTS = {
  gcTime: 0,
  staleTime: Infinity,
  refetchOnWindowFocus: false
} as const;
