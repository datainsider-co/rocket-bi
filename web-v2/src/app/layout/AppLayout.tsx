import { Outlet } from 'react-router';
import { Layout } from 'antd';
import { HeaderBar } from '@/app/layout/header/HeaderBar';
import { DataSourceSetup } from '@/features/data-source/setup/DataSourceSetup';

/** Shell for every page behind login. */
export function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <HeaderBar />
      <Layout.Content style={{ padding: 24 }}>
        <Outlet />
      </Layout.Content>
      <DataSourceSetup />
    </Layout>
  );
}
