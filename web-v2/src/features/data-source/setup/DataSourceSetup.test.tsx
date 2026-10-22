import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginResponse } from '@/core/auth/LoginResponse';
import { ClickhouseConnection } from '@/core/connection/ClickhouseConnection';
import type { Connection } from '@/core/connection/Connection';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { Permission, PermissionService } from '@/core/permission/PermissionService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { ApiError } from '@/shared/http/ApiError';
import { fakeConnectionService, fakePermissionService } from '../testing';

const ROOT = new LoginResponse({ user_info: { username: 'root' }, user_profile: { username: 'root' } });

/** Before starting: an old finished run. After starting: the new run, already done, so no polling wait. */
function histories(...runs: Record<string, unknown>[]) {
  const getRefreshHistory = vi.fn<ConnectionService['getRefreshHistory']>();
  for (const run of runs) getRefreshHistory.mockResolvedValueOnce(new RefreshSchemaHistory(run));
  const last = runs.at(-1);
  getRefreshHistory.mockResolvedValue(new RefreshSchemaHistory(last));
  return getRefreshHistory;
}

function renderHome(connectionService: ConnectionService, permissions = [Permission.manageConnection]) {
  const permissionService = fakePermissionService(permissions);
  renderAppAt('/', fakeAuthenticationService({}, ROOT), [
    di => {
      di.bindValue(PermissionService, permissionService);
      di.bindValue(ConnectionService, connectionService);
    }
  ]);
  return { permissionService };
}

