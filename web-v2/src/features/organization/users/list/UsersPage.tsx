import { PermissionGate } from '../../layout/PermissionGate';
import { OrgPermission } from '../../organization.utils';
import { LoginMethodModal } from '../login-method/LoginMethodModal';
import { NewUserModal } from '../new-user/NewUserModal';
import { UsersView } from './UsersView';
import { useUsersPage } from './useUsersPage';

/** `/settings/organization/user-management` (v1 `UserManagement.vue`), for `user:view:*`. */
export function UsersPage() {
  return (
    <PermissionGate permission={OrgPermission.viewUsers}>
      <UsersContent />
    </PermissionGate>
  );
}

function UsersContent() {
  const { listing, handlers, actions, dialog, closeDialog, createUser } = useUsersPage();

  return (
    <>
      <UsersView listing={listing} handlers={handlers} actions={actions} />
      {dialog === 'new-user' && (
        <NewUserModal
          isPending={createUser.isPending}
          emailExisted={createUser.emailExisted}
          errorMessage={createUser.errorMessage}
          onSubmit={createUser.create}
          onEdit={createUser.reset}
          onCancel={closeDialog}
        />
      )}
      {dialog === 'login-method' && <LoginMethodModal onClose={closeDialog} />}
    </>
  );
}
