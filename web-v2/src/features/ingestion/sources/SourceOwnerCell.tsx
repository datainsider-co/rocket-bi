import type { SourceInfo } from '@/core/ingestion/DataSourceService';
import { UserAvatar } from '@/shared/user/UserAvatar';
import { ownerName } from './sources.utils';

/** v1 `UserAvatarCell`: 24px round avatar and the creator's name. */
export function SourceOwnerCell({ info }: { info: SourceInfo }) {
  const name = ownerName(info);

  return (
    <span className="flex min-w-0 items-center" title={name}>
      <UserAvatar size={24} name={name} avatar={info.creator?.avatar} className="mr-2" />
      <span className="truncate">{name}</span>
    </span>
  );
}
