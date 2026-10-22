import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { HeaderBarView } from './HeaderBarView';

function renderHeader(pathname = '/mydata') {
  const account = { displayName: 'Khang Pham', avatarUrl: '', isLoggingOut: false, onLogout: vi.fn<() => void>() };
  const theme = { isDark: false, onToggle: vi.fn<() => void>() };
  render(
    <MemoryRouter>
      <HeaderBarView brand={{ name: 'Acme', logoUrl: '' }} pathname={pathname} account={account} theme={theme} />
    </MemoryRouter>
  );
  return { account, theme };
}

describe('HeaderBarView', () => {
  it('shows the organization and marks the current entry', () => {
    renderHeader('/mydata/folder-1');

    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Dashboards' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens Data Warehouse links', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Data Warehouse' }));

    expect(await screen.findByRole('link', { name: 'Schema' })).toHaveAttribute('href', '/data-warehouse/schema');
  });

  it('signs out and toggles dark mode from Settings', async () => {
    const { account, theme } = renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await userEvent.click(await screen.findByText('Dark mode'));
    expect(theme.onToggle).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await userEvent.click(await screen.findByText('Sign Out'));
    expect(account.onLogout).toHaveBeenCalledOnce();
  });
});
