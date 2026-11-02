import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { TableRef } from '@/core/schema/SchemaEditService';
import { tableSchemaFromJson, type TableSchema } from '@/core/schema/SchemaService';
import type { TableDefinition } from '@/core/schema/TableDefinition';
import { TableService } from '@/core/schema/TableService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { tableDefinitionQueryOptions } from '../../warehouseQueries';
import { SchemaTab } from '../schema.utils';

export interface TablePanelData {
  readonly status: 'loading' | 'error' | 'ready';
  readonly error: string;
  readonly table: TableDefinition | undefined;
  /** The same table as the formula dialog reads it, with its measures and calculated columns. */
  readonly schema: TableSchema | undefined;
  readonly tab: SchemaTab;
  readonly onTabChange: (tab: SchemaTab) => void;
  /** The Table Schema tab is in edit mode; the other tabs wait until it is saved or cancelled. */
  readonly editing: boolean;
  readonly onEditingChange: (editing: boolean) => void;
  /** The search of the tab's columns, cleared on another tab (v1). */
  readonly columnSearch: string;
  readonly onColumnSearchChange: (text: string) => void;
  readonly retry: () => void;
}

/** The selected table (`GET databases/{db}/tables/{tbl}`, polled while Processing), its tab, edit mode and column search. */
export function useTablePanel(ref: TableRef): TablePanelData {
  const query = useQuery(tableDefinitionQueryOptions(useDi(TableService), ref));
  const [tab, setTab] = useState<SchemaTab>(SchemaTab.Schema);
  const [editing, setEditing] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const table = query.data;
  const schema = useMemo(() => table && tableSchemaFromJson(table.json, table.dbName), [table]);
  const onTabChange = useCallback((next: SchemaTab) => {
    setTab(next);
    setColumnSearch('');
  }, []);
  return {
    status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
    error: query.isError ? toErrorMessage(query.error) : '',
    table,
    schema,
    tab,
    onTabChange,
    editing,
    onEditingChange: setEditing,
    columnSearch,
    onColumnSearchChange: setColumnSearch,
    retry: () => void query.refetch()
  };
}
