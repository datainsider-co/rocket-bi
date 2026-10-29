import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { TableRef } from '@/core/schema/SchemaEditService';
import type { ColumnDefinition, TableDefinition } from '@/core/schema/TableDefinition';
import { TableService } from '@/core/schema/TableService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { tableDefinitionQueryOptions } from '../../warehouseQueries';
import { filterColumns, SchemaTab } from '../schema.utils';

export interface TablePanelData {
  readonly status: 'loading' | 'error' | 'ready';
  readonly error: string;
  readonly table: TableDefinition | undefined;
  readonly tab: SchemaTab;
  readonly onTabChange: (tab: SchemaTab) => void;
  /** The Table Schema tab's columns, after the search. */
  readonly columns: readonly ColumnDefinition[];
  readonly columnSearch: string;
  readonly onColumnSearchChange: (text: string) => void;
  readonly retry: () => void;
}

/** The selected table (`GET databases/{db}/tables/{tbl}`, polled while Processing), its tab and column search. */
export function useTablePanel(ref: TableRef): TablePanelData {
  const query = useQuery(tableDefinitionQueryOptions(useDi(TableService), ref));
  const [tab, setTab] = useState<SchemaTab>(SchemaTab.Schema);
  const [columnSearch, setColumnSearch] = useState('');
  const columns = useMemo(() => filterColumns(query.data?.columns ?? [], columnSearch), [query.data, columnSearch]);
  return {
    status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    error: query.isError ? toErrorMessage(query.error) : '',
    table: query.data,
    tab,
    onTabChange: setTab,
    columns,
    columnSearch,
    onColumnSearchChange: setColumnSearch,
    retry: () => void query.refetch()
  };
}
