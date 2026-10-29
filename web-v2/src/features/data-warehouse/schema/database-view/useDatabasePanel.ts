import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { SchemaService, type TableSchema } from '@/core/schema/SchemaService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { databaseQueryOptions } from '@/shared/schema/schemaQueries';
import { filterTables } from '../schema.utils';

export interface DatabasePanelData {
  readonly status: 'loading' | 'error' | 'ready';
  readonly error: string;
  readonly tables: readonly TableSchema[];
  readonly total: number;
  readonly searchText: string;
  readonly onSearchChange: (text: string) => void;
  readonly retry: () => void;
}

/** A database's tables (`GET databases/{name}`, the tree's query), searched as the user types. */
export function useDatabasePanel(dbName: string): DatabasePanelData {
  const query = useQuery(databaseQueryOptions(useDi(SchemaService), dbName));
  const [searchText, setSearchText] = useState('');
  const tables = useMemo(() => filterTables(query.data?.tables ?? [], searchText), [query.data, searchText]);
  return {
    status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    error: query.isError ? toErrorMessage(query.error) : '',
    tables,
    total: query.data?.tables.length ?? 0,
    searchText,
    onSearchChange: setSearchText,
    retry: () => void query.refetch()
  };
}
