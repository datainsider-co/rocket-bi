import { useCallback, type RefObject } from 'react';
import type { ExportType } from '@/core/query/QueryService';
import type { QueryParameter } from '@/core/query/queryParameters';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import type { EditorLanguage } from '@/shared/code-editor/codeEditor.utils';
import type { AnalysisTab } from './analysis/analysis.utils';
import type { TabEdit } from './analysis/analysisTabs';
import { sqlToRun, toRun } from './queryEditor.utils';
import { useQueryParameters, type QueryParameters } from './useQueryParameters';
import { useQueryRun, type QueryResult } from './useQueryRun';
import { useResultExport } from './useResultExport';
import { useSqlLanguage } from './useSqlLanguage';

export interface QueryEditorModel {
  readonly sql: string;
  readonly onSqlChange: (sql: string) => void;
  readonly language: EditorLanguage;
  readonly parameters: QueryParameters;
  /** The query tab's result; a chart tab shows its chart instead. */
  readonly result: QueryResult;
  /** Runs the selected SQL, or all of it (v1 Execute, Ctrl/Cmd+Enter). */
  readonly onExecute: () => void;
  readonly onDownload: (type: ExportType) => void;
}

/**
 * One tab's SQL, its parameters and Execute (v1 `QueryComponent`). The text, the definitions and the last run live in
 * the tab, so they are there again when the tab is shown again; the values picked on the bar start over, as in v1.
 */
export function useQueryEditor(tab: AnalysisTab, onEdit: (edit: TabEdit) => void, editorRef: RefObject<CodeEditorHandle | null>): QueryEditorModel {
  const language = useSqlLanguage();
  const lastRunId = tab.run?.id ?? 0;
  const rerun = useCallback(
    (parameters: readonly QueryParameter[], text: string) => {
      const sql = sqlToRun(text, editorRef.current?.selectedText() ?? '');
      // A new id each time: the same SQL asks the server again.
      if (sql.trim() !== '') onEdit({ run: toRun(lastRunId + 1, sql, parameters) });
    },
    [editorRef, onEdit, lastRunId]
  );
  const setSql = useCallback((sql: string) => onEdit({ sql }), [onEdit]);
  const setStored = useCallback((parameters: readonly QueryParameter[]) => onEdit({ parameters }), [onEdit]);
  const insert = useCallback((text: string) => editorRef.current?.insertText(text), [editorRef]);
  const parameters = useQueryParameters({ sql: tab.sql, setSql, stored: tab.parameters, setStored, insert, rerun });
  const result = useQueryRun(tab.kind === 'query' ? tab.run : undefined);
  const download = useResultExport(result.run);

  return {
    sql: tab.sql,
    onSqlChange: setSql,
    language,
    parameters,
    result,
    onExecute: () => rerun(parameters.current, tab.sql),
    onDownload: type => void download(type)
  };
}
