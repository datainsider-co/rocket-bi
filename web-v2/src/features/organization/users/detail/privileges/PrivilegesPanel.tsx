import { Alert, Button, Card, Spin, Typography } from 'antd';
import { PERMISSION_GROUPS } from '@/core/admin/permissionGroups';
import type { UserGroup } from '@/core/admin/UserGroup';
import { PermissionGroupSection } from './PermissionGroupSection';
import type { PrivilegesControls } from './usePrivileges';

interface PrivilegesPanelProps {
  name: string;
  userGroup: UserGroup;
  controls: PrivilegesControls;
  /** The viewer may assign permissions; otherwise the panel is read only. */
  editable: boolean;
}

/** v1 `UserPrivilege`: the permission groups, with Save. */
export function PrivilegesPanel({ name, userGroup, controls, editable }: PrivilegesPanelProps) {
  const { selection, isLoading, loadError, isDirty, save } = controls;

  return (
    <Card
      title={
        <div>
          <div>Privileges</div>
          <Typography.Text type="secondary" className="text-sm font-normal">
            Here are the admin privileges assigned to {name}
          </Typography.Text>
        </div>
      }
      extra={
        editable && (
          <div className="flex gap-2">
            <Button disabled={!isDirty || save.isPending} onClick={controls.reset}>
              Reset
            </Button>
            <Button type="primary" disabled={!isDirty} loading={save.isPending} onClick={save.run}>
              Save
            </Button>
          </div>
        )
      }
    >
      {loadError && <Alert type="error" showIcon title={loadError} />}
      {save.errorMessage && <Alert className="mb-2" type="error" showIcon title={save.errorMessage} />}
      {isLoading && <Spin className="block py-8" />}
      {!isLoading &&
        !loadError &&
        PERMISSION_GROUPS.map(group => (
          <PermissionGroupSection
            key={group.name}
            group={group}
            selection={selection}
            userGroup={userGroup}
            editable={editable && !save.isPending}
            onToggleAll={controls.toggleAll}
            onToggle={controls.toggle}
          />
        ))}
    </Card>
  );
}
