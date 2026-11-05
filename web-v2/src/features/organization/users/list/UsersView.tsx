import { Alert, Button, Empty } from 'antd';
import { UsersHeader, type UsersHeaderActions } from './UsersHeader';
import { UsersTable } from './UsersTable';
import type { UsersListing } from './useUsers';

export interface UsersHandlers {
  readonly onSearch: (keyword: string) => void;
  /** Refresh and Retry. */
  readonly onRefresh: () => void;
  readonly onPageChange: (page: number, pageSize: number) => void;
  readonly onOpen: (username: string) => void;
}

interface UsersViewProps {
  listing: UsersListing;
  handlers: UsersHandlers;
  actions: UsersHeaderActions;
}

/** v1 `UserManagement.vue`: header, then the error, "Users not found" or the table. */
export function UsersView({ listing, handlers, actions }: UsersViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <UsersHeader
        isRefreshing={listing.isFetching}
        onSearch={handlers.onSearch}
        onRefresh={handlers.onRefresh}
        actions={actions}
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
      {listing.body === 'empty' && <Empty className="mt-16" description="Users not found" />}
      {listing.body === 'table' && (
        <UsersTable listing={listing} onPageChange={handlers.onPageChange} onOpen={handlers.onOpen} />
      )}
    </div>
  );
}
