import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/AppProviders';
import { createQueryClient } from '@/app/queryClient';
import { createSessionExpiredHandler } from '@/app/sessionExpiredHandler';
import { clearSession } from '@/core/session/session';
import { subscribeSessionExpired } from '@/core/session/sessionExpired';
import { routeTree } from './routeTree.gen';

const queryClient = createQueryClient();

subscribeSessionExpired(
  createSessionExpiredHandler({ queryClient, clearSession, redirect: path => window.location.assign(path) })
);

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent'
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
);
