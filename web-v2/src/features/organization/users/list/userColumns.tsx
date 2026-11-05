import type { TableColumnsType } from 'antd';
import type { ManagedUser } from '@/core/admin/ManagedUser';
import type { ListingState } from '@/shared/listing/listing.utils';
import { UserAvatar } from '@/shared/user/UserAvatar';
import { UserStatusTag } from '../UserStatusTag';
import { rowNumber, type UserSortField } from './users.utils';

/** v1 `UserManagementStore` columns: #, Owner, First Name, Last Name, Email, Status. */
export function userColumns(state: ListingState<UserSortField>): TableColumnsType<ManagedUser> {
  return [
    { key: 'index', title: '#', width: 64, render: (_, _row, index) => rowNumber(state, index) },
    {
      key: 'owner',
      title: 'Owner',
      ellipsis: true,
      render: (_, { profile }) => (
        <span className="flex min-w-0 items-center" title={profile.displayName}>
          <UserAvatar size={24} name={profile.displayName} avatar={profile.avatar} className="mr-2" />
          <span className="truncate">{profile.displayName}</span>
        </span>
      )
    },
    { key: 'firstName', title: 'First Name', ellipsis: true, responsive: ['md'], render: (_, { profile }) => profile.firstName },
    { key: 'lastName', title: 'Last Name', ellipsis: true, responsive: ['md'], render: (_, { profile }) => profile.lastName },
    { key: 'email', title: 'Email', ellipsis: true, responsive: ['sm'], render: (_, { profile }) => profile.email },
    { key: 'status', title: 'Status', width: 110, render: (_, { user }) => <UserStatusTag isActive={user.isActive} /> }
  ];
}
