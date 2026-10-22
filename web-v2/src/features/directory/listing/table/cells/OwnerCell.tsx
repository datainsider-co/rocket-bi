import { Avatar } from 'antd';
import type { UserProfile } from '@/core/user/UserProfile';
import { avatarColor } from '../../../directory.utils';

/** v1 `UserAvatarCell`: 24px round avatar, or the first letter on a color picked from the name. */
export function OwnerCell({ owner }: { owner: UserProfile }) {
  const name = owner.displayName || 'Unknown';

  return (
    <span className="flex min-w-0 items-center" title={name}>
      <Avatar
        size={24}
        src={owner.avatar || undefined}
        className="mr-2 shrink-0 font-bold"
        style={{ backgroundColor: avatarColor(name) }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <span className="truncate leading-[1.4] tracking-[0.23px]">{name}</span>
    </span>
  );
}
