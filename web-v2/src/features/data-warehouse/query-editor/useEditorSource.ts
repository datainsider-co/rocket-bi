import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { SchemaService, type TableSchema } from '@/core/schema/SchemaService';
import type { Breadcrumb } from '@/features/directory/directory.utils';
import { databaseQueryOptions } from '@/shared/schema/schemaQueries';
import { newQueryTab, tabsOfAnalysis, type AnalysisTab } from './analysis/analysis.utils';
import { useAnalysisSource, type AnalysisSourceState, type LoadedAnalysis } from './analysis/useAnalysisSource';
import { EditorMode, editorSourceOf, selectAllQuery, type EditorSource } from './queryEditor.utils';

/** What the editor opens with. */
export interface SessionStart {
  readonly tabs: readonly AnalysisTab[];
  /** The saved analysis open; none for a new query. */
  readonly analysis: LoadedAnalysis | undefined;
  /** The view whose query is edited (`?mode=update`). */
  readonly view: TableSchema | undefined;
  /** The database of the URL, where a table made of the query goes first. */
  readonly dbName: string | undefined;
}

export type EditorSourceStatus = Exclude<AnalysisSourceState, { status: 'ready' }> | { readonly status: 'ready'; readonly start: SessionStart };

export interface EditorSourceState {
  readonly source: EditorSource;
  /** Tells sources apart: the editor starts over on another one. */
  readonly key: string;
  readonly status: EditorSourceStatus;
  /** The analysis's name and folders, for the header. */
  readonly analysisName: string | undefined;
  readonly crumbs: readonly Breadcrumb[];
}

/** A new query's view name; it only names the query inside the SQL the server runs. */
const NEW_QUERY_ALIAS = 'view_query';
const viewAliasOf = (id: number) => `view_${Math.abs(id)}`;

/**
 * What the URL opens (v1 `QueryEditor.initSelectedTable`, `initAnalysis`): `select * from` the table of
 * `?database&table`, not run; a view's query for `?mode=update`, run at once; a saved analysis for `?adhoc=`, its
 * query run at once.
 */
export function useEditorSource(): EditorSourceState {
  const [params] = useSearchParams();
  const source = useMemo(() => editorSourceOf(params), [params]);
  const { mode, dbName, tableName, analysisId } = source;
  const service = useDi(SchemaService);
  const isUpdate = mode === EditorMode.UpdateTable && dbName !== undefined;
  const database = useQuery({ ...databaseQueryOptions(service, dbName ?? ''), enabled: isUpdate });
  const analysis = useAnalysisSource(mode === EditorMode.Analysis ? analysisId : undefined);
  const loaded = analysis.state.status === 'ready' ? analysis.state.analysis : undefined;

  const view = isUpdate ? database.data?.tables.find(table => table.name === tableName) : undefined;
  const tabs = useMemo((): readonly AnalysisTab[] | undefined => {
    if (mode === EditorMode.Analysis) return loaded && tabsOfAnalysis(loaded.dashboard, viewAliasOf);
    if (!dbName || !tableName) return [newQueryTab('', NEW_QUERY_ALIAS, false)];
    if (mode === EditorMode.Query) return [newQueryTab(selectAllQuery(dbName, tableName), NEW_QUERY_ALIAS, false)];
    if (database.isPending) return undefined;
    return [newQueryTab(view?.query ?? '', NEW_QUERY_ALIAS, true)];
  }, [mode, dbName, tableName, loaded, database.isPending, view]);

  const status = ((): EditorSourceStatus => {
    if (mode === EditorMode.Analysis && analysis.state.status !== 'ready') return analysis.state;
    return tabs ? { status: 'ready', start: { tabs, analysis: loaded, view, dbName } } : { status: 'loading' };
  })();

  return { source, key: JSON.stringify(source), status, analysisName: analysis.name, crumbs: analysis.crumbs };
}
