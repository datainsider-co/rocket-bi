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
  /** Every table's name, which a new table can't take. */
  readonly allTableNames: readonly string[];
  /** The Create Table name dialog is open. */
  readonly isCreateOpen: boolean;
  readonly onCreateOpenChange: (open: boolean) => void;
  readonly searchText: string;
  readonly onSearchChange: (text: string) => void;
  readonly retry: () => void;
}

/** A database's tables (`GET databases/{name}`, the tree's query), searched as the user types, and New table's dialog. */
export function useDatabasePanel(dbName: string): DatabasePanelData {
  const query = useQuery(databaseQueryOptions(useDi(SchemaService), dbName));
  const [searchText, setSearchText] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const tables = useMemo(() => filterTables(query.data?.tables ?? [], searchText), [query.data, searchText]);
  const allTableNames = useMemo(() => (query.data?.tables ?? []).map(table => table.name), [query.data]);
  return {
    status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    error: query.isError ? toErrorMessage(query.error) : '',
    tables,
    total: query.data?.tables.length ?? 0,
    allTableNames,
    isCreateOpen,
    onCreateOpenChange: setCreateOpen,
    searchText,
    onSearchChange: setSearchText,
    retry: () => void query.refetch()
  };
}
