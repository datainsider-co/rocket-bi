import { Spin } from 'antd';
import { Navigate } from 'react-router';
import { visibleSections } from '../organization.utils';
import { useOrganizationPermissions } from '../useOrganizationPermissions';
import { PermissionDenied } from './PermissionDenied';

/**
 * `/settings/organization`: v1 went to Overview, which is not migrated; v2 opens the first section the user may see.
 */
export function OrganizationIndexPage() {
  const { permissions, isError, error, refetch } = useOrganizationPermissions();

  if (isError) return <PermissionDenied error={error?.message} onRetry={() => void refetch()} />;
  if (!permissions) return <Spin className="m-auto" />;
  const first = visibleSections(permissions)[0];
  return first ? <Navigate replace to={first.path} /> : <PermissionDenied />;
}
