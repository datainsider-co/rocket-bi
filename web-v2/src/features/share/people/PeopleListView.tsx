import { Select, Typography } from 'antd';
import type { ShareLevel } from '@/core/share/shareLevel';
import type { UserProfile } from '@/core/user/UserProfile';
import type { LevelOption } from '../share.utils';
import type { PersonRow } from './sharePeople.utils';
import { UserItem } from './UserItem';

interface PeopleListViewProps {
  owner: UserProfile | undefined;
  rows: readonly PersonRow[];
  levels: readonly LevelOption[];
  onLevelChange: (username: string, level: ShareLevel) => void;
}

/** v1 `SharePermissionManager`: the owner, then a row per user with their level. Scrolls past a third of the screen. */
export function PeopleListView({ owner, rows, levels, onLevelChange }: PeopleListViewProps) {
  return (
    <ul className="m-0 flex max-h-[36vh] list-none flex-col gap-4 overflow-y-auto p-0" aria-label="People with access">
      {owner && (
        <li className="flex items-start gap-4">
          <UserItem user={owner} />
          <Typography.Text type="secondary" className="text-base">
            Owner
          </Typography.Text>
        </li>
      )}
      {rows.map(row => (
        <li key={row.user.username} className="flex items-center gap-2">
          <UserItem user={row.user} />
          <Select
            aria-label={`Access of ${row.user.displayName}`}
            className="w-[170px] shrink-0"
            variant="filled"
            size="large"
            value={row.level}
            options={levels.map(option => ({ value: option.value, label: option.label }))}
            onChange={level => onLevelChange(row.user.username, level)}
          />
        </li>
      ))}
    </ul>
  );
}
