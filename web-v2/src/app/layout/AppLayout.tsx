import { Outlet } from 'react-router';
import { Layout } from 'antd';
import { HeaderBar } from '@/app/layout/header/HeaderBar';
import { DataSourceSetup } from '@/features/data-source/setup/DataSourceSetup';

/**
 * Shell for every page behind login. It is exactly one screen high and the content area scrolls, so a page can fill
 * the height left under the header (`flex-1 min-h-0`), as the directory listing does.
 */
export function AppLayout() {
  return (
    <Layout className="h-dvh">
      <HeaderBar />
      <Layout.Content className="flex min-h-0 flex-col overflow-auto p-6">
        <Outlet />
      </Layout.Content>
      <DataSourceSetup />
    </Layout>
  );
}
