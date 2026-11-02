import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { SchemaService } from '@/core/schema/SchemaService';
import { databaseQueryOptions } from '@/shared/schema/schemaQueries';
import { EditorMode, editorSourceOf, selectAllQuery, type EditorSource } from './queryEditor.utils';
import type { QueryEditorStart } from './useQueryEditor';

export interface EditorSourceState {
  readonly source: EditorSource;
  /** Tells sources apart: the editor starts over on another one. */
  readonly key: string;
  /** `undefined` while the view's query loads. */
  readonly start: QueryEditorStart | undefined;
}

/**
 * What the URL opens (v1 `QueryEditor.initSelectedTable`): `select * from` the table of `?database&table`, not run, or
 * a view's query for `?mode=update`, run at once. A saved analysis (`?adhoc=`) opens empty until DW11.
 */
export function useEditorSource(): EditorSourceState {
  const [params] = useSearchParams();
  const source = useMemo(() => editorSourceOf(params), [params]);
  const { mode, dbName, tableName } = source;
  const service = useDi(SchemaService);
  const isUpdate = mode === EditorMode.UpdateTable && dbName !== undefined;
  const database = useQuery({ ...databaseQueryOptions(service, dbName ?? ''), enabled: isUpdate });

  const start = useMemo((): QueryEditorStart | undefined => {
    if (mode === EditorMode.Analysis || !dbName || !tableName) return { sql: '', autoRun: false };
    if (mode === EditorMode.Query) return { sql: selectAllQuery(dbName, tableName), autoRun: false };
    if (database.isPending) return undefined;
    const query = database.data?.tables.find(table => table.name === tableName)?.query ?? '';
    return { sql: query, autoRun: true };
  }, [mode, dbName, tableName, database.isPending, database.data]);

  return { source, key: JSON.stringify(source), start };
}
