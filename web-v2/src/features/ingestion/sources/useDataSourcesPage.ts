import { useMemo } from 'react';
import type { DataSource } from '@/core/ingestion/DataSource';
import { useRowSelection } from '../listing/useRowSelection';
import { sourceRowKey } from './sources.utils';
import { useDataSources } from './useDataSources';
import { useSourceActions } from './useSourceActions';
import { useSourceDialogs } from './useSourceDialogs';

/** Everything the Data Sources page shows and does: the listing, checked rows, row and header actions, modals. */
export function useDataSourcesPage() {
  const { listing, search, refresh, setPage, sortOn } = useDataSources();
  const pageIds = useMemo(() => listing.rows.map(sourceRowKey), [listing.rows]);
  const selection = useRowSelection(pageIds);
  const { confirmDelete } = useSourceActions();
  const dialogs = useSourceDialogs();
  const selectedSources = listing.rows.filter(row => selection.selectedIds.includes(row.source.id)).map(row => row.source);

  return {
    listing,
    handlers: {
      onSearch: search,
      onRefresh: refresh,
      onPageChange: setPage,
      onSortOn: sortOn,
      onAdd: dialogs.openCatalog,
      onDeleteSelected: () => confirmDelete(selectedSources)
    },
    selection: { selectedIds: selection.selectedIds, onChange: selection.setSelected },
    rowActions: { onEdit: dialogs.edit, onDelete: (source: DataSource) => confirmDelete([source]), onCreateJob: dialogs.createJob },
    dialogs
  };
}
