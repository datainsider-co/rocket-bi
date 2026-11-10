import { Button, Tag, Typography } from 'antd';
import { DeleteOutlined, KeyOutlined, StopOutlined, UnlockOutlined } from '@ant-design/icons';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { UserGroup } from '@/core/admin/UserGroup';
import { formatDateTime } from '@/shared/listing/listing.utils';
import { UserAvatar } from '@/shared/user/UserAvatar';
import { UserStatusTag } from '../../UserStatusTag';
import type { ContactAbilities } from './contact.utils';

export interface ContactHeaderHandlers {
  readonly onResetPassword: () => void;
  readonly onToggleActive: () => void;
  readonly onDelete: () => void;
}

interface ContactHeaderProps {
  detail: ManagedUserDetail;
  abilities: ContactAbilities;
  isPending: boolean;
  handlers: ContactHeaderHandlers;
}

/** v1 `Contact.vue` header: who the user is and the account actions the viewer may use. */
export function ContactHeader({ detail, abilities, isPending, handlers }: ContactHeaderProps) {
  const { user, profile, userGroup } = detail;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <UserAvatar size={72} name={profile.displayName} avatar={profile.avatar} />
      <Typography.Title level={4} className="!m-0 break-all">
        {profile.displayName}
      </Typography.Title>
      <div className="flex flex-wrap justify-center gap-1">
        <Tag>{userGroup === UserGroup.None ? 'Owner' : userGroup}</Tag>
        <UserStatusTag isActive={user.isActive} />
      </div>
      <Typography.Text className="break-all">{profile.email}</Typography.Text>
      <Typography.Text type="secondary" className="text-sm">
        Created: {formatDateTime(profile.createdTime)}
      </Typography.Text>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {abilities.resetPassword && (
          <Button icon={<KeyOutlined />} disabled={isPending} onClick={handlers.onResetPassword}>
            Reset Password
          </Button>
        )}
        {abilities.suspend && (
          <Button
            icon={user.isActive ? <StopOutlined /> : <UnlockOutlined />}
            disabled={isPending}
            onClick={handlers.onToggleActive}
          >
            {user.isActive ? 'Suspend User' : 'Unsuspend User'}
          </Button>
        )}
        {abilities.delete && (
          <Button danger icon={<DeleteOutlined />} disabled={isPending} onClick={handlers.onDelete}>
            Delete User
          </Button>
        )}
      </div>
    </div>
  );
}
