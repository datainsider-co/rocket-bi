import { Alert, Button, Result, Spin } from 'antd';
import { Link, useParams } from 'react-router';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { isApiError } from '@/shared/http/ApiError';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { PermissionGate } from '../../layout/PermissionGate';
import { getOrganizationSection, OrganizationSection, OrgPermission } from '../../organization.utils';
import { AttributeModal } from './attributes/AttributeModal';
import { ProfileModal } from './profile/ProfileModal';
import { useUserDetail } from './useUserDetail';
import { useUserDetailPage } from './useUserDetailPage';
import { UserDetailView } from './UserDetailView';

/** `/settings/organization/user-management/:username` (v1 `UserDetail.vue`), for `user:view:*`. */
export function UserDetailPage() {
  return (
    <PermissionGate permission={OrgPermission.viewUsers}>
      <UserDetailRoute />
    </PermissionGate>
  );
}

function UserDetailRoute() {
  const username = useParams().username ?? '';
  const query = useUserDetail(username);

  if (query.isPending) return <Spin className="m-auto" />;
  if (query.isError) {
    if (isApiError(query.error) && query.error.status === 404) {
      return (
        <Result
          status="404"
          title="User not found"
          extra={<Link to={getOrganizationSection(OrganizationSection.Users).path}>Back to users</Link>}
        />
      );
    }
    return (
      <Alert
        type="error"
        showIcon
        title={toErrorMessage(query.error)}
        action={<Button onClick={() => void query.refetch()}>Retry</Button>}
      />
    );
  }
  return <LoadedUserDetail key={username} detail={query.data} />;
}

function LoadedUserDetail({ detail }: { detail: ManagedUserDetail }) {
  const controls = useUserDetailPage(detail);
  const { attributes } = controls;

  return (
    <>
      <UserDetailView detail={detail} controls={controls} />
      {controls.isEditingProfile && <ProfileModal profile={detail.profile} onClose={() => controls.setEditingProfile(false)} />}
      {attributes.editing && (
        <AttributeModal
          row={attributes.editing.row}
          properties={detail.profile.properties}
          save={attributes.save}
          onCancel={attributes.close}
        />
      )}
    </>
  );
}
