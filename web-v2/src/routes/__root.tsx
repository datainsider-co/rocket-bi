import { lazy, Suspense } from 'react';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { DiResolver } from '@/core/di/Container';
import { Layout, Switch, Typography } from 'antd';
import { useTheme } from '@/app/theme/ThemeContext';

export interface RouterContext {
  queryClient: QueryClient;
  /** For route loaders, which run outside React. Components use `useDi`. */
  di: DiResolver;
}

const Devtools = import.meta.env.DEV
  ? lazy(async () => {
      const [{ TanStackRouterDevtools }, { ReactQueryDevtools }] = await Promise.all([
        import('@tanstack/react-router-devtools'),
        import('@tanstack/react-query-devtools')
      ]);
      return {
        default: () => (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </>
        )
      };
    })
  : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout
});

function RootLayout() {
  const { mode, toggleMode } = useTheme();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/">
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            RocketBI
          </Typography.Title>
        </Link>
        <Switch checked={mode === 'dark'} onChange={toggleMode} checkedChildren="Dark" unCheckedChildren="Light" />
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Outlet />
      </Layout.Content>
      <Suspense>
        <Devtools />
      </Suspense>
    </Layout>
  );
}
