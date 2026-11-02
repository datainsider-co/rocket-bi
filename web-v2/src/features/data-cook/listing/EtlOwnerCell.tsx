import type { EtlJob } from '@/core/data-cook/EtlJob';
import { UserAvatar } from '@/shared/user/UserAvatar';
import { etlOwnerName } from './etlListing.utils';

/** v1 `UserAvatarCell`: 24px round avatar and the owner's name. */
export function EtlOwnerCell({ etl }: { etl: EtlJob }) {
  const name = etlOwnerName(etl);

  return (
    <span className="flex min-w-0 items-center" title={name}>
      <UserAvatar size={24} name={name} avatar={etl.owner?.avatar} className="mr-2" />
      <span className="truncate">{name}</span>
    </span>
  );
}
