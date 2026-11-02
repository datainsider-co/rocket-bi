import { useCallback, useRef, useState, type RefObject } from 'react';
import type { ExportType } from '@/core/query/QueryService';
import type { QueryParameter } from '@/core/query/queryParameters';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import type { EditorLanguage } from '@/shared/code-editor/codeEditor.utils';
import { sqlToRun, toRun } from './queryEditor.utils';
import { useQueryParameters, type QueryParameters } from './useQueryParameters';
import { useQueryRun, type QueryResult } from './useQueryRun';
import { useResultExport } from './useResultExport';
import { useSqlLanguage } from './useSqlLanguage';

export interface QueryEditorStart {
  readonly sql: string;
  /** Runs as the page opens (v1, for a view's query to update). */
  readonly autoRun: boolean;
}

export interface QueryEditorModel {
  readonly sql: string;
  readonly onSqlChange: (sql: string) => void;
  readonly language: EditorLanguage;
  readonly parameters: QueryParameters;
  readonly result: QueryResult;
  /** Runs the selected SQL, or all of it (v1 Execute, Ctrl/Cmd+Enter). */
  readonly onExecute: () => void;
  readonly onDownload: (type: ExportType) => void;
}

/** The Query Editor's text, its parameters, Execute and the result. */
export function useQueryEditor(start: QueryEditorStart, editorRef: RefObject<CodeEditorHandle | null>): QueryEditorModel {
  const [sql, setSql] = useState(start.sql);
  const runId = useRef(0);
  const runner = useQueryRun(start.autoRun && start.sql.trim() ? toRun(0, start.sql, []) : undefined);
  const language = useSqlLanguage();
  const { execute } = runner;

  const rerun = useCallback(
    (parameters: readonly QueryParameter[], text: string) => {
      const run = sqlToRun(text, editorRef.current?.selectedText() ?? '');
      if (run.trim() === '') return;
      runId.current += 1;
      execute(toRun(runId.current, run, parameters));
    },
    [editorRef, execute]
  );
  const insert = useCallback((text: string) => editorRef.current?.insertText(text), [editorRef]);
  const parameters = useQueryParameters({ sql, setSql, insert, rerun });
  const download = useResultExport(runner.result.run);

  return {
    sql,
    onSqlChange: setSql,
    language,
    parameters,
    result: runner.result,
    onExecute: () => rerun(parameters.current, sql),
    onDownload: type => void download(type)
  };
}
