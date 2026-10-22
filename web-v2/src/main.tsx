import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/global.css';
import { RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { appModules } from '@/app/di/appModules';
import { createQueryClient } from '@/app/queryClient';
import { createAppRouter } from '@/app/router';
import { createSessionExpiredHandler } from '@/app/sessionExpiredHandler';
import { createContainer } from '@/core/di/Container';
import { clearSession } from '@/core/session/session';
import { subscribeSessionExpired } from '@/core/session/sessionExpired';

const queryClient = createQueryClient();
const container = createContainer(appModules);
const router = createAppRouter();

subscribeSessionExpired(
  createSessionExpiredHandler({
    queryClient,
    clearSession,
    currentPath: () => `${window.location.pathname}${window.location.search}${window.location.hash}`,
    redirect: href => window.location.assign(href)
  })
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient} container={container}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
);
