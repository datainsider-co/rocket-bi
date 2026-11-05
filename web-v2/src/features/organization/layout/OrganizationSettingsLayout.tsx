import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router';
import { organizationSectionFromPath, visibleSections } from '../organization.utils';
import { useOrganizationPermissions } from '../useOrganizationPermissions';
import { OrganizationSidebar } from './OrganizationSidebar';

/** Shell of `/settings/organization/*` (v1 `OrganizationSettings.vue`): sidebar and the page. */
export function OrganizationSettingsLayout() {
  const { pathname } = useLocation();
  const { permissions } = useOrganizationPermissions();

  return (
    <Layout className="min-h-0 flex-1 !bg-transparent">
      <OrganizationSidebar
        sections={permissions ? visibleSections(permissions) : []}
        active={organizationSectionFromPath(pathname)}
      />
      <Layout.Content className="flex min-h-0 min-w-0 flex-col">
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
