import { DataSourceConfigPage } from '@/features/data-source/config/DataSourceConfigPage';
import { OrgPermission } from '../organization.utils';
import { PermissionGate } from './PermissionGate';

/** `/settings/organization/clickhouse-config` (v1's path): the DataSource page, for `organization:manage:connection`. */
export function DataSourceConfigRoute() {
  return (
    <PermissionGate permission={OrgPermission.manageConnection}>
      <DataSourceConfigPage />
    </PermissionGate>
  );
}
