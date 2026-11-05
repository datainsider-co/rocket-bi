import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { getOrganizationSection, OrganizationSection } from '../../organization.utils';
import { useOrganizationPermissions } from '../../useOrganizationPermissions';
import { useAttributes } from './attributes/useAttributes';
import { contactAbilities } from './contact/contact.utils';
import { useContactActions } from './contact/useContactActions';
import { useDeleteUser } from './delete/useDeleteUser';
import { usePrivileges } from './privileges/usePrivileges';

/** Right of the contact card: the privileges, or the delete form once Delete User is clicked (v1 `DetailPanelType`). */
export type DetailPanel = 'privileges' | 'delete';

const USERS_PATH = getOrganizationSection(OrganizationSection.Users).path;

/** Everything the loaded user page does; each part is its own hook. */
export function useUserDetailPage(detail: ManagedUserDetail) {
  const { permissions, username: viewer } = useOrganizationPermissions();
  const abilities = contactAbilities(permissions, viewer === detail.user.username, detail.userGroup);
  const [panel, setPanel] = useState<DetailPanel>('privileges');
  const [isEditingProfile, setEditingProfile] = useState(false);
  const navigate = useNavigate();

  return {
    abilities,
    panel,
    showPrivileges: () => setPanel('privileges'),
    showDelete: () => setPanel('delete'),
    isEditingProfile,
    setEditingProfile,
    contact: useContactActions(detail),
    attributes: useAttributes(detail.user.username),
    privileges: usePrivileges(detail, abilities.viewPrivileges),
    deleteUser: useDeleteUser(detail, () => void navigate(USERS_PATH, { replace: true })),
    usersPath: USERS_PATH
  };
}

export type UserDetailPageControls = ReturnType<typeof useUserDetailPage>;
