import { useState } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import { userDetailPath, OrgPermission } from '../../organization.utils';
import { useOrganizationPermissions } from '../../useOrganizationPermissions';
import { useCreateUser, type CreatedUser } from '../new-user/useCreateUser';
import { useUsers } from './useUsers';

export type UsersDialog = 'new-user' | 'login-method' | null;

/** The listing, the header actions the user may use, and which modal is open. */
export function useUsersPage() {
  const { listing, search, refresh, setPage } = useUsers();
  const { permissions } = useOrganizationPermissions();
  const [dialog, setDialog] = useState<UsersDialog>(null);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const created = ({ username, permissionError }: CreatedUser) => {
    setDialog(null);
    if (permissionError) void message.warning(`User created, but setting their permissions failed: ${permissionError}`);
    void navigate(userDetailPath(username));
  };
  const createUser = useCreateUser(created);

  return {
    listing,
    handlers: {
      onSearch: search,
      onRefresh: refresh,
      onPageChange: setPage,
      onOpen: (username: string) => void navigate(userDetailPath(username))
    },
    actions: {
      onAdd: permissions?.[OrgPermission.createUsers]
        ? () => {
            createUser.reset();
            setDialog('new-user');
          }
        : undefined,
      onLoginMethod: permissions?.[OrgPermission.manageLoginMethod] ? () => setDialog('login-method') : undefined
    },
    dialog,
    closeDialog: () => setDialog(null),
    createUser
  };
}
