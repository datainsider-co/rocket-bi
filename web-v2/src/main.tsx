import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/AppProviders';
import { appModules } from '@/app/di/appModules';
import { createQueryClient } from '@/app/queryClient';
import { createSessionExpiredHandler } from '@/app/sessionExpiredHandler';
import { createContainer } from '@/core/di/Container';
import { clearSession } from '@/core/session/session';
import { subscribeSessionExpired } from '@/core/session/sessionExpired';
import { routeTree } from './routeTree.gen';

const queryClient = createQueryClient();
const container = createContainer(appModules);

subscribeSessionExpired(
  createSessionExpiredHandler({ queryClient, clearSession, redirect: path => window.location.assign(path) })
);

const router = createRouter({
  routeTree,
  context: { queryClient, di: container },
  defaultPreload: 'intent'
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient} container={container}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
);
