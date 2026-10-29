import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { DatabaseService, type DatabaseEntry } from '@/core/schema/DatabaseService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { databaseEntriesQueryOptions } from '../warehouseQueries';
import { filterDatabaseEntries } from './databases.utils';

export interface DatabaseListing {
  readonly status: 'loading' | 'error' | 'ready';
  readonly error: string;
  /** The databases matching the search. */
  readonly rows: readonly DatabaseEntry[];
  /** Databases before the search, to tell an empty warehouse from an empty search. */
  readonly total: number;
  readonly isFetching: boolean;
  readonly refresh: () => void;
  readonly searchText: string;
  readonly onSearchChange: (text: string) => void;
}

/** Every database (`databases/my_data`), searched in the browser as the user types (v1). */
export function useDatabaseListing(): DatabaseListing {
  const service = useDi(DatabaseService);
  const query = useQuery(databaseEntriesQueryOptions(service));
  const [searchText, setSearchText] = useState('');
  const rows = useMemo(() => filterDatabaseEntries(query.data ?? [], searchText), [query.data, searchText]);
  const { refetch } = query;

  return {
    status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    error: query.isError ? toErrorMessage(query.error) : '',
    rows,
    total: query.data?.length ?? 0,
    isFetching: query.isFetching,
    refresh: () => void refetch(),
    searchText,
    onSearchChange: setSearchText
  };
}
