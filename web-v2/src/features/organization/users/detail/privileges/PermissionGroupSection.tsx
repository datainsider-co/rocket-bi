import { Checkbox, Tooltip, Typography } from 'antd';
import { canHold, isGroupAllSelected, type PermissionGroup } from '@/core/admin/permissionGroups';
import type { UserGroup } from '@/core/admin/UserGroup';

const VIEWER_ONLY = 'A Viewer can only have view permissions';

interface PermissionGroupSectionProps {
  group: PermissionGroup;
  selection: readonly string[];
  userGroup: UserGroup;
  /** The viewer may assign permissions. */
  editable: boolean;
  onToggleAll: (group: PermissionGroup, checked: boolean) => void;
  onToggle: (group: PermissionGroup, permission: string, checked: boolean) => void;
}

/** v1 `GroupListCheckbox`: "All" (the group's sudo) and one checkbox per permission. */
export function PermissionGroupSection({ group, selection, userGroup, editable, onToggleAll, onToggle }: PermissionGroupSectionProps) {
  const ticked = group.items.filter(item => selection.includes(item.permission)).length;
  const allSelected = isGroupAllSelected(selection, group);
  const sudoAllowed = group.sudo !== undefined && canHold(userGroup, group.sudo);

  return (
    <section aria-label={group.name} className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="mb-2 flex items-center gap-3">
        <Typography.Text strong>{group.name}</Typography.Text>
        {group.sudo && (
          <Tooltip title={sudoAllowed ? undefined : VIEWER_ONLY}>
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && ticked > 0}
              disabled={!editable || (!sudoAllowed && !allSelected)}
              onChange={event => onToggleAll(group, event.target.checked)}
            >
              All
            </Checkbox>
          </Tooltip>
        )}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
        {group.items.map(item => {
          const checked = selection.includes(item.permission);
          const allowed = canHold(userGroup, item.permission);
          return (
            <Tooltip key={item.permission} title={allowed ? undefined : VIEWER_ONLY}>
              <Checkbox
                checked={checked}
                // A Viewer may still lose a permission the server kept from when they were an Editor.
                disabled={!editable || (!allowed && !checked)}
                onChange={event => onToggle(group, item.permission, event.target.checked)}
              >
                {item.label}
              </Checkbox>
            </Tooltip>
          );
        })}
      </div>
    </section>
  );
}
