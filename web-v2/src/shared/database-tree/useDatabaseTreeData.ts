import { useMemo, useState } from 'react';
import { useQueries, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { SchemaService, type DatabaseInfo, type DatabaseSchema } from '@/core/schema/SchemaService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { databaseQueryOptions, databasesQueryOptions, schemaKeys } from '@/shared/schema/schemaQueries';
import { filterDatabases, type TreeDatabase } from './databaseTree.utils';

export interface DatabaseTreeData {
  readonly status: 'loading' | 'error' | 'ready';
  readonly error: string;
  /** Every database the user can read, before the search. */
  readonly all: readonly DatabaseInfo[];
  readonly databases: readonly TreeDatabase[];
  /** Databases opened and still loading for the first time. */
  readonly loading: ReadonlySet<string>;
  /** Databases that failed to load, with the server's message. */
  readonly errors: ReadonlyMap<string, string>;
  readonly isRefreshing: boolean;
  readonly refresh: () => void;
}

const NO_DATABASES: readonly DatabaseInfo[] = [];

/** What the tree needs of each database query; stable while the queries don't change (`useQueries` `combine`). */
function combineSchemas(results: UseQueryResult<DatabaseSchema>[]) {
  return results.map(result => ({ data: result.data, error: result.isError ? toErrorMessage(result.error) : undefined }));
}

/**
 * The databases (`GET databases`) and the schema of each one opened so far (`GET databases/{name}`), through the
 * schema queries the ChartBuilder also uses. A database stays loaded once opened, so the search keeps finding its
 * tables after it is closed (v1 searched the loaded databases only).
 */
export function useDatabaseTreeData(openDatabases: ReadonlySet<string>, keyword: string): DatabaseTreeData {
  const service = useDi(SchemaService);
  const queryClient = useQueryClient();
  const [requested, setRequested] = useState<readonly string[]>(() => [...openDatabases]);
  const added = [...openDatabases].filter(name => !requested.includes(name));
  if (added.length > 0) setRequested([...requested, ...added]);

  const list = useQuery(databasesQueryOptions(service));
  const loaded = useQueries({ queries: requested.map(name => databaseQueryOptions(service, name)), combine: combineSchemas });

  const { schemas, loading, errors } = useMemo(() => {
    const byName = new Map<string, DatabaseSchema>();
    const pending = new Set<string>();
    const failed = new Map<string, string>();
    requested.forEach((name, index) => {
      const state = loaded[index];
      if (state?.data) byName.set(name, state.data);
      else if (state?.error) failed.set(name, state.error);
      else pending.add(name);
    });
    return { schemas: byName, loading: pending, errors: failed };
  }, [requested, loaded]);

  const databases = useMemo(() => filterDatabases(list.data ?? [], schemas, keyword), [list.data, schemas, keyword]);

  return {
    status: list.isPending ? 'loading' : list.isError ? 'error' : 'ready',
    error: list.isError ? toErrorMessage(list.error) : '',
    all: list.data ?? NO_DATABASES,
    databases,
    loading,
    errors,
    isRefreshing: list.isFetching && !list.isPending,
    refresh: () => void queryClient.invalidateQueries({ queryKey: schemaKeys.all })
  };
}
