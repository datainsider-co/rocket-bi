import { useCallback, useMemo, useRef, useState } from 'react';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import { toRun, type QueryRun } from '@/shared/query-result/queryResult.utils';
import { useQueryRun } from '@/shared/query-result/useQueryRun';
import { useSqlFunctions } from '../useSqlFunctions';
import { sqlLanguage, withDatabase } from '../sqlQuery.utils';

/**
 * The SQL Query dialog (v1 `QueryTable` + `QueryBuilder`): the SQL as written, without the preview database, Execute to
 * see its rows, a click on the table or a column to put its name in. `onSubmit` gets the SQL as saved.
 */
export function useSqlQueryForm(table: TableSchema, initialSql: string, onSubmit: (sql: string) => void) {
  const [sql, setSql] = useState(initialSql);
  const [run, setRun] = useState<QueryRun>();
  const [error, setError] = useState<string>();
  const editor = useRef<CodeEditorHandle>(null);
  const functions = useSqlFunctions('sql');
  const language = useMemo(() => sqlLanguage(table, functions), [table, functions]);
  const result = useQueryRun(run);
  const saved = useCallback((text: string) => withDatabase(text, table.dbName, [table.name]), [table]);

  const onChange = useCallback((text: string) => {
    setSql(text);
    setError(undefined);
  }, []);
  const execute = useCallback(() => {
    if (sql.trim() === '') return;
    setRun(previous => toRun((previous?.id ?? 0) + 1, saved(sql), []));
  }, [sql, saved]);
  const submit = useCallback(() => {
    if (sql.trim() === '') {
      setError('Please input a query');
      return;
    }
    onSubmit(saved(sql));
  }, [sql, saved, onSubmit]);
  const insert = useCallback((text: string) => editor.current?.insertText(text), []);

  return { sql, onChange, error, language, editor, result, execute, submit, insert };
}

export type SqlQueryForm = ReturnType<typeof useSqlQueryForm>;
