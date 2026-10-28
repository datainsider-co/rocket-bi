import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { HeaderBarView } from './HeaderBarView';
import { headerNavItems } from './header.utils';

function renderHeader(pathname = '/mydata', ingestion = false) {
  const account = { displayName: 'Khang Pham', avatarUrl: '', isLoggingOut: false, onLogout: vi.fn<() => void>() };
  const theme = { isDark: false, onToggle: vi.fn<() => void>() };
  render(
    <MemoryRouter>
      <HeaderBarView
        brand={{ name: 'Acme', logoUrl: '' }}
        navItems={headerNavItems({ ingestion })}
        pathname={pathname}
        account={account}
        theme={theme}
      />
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

  it('shows Data Ingestion only behind its flag', () => {
    renderHeader('/data-ingestion/job', true);

    expect(screen.getByRole('link', { name: 'Data Ingestion' })).toHaveAttribute('aria-current', 'page');
  });

  it('hides Data Ingestion when its flag is off', () => {
    renderHeader('/mydata');

    expect(screen.queryByRole('link', { name: 'Data Ingestion' })).not.toBeInTheDocument();
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
