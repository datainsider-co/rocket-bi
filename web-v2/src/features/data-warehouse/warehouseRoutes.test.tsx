import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('Data Warehouse routes', () => {
  it.each([
    ['/data-warehouse/databases/all', 'All Databases'],
    ['/data-warehouse/schema', 'Schema'],
    ['/data-warehouse/query-editor', 'Query Analysis'],
    ['/data-warehouse/relationship', 'Relationship']
  ])('%s shows %s', async (path, title) => {
    renderAppAt(path, fakeAuthenticationService());

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  });

  it.each(['/data-warehouse', '/data-warehouse/databases', '/data-warehouse/databases/trash', '/data-management/schema'])(
    '%s goes to the database listing',
    async path => {
      const router = renderAppAt(path, fakeAuthenticationService());

      await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/databases/all'));
      expect(await screen.findByRole('heading', { name: 'All Databases' })).toBeInTheDocument();
    }
  );

  it('leaves Data Cook to its own phase', async () => {
    renderAppAt('/data-warehouse/data-cook', fakeAuthenticationService());

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
