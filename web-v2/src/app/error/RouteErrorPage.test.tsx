import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { RouteErrorPage } from './RouteErrorPage';

function Crash(): never {
  throw new Error('Element type is invalid');
}

describe('RouteErrorPage', () => {
  afterEach(() => {
    clearSession();
    vi.restoreAllMocks();
  });

  it('shows a friendly page with the error detail in dev when a page crashes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter([{ path: '/', element: <Crash />, errorElement: <RouteErrorPage /> }]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.getByText(/Element type is invalid/)).toBeInTheDocument();
  });

  it('shows not found for an unknown path inside the app shell', async () => {
    saveSession('session-1', 60);

    renderAppAt('/no-such-page', fakeAuthenticationService());

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'RocketBI' })).toBeInTheDocument();
  });
});
