import { Layout } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { dataCookSectionFromPath, NEW_ETL_PATH } from '../dataCook.utils';
import { DataCookSidebar } from './DataCookSidebar';

/** Shell of the Data Cook pages (v1 `DataCook.vue`): sidebar and the page, the ETL editor included. */
export function DataCookLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Layout className="min-h-0 flex-1 !bg-transparent">
      <DataCookSidebar active={dataCookSectionFromPath(pathname)} onNewEtl={() => navigate(NEW_ETL_PATH)} />
      <Layout.Content className="flex min-h-0 min-w-0 flex-col">
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
