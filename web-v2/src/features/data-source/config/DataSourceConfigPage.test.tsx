import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { DiProvider } from '@/app/di/DiContext';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { PostgreSqlConnection } from '@/core/connection/PostgreSqlConnection';
import { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { createContainer } from '@/core/di/Container';
import { fakeConnectionService } from '../testing';
import { DataSourceConfigPage } from './DataSourceConfigPage';

const POSTGRES = new PostgreSqlConnection({
  class_name: 'postgresql_connection',
  host: 'pg',
  port: 5432,
  username: 'admin',
  password: 'secret',
  database: 'sales'
});

function renderPage(service: ConnectionService) {
  const container = createContainer([di => di.bindValue(ConnectionService, service)]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <DiProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <AntApp>
          <DataSourceConfigPage />
        </AntApp>
      </QueryClientProvider>
    </DiProvider>
  );
}

describe('DataSourceConfigPage', () => {
  it('shows the saved connection and its last refresh', async () => {
    renderPage(fakeConnectionService({ get: vi.fn<ConnectionService['get']>(async () => POSTGRES) }));

    expect(await screen.findByText('pg')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows why the last refresh failed', async () => {
    const history = new RefreshSchemaHistory({
      status: 'error',
      stages: [{ name: 'scan_database', status: 'error', message: 'Access denied' }]
    });
    renderPage(
      fakeConnectionService({
        get: vi.fn<ConnectionService['get']>(async () => POSTGRES),
        getRefreshHistory: vi.fn<ConnectionService['getRefreshHistory']>(async () => history)
      })
    );

    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });

  it('starts a schema refresh with Update Schema', async () => {
    const service = fakeConnectionService({ get: vi.fn<ConnectionService['get']>(async () => POSTGRES) });
    const user = userEvent.setup();
    renderPage(service);

    await user.click(await screen.findByRole('button', { name: /Update Schema/ }));

    await waitFor(() => expect(service.refreshSchema).toHaveBeenCalledOnce());
  });

  it('edits the connection in a modal that Cancel closes', async () => {
    const user = userEvent.setup();
    renderPage(fakeConnectionService({ get: vi.fn<ConnectionService['get']>(async () => POSTGRES) }));

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('PostgreSQL Config')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Database')).toHaveValue('sales');
    expect(within(dialog).queryByText('Connect using an SSH tunnel')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText('PostgreSQL Config')).not.toBeInTheDocument());
  });

  it('offers setup when there is no connection', async () => {
    const user = userEvent.setup();
    renderPage(fakeConnectionService({ exists: vi.fn<ConnectionService['exists']>(async () => false) }));

    await user.click(await screen.findByRole('button', { name: 'Click here' }));

    expect(await screen.findByRole('button', { name: 'BigQuery' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('only offers Change for a type it cannot read', async () => {
    renderPage(fakeConnectionService());

    expect(await screen.findByText('Unknown DataSource type')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