describe('data source setup', () => {
  beforeEach(() => saveSession('session-1', 60));
  afterEach(() => clearSession());

  it('sets up a MySQL connection: pick, fill, test, save, fetch the schema', async () => {
    const service = fakeConnectionService({
      exists: vi.fn<ConnectionService['exists']>(async () => false),
      getRefreshHistory: histories(
        { id: 3, status: 'error', is_first_run: false },
        { id: 4, status: 'success', is_first_run: false }
      )
    });
    const user = userEvent.setup();
    renderHome(service);

    await user.click(await screen.findByRole('button', { name: 'MySQL' }));
    expect(await screen.findByText('MySQL Config')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Host is required!')).toBeInTheDocument();
    expect(service.save).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Host'), 'rocket-bi-mysql');
    await user.type(screen.getByLabelText('Port'), '3306');
    await user.type(screen.getByLabelText('Username'), 'root');
    await user.click(screen.getByRole('button', { name: /Add property/ }));
    await user.type(screen.getByLabelText('Property 1 key'), 'useSSL');
    await user.type(screen.getByLabelText('Property 1 value'), 'false');

    await user.click(screen.getByRole('button', { name: /Test connection/ }));
    expect(await screen.findByText('Connection successful')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('MySQL Config Progress')).toBeInTheDocument();
    const saved = vi.mocked(service.save).mock.calls[0]?.[0] as Connection;
    expect(saved.toJson()).toEqual({
      class_name: 'mysql_connection',
      host: 'rocket-bi-mysql',
      port: 3306,
      username: 'root',
      password: '',
      properties: { useSSL: 'false' },
      tunnel_config: undefined
    });
    expect(service.refreshSchema).toHaveBeenCalledTimes(1);

    const next = screen.getByRole('button', { name: 'Next' });
    await waitFor(() => expect(next).toBeEnabled());
    await user.click(next);

    await waitFor(() => expect(screen.queryByText('MySQL Config Progress')).not.toBeInTheDocument());
  });

  it('shows why a connection test failed', async () => {
    const message = 'Error while testing connection, cause: Communications link failure';
    const service = fakeConnectionService({
      exists: vi.fn<ConnectionService['exists']>(async () => false),
      test: vi.fn<ConnectionService['test']>(async () => Promise.reject(new ApiError(message, 500, 'db_execute_error')))
    });
    const user = userEvent.setup();
    renderHome(service);

    await user.click(await screen.findByRole('button', { name: 'ClickHouse' }));
    await user.type(await screen.findByLabelText('Host'), 'nohost');
    await user.type(screen.getByLabelText('HTTP Port'), '8123');
    await user.type(screen.getByLabelText('TCP Port'), '9000');
    await user.type(screen.getByLabelText('Username'), 'default');
    await user.click(screen.getByRole('button', { name: /Test connection/ }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('goes back from the form to the type list, and skip closes setup', async () => {
    const user = userEvent.setup();
    renderHome(fakeConnectionService({ exists: vi.fn<ConnectionService['exists']>(async () => false) }));

    await user.click(await screen.findByRole('button', { name: 'MySQL' }));
    await user.click(await screen.findByRole('button', { name: 'Back' }));
    await user.click(await screen.findByRole('button', { name: 'Skip' }));

    await waitFor(() => expect(screen.queryByText(/Setup/)).not.toBeInTheDocument());
  });

  it('opens the saved connection when the first schema fetch failed', async () => {
    const connection = new ClickhouseConnection({ host: 'ch', http_port: 8123, tcp_port: 9000, username: 'default' });
    renderHome(
      fakeConnectionService({
        get: vi.fn<ConnectionService['get']>(async () => connection),
        getRefreshHistory: vi.fn<ConnectionService['getRefreshHistory']>(async () => new RefreshSchemaHistory({ id: 1, status: 'error', is_first_run: true }))
      })
    );

    expect(await screen.findByText('ClickHouse Config')).toBeInTheDocument();
    expect(screen.getByLabelText('Host')).toHaveValue('ch');
    expect(screen.getByLabelText('TCP Port')).toHaveValue('9000');
  });

  it('shows the error of a failed schema fetch and keeps Next disabled', async () => {
    const service = fakeConnectionService({
      exists: vi.fn<ConnectionService['exists']>(async () => false),
      getRefreshHistory: histories(
        { id: 1, status: 'success' },
        {
          id: 2,
          status: 'error',
          stages: [{ name: 'test_connection', status: 'error', message: 'Access denied for user root' }]
        }
      )
    });
    const user = userEvent.setup();
    renderHome(service);

    await user.click(await screen.findByRole('button', { name: 'MySQL' }));
    await user.type(await screen.findByLabelText('Host'), 'db');
    await user.type(screen.getByLabelText('Port'), '3306');
    await user.type(screen.getByLabelText('Username'), 'root');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Access denied for user root')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    const steps = within(screen.getByRole('list', { name: 'Setup steps' })).getAllByRole('listitem');
    expect(steps[0]).toHaveAttribute('data-status', 'error');
  });

  it('loads the SSH public key when the tunnel section opens', async () => {
    const service = fakeConnectionService({ exists: vi.fn<ConnectionService['exists']>(async () => false) });
    const user = userEvent.setup();
    renderHome(service);

    await user.click(await screen.findByRole('button', { name: 'MySQL' }));
    await user.click(await screen.findByText('Connect using an SSH tunnel'));

    await waitFor(() => expect(screen.getByLabelText('Public Key')).toHaveValue('ssh-rsa TEST'));
    expect(service.getSshPublicKey).toHaveBeenCalledTimes(1);
  });

  it('does nothing without the permission', async () => {
    const service = fakeConnectionService({ exists: vi.fn<ConnectionService['exists']>(async () => false) });
    const { permissionService } = renderHome(service, []);

    await waitFor(() => expect(permissionService.isPermitted).toHaveBeenCalledWith('root', [Permission.manageConnection]));
    expect(service.exists).not.toHaveBeenCalled();
    expect(screen.queryByText(/Setup/)).not.toBeInTheDocument();
  });

  it('does nothing when the connection is set up', async () => {
    const service = fakeConnectionService();
    renderHome(service);

    await waitFor(() => expect(service.getRefreshHistory).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
