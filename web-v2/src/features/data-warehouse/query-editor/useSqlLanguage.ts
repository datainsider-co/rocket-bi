import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { SchemaService, type DatabaseSchema } from '@/core/schema/SchemaService';
import { ALL_FUNCTIONS, functionsOf } from '@/features/chart-builder/field-actions/functionCatalog.utils';
import { useFunctionCatalog } from '@/features/chart-builder/field-actions/useFunctionCatalog';
import type { CompletionSpec, EditorLanguage } from '@/shared/code-editor/codeEditor.utils';
import { databaseQueryOptions, databasesQueryOptions, schemaKeys } from '@/shared/schema/schemaQueries';
import { completionContext, databaseToLoad, sqlCompletions } from './sqlCompletion.utils';

const NO_FUNCTIONS: never[] = [];

/**
 * The Query Editor's SQL: the data source's functions and keywords coloured, and suggestions from the schemas loaded so
 * far, read when the editor asks. `db.` loads that database first (v1 loaded every database when the page opened).
 */
export function useSqlLanguage(): EditorLanguage {
  const service = useDi(SchemaService);
  const queryClient = useQueryClient();
  const catalog = useFunctionCatalog('sql');
  const functions = useMemo(() => (catalog ? functionsOf(catalog, ALL_FUNCTIONS) : NO_FUNCTIONS), [catalog]);
  const databases = useQuery(databasesQueryOptions(service)).data;

  const completionsAt = useCallback(
    async (textBefore: string): Promise<readonly CompletionSpec[]> => {
      const context = completionContext(textBefore);
      const loaded = () => queryClient.getQueriesData<DatabaseSchema>({ queryKey: schemaKeys.anyDatabase }).flatMap(([, schema]) => (schema ? [schema] : []));
      const toLoad = databaseToLoad(context, databases ?? [], loaded());
      // A database that fails to load has nothing to suggest.
      if (toLoad) await queryClient.fetchQuery(databaseQueryOptions(service, toLoad)).catch(() => undefined);
      return sqlCompletions(context, { databases: databases ?? [], schemas: loaded(), functions });
    },
    [queryClient, service, databases, functions]
  );

  return useMemo(
    () => ({
      completions: [],
      highlight: { functions: functions.map(info => info.name), fields: [] },
      completionsAt,
      triggerCharacters: ['.', '(', ',']
    }),
    [functions, completionsAt]
  );
}
