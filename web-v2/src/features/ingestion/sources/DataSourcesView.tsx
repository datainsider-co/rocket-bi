import { Alert, Button } from 'antd';
import type { SourceSortField } from '@/core/ingestion/DataSourceService';
import { DataSourcesHeader } from './DataSourcesHeader';
import { DataSourcesTable } from './DataSourcesTable';
import { SourcesEmpty } from './SourcesEmpty';
import type { DataSourcesListing } from './sources.utils';

interface DataSourcesViewProps {
  listing: DataSourcesListing;
  onSearch: (keyword: string) => void;
  /** Refresh and Retry. */
  onRefresh: () => void;
  onPageChange: (page: number, pageSize: number) => void;
  onSortOn: (field: SourceSortField) => void;
}

/** v1 `DataSourceScreen`: header, then the error, the empty state or the table. */
export function DataSourcesView({ listing, onSearch, onRefresh, onPageChange, onSortOn }: DataSourcesViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataSourcesHeader isRefreshing={listing.isFetching} onSearch={onSearch} onRefresh={onRefresh} />
      {listing.body === 'error' && (
        <Alert
          type="error"
          showIcon
          title={listing.error}
          action={
            <Button loading={listing.isFetching} onClick={onRefresh}>
              Retry
            </Button>
          }
        />
      )}
      {(listing.body === 'empty' || listing.body === 'no-match') && (
        <SourcesEmpty isSearching={listing.body === 'no-match'} />
      )}
      {listing.body === 'table' && (
        <DataSourcesTable
          rows={listing.rows}
          total={listing.total}
          state={listing.state}
          isLoading={listing.isFetching}
          onPageChange={onPageChange}
          onSortOn={onSortOn}
        />
      )}
    </div>
  );
}
