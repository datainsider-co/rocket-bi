import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { appRoutes } from '@/app/router';
import { AuthenticationService } from '@/core/auth/AuthenticationService';
import { LoginResponse } from '@/core/auth/LoginResponse';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { createContainer } from '@/core/di/Container';
import type { DiModule } from '@/core/di/Container';
import { PermissionService } from '@/core/permission/PermissionService';
import { fakeConnectionService, fakePermissionService } from '@/features/data-source/testing';

type Service = AuthenticationService;

/** Test-only: an AuthenticationService whose methods all succeed unless overridden. */
export function fakeAuthenticationService(overrides: Partial<Service> = {}, user = new LoginResponse()): Service {
  return {
    login: vi.fn<Service['login']>(async () => user),
    checkSession: vi.fn<Service['checkSession']>(async () => user),
    logout: vi.fn<Service['logout']>(async () => {}),
    forgotPassword: vi.fn<Service['forgotPassword']>(async () => {}),
    verifyCode: vi.fn<Service['verifyCode']>(async () => {}),
    resetPassword: vi.fn<Service['resetPassword']>(async () => {}),
    ...overrides
  };
}

/**
 * Test-only: renders the real routes at `path`, with `service` bound in place of the HTTP one. Other services are
 * quiet fakes (no permissions, so no data source setup); `modules` can replace them.
 */
export function renderAppAt(path: string, service: Service, modules: readonly DiModule[] = []) {
  const container = createContainer([
    di => {
      di.bindValue(AuthenticationService, service);
      di.bindValue(PermissionService, fakePermissionService());
      di.bindValue(ConnectionService, fakeConnectionService());
    },
    ...modules
  ]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <AppProviders queryClient={queryClient} container={container}>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return router;
}
