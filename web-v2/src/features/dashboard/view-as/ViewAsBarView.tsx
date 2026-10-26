import { EyeOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { SuggestedUser } from '@/core/user/UserService';

interface ViewAsBarViewProps {
  user: SuggestedUser;
  onChange: () => void;
  onExit: () => void;
}

/** v1's RLS View As mode in the header: who the dashboard is shown as, to pick another, and the way out. */
export function ViewAsBarView({ user, onChange, onExit }: ViewAsBarViewProps) {
  const { profile } = user;
  return (
    <span className="flex items-center gap-1">
      <Button icon={<EyeOutlined />} title={profile.email} onClick={onChange}>
        View As: <strong>{profile.displayName}</strong>
      </Button>
      <Button type="text" icon={<LogoutOutlined />} onClick={onExit}>
        Exit View As
      </Button>
    </span>
  );
}
