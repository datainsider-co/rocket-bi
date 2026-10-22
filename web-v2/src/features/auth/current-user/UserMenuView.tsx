import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown } from 'antd';

interface UserMenuViewProps {
  displayName: string;
  avatarUrl?: string | undefined;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export function UserMenuView({ displayName, avatarUrl, isLoggingOut, onLogout }: UserMenuViewProps) {
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Logout', disabled: isLoggingOut }],
        onClick: ({ key }) => {
          if (key === 'logout') onLogout();
        }
      }}
    >
      <Button type="text" style={{ color: '#fff' }} loading={isLoggingOut}>
        <Avatar size="small" src={avatarUrl || undefined} icon={<UserOutlined />} />
        {displayName}
      </Button>
    </Dropdown>
  );
}
