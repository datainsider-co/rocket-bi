import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router';
import { ingestionSectionFromPath } from '../ingestion.utils';
import { IngestionSidebar } from './IngestionSidebar';

/** Shell of the Data Ingestion pages (v1 `DataIngestion.vue`): sidebar and the page. */
export function IngestionLayout() {
  const { pathname } = useLocation();

  return (
    <Layout className="min-h-0 flex-1 !bg-transparent">
      <IngestionSidebar active={ingestionSectionFromPath(pathname)} />
      <Layout.Content className="flex min-h-0 min-w-0 flex-col">
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
