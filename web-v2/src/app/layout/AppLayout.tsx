import { Link, Outlet } from 'react-router';
import { Flex, Layout, Switch, Typography } from 'antd';
import { useTheme } from '@/app/theme/ThemeContext';
import { UserMenu } from '@/features/auth/current-user/UserMenu';
import { DataSourceSetup } from '@/features/data-source/setup/DataSourceSetup';

/** Shell for every page behind login. */
export function AppLayout() {
  const { mode, toggleMode } = useTheme();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/">
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            RocketBI
          </Typography.Title>
        </Link>
        <Flex align="center" gap="middle">
          <Switch checked={mode === 'dark'} onChange={toggleMode} checkedChildren="Dark" unCheckedChildren="Light" />
          <UserMenu />
        </Flex>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Outlet />
      </Layout.Content>
      <DataSourceSetup />
    </Layout>
  );
}
