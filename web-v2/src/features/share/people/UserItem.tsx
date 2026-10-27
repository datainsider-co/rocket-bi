import { Typography } from 'antd';
import type { UserProfile } from '@/core/user/UserProfile';
import { UserAvatar } from '@/shared/user/UserAvatar';

/** v1 `UserItem`: 40px avatar, the name in bold above the email. */
export function UserItem({ user }: { user: UserProfile }) {
  const name = user.displayName || 'Unknown';
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <UserAvatar size={40} name={name} avatar={user.avatar} className="text-lg" />
      <div className="flex min-w-0 flex-col leading-tight">
        <Typography.Text strong ellipsis={{ tooltip: name }} className="text-base">
          {name}
        </Typography.Text>
        <Typography.Text type="secondary" ellipsis={{ tooltip: user.email }} className="text-base">
          {user.email}
        </Typography.Text>
      </div>
    </div>
  );
}
