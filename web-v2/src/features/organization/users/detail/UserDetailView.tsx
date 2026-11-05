import { Breadcrumb, Result } from 'antd';
import { Link } from 'react-router';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { PageHeader } from '@/shared/layout/PageHeader';
import { getOrganizationSection, OrganizationSection } from '../../organization.utils';
import { ContactCard } from './contact/ContactCard';
import { DeleteUserPanel } from './delete/DeleteUserPanel';
import { PrivilegesPanel } from './privileges/PrivilegesPanel';
import type { UserDetailPageControls } from './useUserDetailPage';

const SECTION = getOrganizationSection(OrganizationSection.Users);

interface UserDetailViewProps {
  detail: ManagedUserDetail;
  controls: UserDetailPageControls;
}

/** v1 `UserDetail.vue`: the contact card on the left, the privileges or the delete form on the right. */
export function UserDetailView({ detail, controls }: UserDetailViewProps) {
  const { abilities, panel } = controls;
  const name = detail.profile.displayName;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        icon={SECTION.icon}
        title={SECTION.title}
        trail={<Breadcrumb items={[{ title: <Link to={controls.usersPath}>All users</Link> }, { title: name }]} />}
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 overflow-auto lg:grid-cols-[minmax(300px,380px)_1fr]">
        <ContactCard
          detail={detail}
          abilities={abilities}
          actions={controls.contact}
          attributes={controls.attributes}
          onEditProfile={() => controls.setEditingProfile(true)}
          onDelete={controls.showDelete}
        />
        {panel === 'delete' && abilities.delete && (
          <DeleteUserPanel
            username={detail.user.username}
            name={name}
            controls={controls.deleteUser}
            onCancel={controls.showPrivileges}
          />
        )}
        {panel === 'privileges' && abilities.viewPrivileges && (
          <PrivilegesPanel
            name={name}
            userGroup={detail.userGroup}
            controls={controls.privileges}
            editable={abilities.assignPrivileges}
          />
        )}
        {panel === 'privileges' && !abilities.viewPrivileges && (
          <Result status="info" subTitle="You do not have permission to view this user's privileges." />
        )}
      </div>
    </div>
  );
}
