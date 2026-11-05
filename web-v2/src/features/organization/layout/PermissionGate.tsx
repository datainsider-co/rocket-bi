import type { ReactNode } from 'react';
import { Spin } from 'antd';
import type { OrgPermission } from '../organization.utils';
import { useOrganizationPermissions } from '../useOrganizationPermissions';
import { PermissionDenied } from './PermissionDenied';

interface PermissionGateProps {
  permission: OrgPermission;
  children: ReactNode;
}

/** Renders the page only for users with `permission`; the sidebar already hides it from the others. */
export function PermissionGate({ permission, children }: PermissionGateProps) {
  const { permissions, isError, error, refetch } = useOrganizationPermissions();

  if (isError) return <PermissionDenied error={error?.message} onRetry={() => void refetch()} />;
  if (!permissions) return <Spin className="m-auto" />;
  if (!permissions[permission]) return <PermissionDenied />;
  return children;
}
