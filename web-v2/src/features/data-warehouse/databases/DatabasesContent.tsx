import { Button, Spin, Typography } from 'antd';
import type { DatabaseEntry } from '@/core/schema/DatabaseService';
import type { DatabaseRowActions } from './databaseColumns';
import { DatabasesTable } from './DatabasesTable';
import type { DatabaseListing } from './useDatabaseListing';

interface DatabasesContentProps {
  listing: DatabaseListing;
  actions: DatabaseRowActions;
  onOpen: (entry: DatabaseEntry) => void;
}

/** The table, or loading, an error with Retry, or why it is empty (v1 "Your database is empty"). */
export function DatabasesContent({ listing, actions, onOpen }: DatabasesContentProps) {
  if (listing.status === 'loading') return <Spin className="mt-12 block" />;
  if (listing.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Typography.Text type="danger">{listing.error}</Typography.Text>
        <Button onClick={listing.refresh}>Retry</Button>
      </div>
    );
  }
  if (listing.rows.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-2">
        <i className="di-icon-database text-5xl opacity-40" aria-hidden />
        <Typography.Text type="secondary">{listing.total === 0 ? 'Your database is empty' : 'No databases found'}</Typography.Text>
      </div>
    );
  }
  return <DatabasesTable rows={listing.rows} isFetching={listing.isFetching} actions={actions} onOpen={onOpen} />;
}
