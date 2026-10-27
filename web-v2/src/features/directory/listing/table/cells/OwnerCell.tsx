import type { UserProfile } from '@/core/user/UserProfile';
import { UserAvatar } from '@/shared/user/UserAvatar';

/** v1 `UserAvatarCell`: 24px round avatar, or the first letter on a color picked from the name. */
export function OwnerCell({ owner }: { owner: UserProfile }) {
  const name = owner.displayName || 'Unknown';

  return (
    <span className="flex min-w-0 items-center" title={name}>
      <UserAvatar size={24} name={name} avatar={owner.avatar} className="mr-2" />
      <span className="truncate leading-[1.4] tracking-[0.23px]">{name}</span>
    </span>
  );
}
