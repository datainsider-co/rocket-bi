import { queryOptions } from '@tanstack/react-query';
import { QueryViewType, type QueryView, type SqlView } from '@/core/relationship/QueryView';
import type { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import type { RelationshipService } from '@/core/relationship/RelationshipService';
import type { DatabaseSchema, SchemaColumn, SchemaService } from '@/core/schema/SchemaService';
import { viewTableId, type RelationshipColumn, type TableColumns } from './relationship.utils';

export const relationshipKeys = {
  all: ['relationship'] as const,
  dashboard: (dashboardId: number) => ['relationship', 'dashboard', dashboardId] as const
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
  const dbNames = [
    ...new Set(views.flatMap(view => (view.className === QueryViewType.Table ? [view.dbName] : [])))
  ];
  const results = await Promise.allSettled(dbNames.map(dbName => schema.getDatabase(dbName)));
  return new Map(dbNames.map((dbName, index) => {
    const result = results[index];
    return [dbName, result?.status === 'fulfilled' ? result.value : undefined];
  }));
}

async function loadSqlViewColumns(schema: SchemaService, view: SqlView): Promise<RelationshipColumn[]> {
  try {
    return toColumns((await schema.detectTableSchema(view.query.query)).columns);
  } catch {
    return [];
  }
}

/**
 * The dashboard's relationships and the schema of each view: a table's from its database, a SQL view's by running
 * schema detection on its query. A schema that fails to load gives a table without columns, as in v1, so the
 * other tables still show.
 */
export async function loadRelationshipData(
  relationships: RelationshipService,
  schema: SchemaService,
  dashboardId: number
): Promise<RelationshipData> {
  const info = await relationships.getDashboardRelationship(dashboardId);
  const [databases, sqlColumns] = await Promise.all([
    loadDatabases(schema, info.views),
    Promise.all(
      info.views.map(view => (view.className === QueryViewType.Sql ? loadSqlViewColumns(schema, view) : undefined))
    )
  ]);

  const columns: Record<string, readonly RelationshipColumn[]> = {};
  info.views.forEach((view, index) => {
    columns[viewTableId(view)] =
      view.className === QueryViewType.Table
        ? tableColumns(databases.get(view.dbName), view.tblName)
        : (sqlColumns[index] ?? []);
  });
  return { info, columns };
}

export function relationshipQueryOptions(
  relationships: RelationshipService,
  schema: SchemaService,
  dashboardId: number
) {
  return queryOptions({
    queryKey: relationshipKeys.dashboard(dashboardId),
    queryFn: () => loadRelationshipData(relationships, schema, dashboardId),
    // Loaded fresh each time the editor opens (nothing is cached once it closes) and never refetched while it is
    // open: the editor copies the data into its own state, which a refetch would reset.
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });
}
