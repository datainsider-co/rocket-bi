import type { ComponentType } from 'react';
import { Outlet, createBrowserRouter, redirect } from 'react-router';
import type { RouteObject } from 'react-router';
import { NotFoundPage } from '@/app/error/NotFoundPage';
import { RouteErrorPage } from '@/app/error/RouteErrorPage';
import { AppLayout, type AppRouteHandle } from '@/app/layout/AppLayout';
import { PageLoading } from '@/app/layout/PageLoading';
import { redirectIfLoggedIn, requireSession } from '@/app/routeGuards';
import { AuthLayout } from '@/features/auth/AuthLayout';

/**
 * Loads a page's chunk on first visit. Layouts, guards and error pages stay in the main bundle so they can render
 * even when a page chunk fails to load.
 */
function lazyPage<M>(load: () => Promise<M>, pick: (module: M) => ComponentType): Pick<RouteObject, 'lazy'> {
  return { lazy: async () => ({ Component: pick(await load()) }) };
}

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
                ...lazyPage(() => import('@/features/dashboard/detail/DashboardPage'), m => m.DashboardPage)
              },
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
