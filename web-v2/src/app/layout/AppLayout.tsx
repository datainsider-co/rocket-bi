import { Outlet, useMatches } from 'react-router';
import { Layout } from 'antd';
import { HeaderBar } from '@/app/layout/header/HeaderBar';
import { DataSourceSetup } from '@/features/data-source/setup/DataSourceSetup';

/** Set on a route's `handle` to change how the shell lays it out. */
export interface AppRouteHandle {
  /** The page draws its own background edge to edge (the dashboard), so the content area has no padding. */
  fullBleed?: boolean;
}

function isFullBleed(handle: unknown): boolean {
  return typeof handle === 'object' && handle !== null && (handle as AppRouteHandle).fullBleed === true;
}

/**
 * Shell for every page behind login. It is exactly one screen high and the content area scrolls, so a page can fill
 * the height left under the header (`flex-1 min-h-0`), as the directory listing does.
 */
export function AppLayout() {
  const fullBleed = useMatches().some(match => isFullBleed(match.handle));
  return (
    <Layout className="h-dvh">
      <HeaderBar />
      <Layout.Content className={`flex min-h-0 flex-col overflow-auto${fullBleed ? '' : ' p-6'}`}>
        <Outlet />
      </Layout.Content>
      <DataSourceSetup />
    </Layout>
  );
}
