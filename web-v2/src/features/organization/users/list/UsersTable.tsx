import { Table } from 'antd';
import type { ManagedUser } from '@/core/admin/ManagedUser';
import { listingPagination } from '@/shared/listing/listing.utils';
import type { UsersListing } from './useUsers';
import { userColumns } from './userColumns';

interface UsersTableProps {
  listing: Pick<UsersListing, 'rows' | 'total' | 'state' | 'isFetching'>;
  onPageChange: (page: number, pageSize: number) => void;
  onOpen: (username: string) => void;
}

/** v1 `UserManagement.vue` table, paged on the server; a row opens the user. */
export function UsersTable({ listing, onPageChange, onOpen }: UsersTableProps) {
  const { rows, total, state, isFetching } = listing;

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <Table<ManagedUser>
        rowKey={row => row.user.username}
        columns={userColumns(state)}
        dataSource={[...rows]}
        loading={isFetching}
        locale={{ emptyText: ' ' }}
        onRow={({ user }) => ({ onClick: () => onOpen(user.username), className: 'cursor-pointer' })}
        pagination={{ ...listingPagination(state.page, state.pageSize, total), onChange: onPageChange }}
      />
    </div>
  );
}
