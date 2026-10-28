import { Alert, Button } from 'antd';
import type { SourceSortField } from '@/core/ingestion/DataSourceService';
import { DataSourcesHeader } from './DataSourcesHeader';
import { DataSourcesTable, type SourceSelection } from './DataSourcesTable';
import type { SourceRowActions } from './SourceActionsCell';
import { SourcesEmpty } from './SourcesEmpty';
import type { DataSourcesListing } from './sources.utils';

export interface DataSourcesHandlers {
  readonly onSearch: (keyword: string) => void;
  /** Refresh and Retry. */
  readonly onRefresh: () => void;
  readonly onPageChange: (page: number, pageSize: number) => void;
  readonly onSortOn: (field: SourceSortField) => void;
  readonly onAdd: () => void;
  readonly onDeleteSelected: () => void;
}

interface DataSourcesViewProps {
  listing: DataSourcesListing;
  handlers: DataSourcesHandlers;
  selection: SourceSelection;
  rowActions: SourceRowActions;
}

/** v1 `DataSourceScreen`: header, then the error, the empty state or the table. */
export function DataSourcesView({ listing, handlers, selection, rowActions }: DataSourcesViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataSourcesHeader
        isRefreshing={listing.isFetching}
        selectedCount={selection.selectedIds.length}
        onSearch={handlers.onSearch}
        onRefresh={handlers.onRefresh}
        onDeleteSelected={handlers.onDeleteSelected}
        onAdd={handlers.onAdd}
      />
      {listing.body === 'error' && (
        <Alert
          type="error"
          showIcon
          title={listing.error}
          action={
            <Button loading={listing.isFetching} onClick={handlers.onRefresh}>
              Retry
            </Button>
          }
        />
      )}
      {(listing.body === 'empty' || listing.body === 'no-match') && (
        <SourcesEmpty isSearching={listing.body === 'no-match'} onAdd={handlers.onAdd} />
      )}
      {listing.body === 'table' && (
        <DataSourcesTable
          listing={listing}
          selection={selection}
          actions={rowActions}
          onPageChange={handlers.onPageChange}
          onSortOn={handlers.onSortOn}
        />
      )}
    </div>
  );
}
