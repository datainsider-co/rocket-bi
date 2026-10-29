import type { ComponentType } from 'react';
import { Outlet, createBrowserRouter, redirect } from 'react-router';
import type { RouteObject } from 'react-router';
import { NotFoundPage } from '@/app/error/NotFoundPage';
import { featureFlags } from '@/app/featureFlags';
import { RouteErrorPage } from '@/app/error/RouteErrorPage';
import { AppLayout, type AppRouteHandle } from '@/app/layout/AppLayout';
import { PageLoading } from '@/app/layout/PageLoading';
import { redirectIfLoggedIn, requireSession } from '@/app/routeGuards';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { DATABASES_PATH, WAREHOUSE_PATH } from '@/features/data-warehouse/warehouse.utils';

/**
 * Loads a page's chunk on first visit. Layouts, guards and error pages stay in the main bundle so they can render
 * even when a page chunk fails to load.
 */
function lazyPage<M>(load: () => Promise<M>, pick: (module: M) => ComponentType): Pick<RouteObject, 'lazy'> {
  return { lazy: async () => ({ Component: pick(await load()) }) };
}

/** Data Ingestion at v1's paths, behind its feature flag (`VITE_ENABLE_INGESTION`); off, the paths are Not found. */
const ingestionRoutes: RouteObject[] = featureFlags.ingestion
  ? [
      {
        path: '/data-ingestion',
        ...lazyPage(() => import('@/features/ingestion/layout/IngestionLayout'), m => m.IngestionLayout),
        children: [
          { index: true, loader: () => redirect('/data-ingestion/data-source') },
          {
            path: 'data-source',
            ...lazyPage(() => import('@/features/ingestion/sources/DataSourcesPage'), m => m.DataSourcesPage)
          },
          ...['job', 'queued-job'].map(path => ({
            path,
            ...lazyPage(() => import('@/features/ingestion/jobs/JobsPage'), m => m.JobsPage)
          })),
          {
            path: 'job-history',
            ...lazyPage(() => import('@/features/ingestion/history/JobHistoryPage'), m => m.JobHistoryPage)
          }
        ]
      }
    ]
  : [];

/**
 * Data Warehouse at v1's paths, old `/data-management/*` links included. The server has no trash (`DATA_WAREHOUSE.md`,
 * DW0), so v1's Trash page goes to the listing.
 */
const warehouseRoutes: RouteObject[] = [
  { path: '/data-management/*', loader: () => redirect(WAREHOUSE_PATH) },
  {
    path: WAREHOUSE_PATH,
    children: [
      { index: true, loader: () => redirect(DATABASES_PATH) },
      ...['databases', 'databases/trash'].map(path => ({ path, loader: () => redirect(DATABASES_PATH) })),
      {
        path: 'databases/all',
        ...lazyPage(() => import('@/features/data-warehouse/databases/DatabasesPage'), m => m.DatabasesPage)
      },
      {
        path: 'schema',
        ...lazyPage(() => import('@/features/data-warehouse/schema/SchemaPage'), m => m.SchemaPage)
      },
      {
        path: 'query-editor',
        ...lazyPage(() => import('@/features/data-warehouse/query-editor/QueryEditorPage'), m => m.QueryEditorPage)
      },
      {
        path: 'relationship',
        ...lazyPage(() => import('@/features/data-warehouse/relationship/RelationshipPage'), m => m.RelationshipPage)
      }
    ]
  }
];

/** Every route of the app. Add a feature's page here; keep the page component in its feature folder. */
export const appRoutes: RouteObject[] = [
  {
    // Last resort: errors from loaders, layouts and failed chunk loads end up here.
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoading />,
    children: [
      {
        loader: () => redirectIfLoggedIn(),
        element: (
          <AuthLayout>
            <Outlet />
          </AuthLayout>
        ),
        children: [
          {
            path: '/login',
            ...lazyPage(() => import('@/features/auth/login/LoginPage'), m => m.LoginPage)
          },
          {
            path: '/forgot-password',
            ...lazyPage(() => import('@/features/auth/forgot-password/ForgotPasswordPage'), m => m.ForgotPasswordPage)
          }
        ]
      },
      {
        // For an iframe on the same domain: the session cookie is shared, the app around the dashboard is not.
        path: '/embedded/dashboard/:name',
        loader: args => requireSession(args),
        errorElement: <RouteErrorPage />,
        ...lazyPage(() => import('@/features/dashboard/detail/DashboardPage'), m => m.EmbeddedDashboardPage)
      },
      {
        loader: args => requireSession(args),
        element: <AppLayout />,
        children: [
          {
            // A page that crashes renders its error inside the app shell, so the header stays usable.
            errorElement: <RouteErrorPage />,
            children: [
              { index: true, loader: () => redirect('/mydata') },
              {
                ...lazyPage(() => import('@/features/directory/layout/DirectoryLayout'), m => m.DirectoryLayout),
                children: ['/mydata/:name?', '/shared/:name?', '/recent/:name?', '/starred/:name?', '/trash'].map(path => ({
                  path,
                  ...lazyPage(() => import('@/features/directory/listing/DirectoryListingPage'), m => m.DirectoryListingPage)
                }))
              },
              {
                path: '/dashboard/:name',
                handle: { fullBleed: true } satisfies AppRouteHandle,
                // The dashboard with ChartBuilder for edit mode (the embedded page has no edit mode).
                ...lazyPage(() => import('@/features/chart-builder/DashboardBuilderPage'), m => m.DashboardBuilderPage)
              },
              ...warehouseRoutes,
              ...ingestionRoutes,
              { path: '*', element: <NotFoundPage /> }
            ]
          }
        ]
      }
    ]
  }
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
