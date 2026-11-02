import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('Data Cook routes', () => {
  it.each([
    ['/data-warehouse/data-cook/my-etl', 'My ETL'],
    ['/data-warehouse/data-cook/shared', 'Share With Me'],
    ['/data-warehouse/data-cook/history', 'ETL History'],
    ['/data-warehouse/data-cook/trash', 'Trash'],
    ['/data-warehouse/data-cook/my-etl/create', 'My ETL'],
    ['/data-warehouse/data-cook/my-etl/untitled-etl-2', 'My ETL']
  ])('%s shows %s', async (path, title) => {
    renderAppAt(path, fakeAuthenticationService());

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('goes to My ETL from the root', async () => {
    const router = renderAppAt('/data-warehouse/data-cook', fakeAuthenticationService());

    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/my-etl'));
  });

  it('names a new ETL like v1', async () => {
    renderAppAt('/data-warehouse/data-cook/my-etl/create', fakeAuthenticationService());

    expect(await screen.findByText('Untitled ETL')).toBeInTheDocument();
  });

  it('keeps My ETL selected in the editor and opens a new ETL from the sidebar', async () => {
    const router = renderAppAt('/data-warehouse/data-cook/history', fakeAuthenticationService());

    const nav = await screen.findByRole('navigation', { name: 'Data Cook' });
    expect(within(nav).getByRole('link', { name: 'Trash' })).toHaveAttribute('href', '/data-warehouse/data-cook/trash');
    await userEvent.click(screen.getByRole('button', { name: /New ETL/ }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/my-etl/create'));
  });

  it('is Not found under an unknown section', async () => {
    renderAppAt('/data-warehouse/data-cook/unknown', fakeAuthenticationService());

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
