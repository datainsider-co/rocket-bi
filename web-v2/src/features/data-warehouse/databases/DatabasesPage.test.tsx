import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatabaseService, databaseEntryFromJson } from '@/core/schema/DatabaseService';
import { DatabaseShareService } from '@/core/schema/DatabaseShareService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { clearSession, saveSession } from '@/core/session/session';
import { ResourceSharing } from '@/core/share/ResourceSharing';
import { UserProfile } from '@/core/user/UserProfile';
import { UserService } from '@/core/user/UserService';
import { ApiError } from '@/shared/http/ApiError';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeUserService } from '@/features/dashboard/testing';
import { fakeDatabaseShareService } from '@/features/share/testing';
import { fakeDatabaseService } from '../testing';

const entries = [...fixture.myData.response.data, fixture.multiGets.response[0]].map(databaseEntryFromJson);

function setup(service = fakeDatabaseService({ listMyData: vi.fn<DatabaseService['listMyData']>(async () => entries) })) {
  const router = renderAppAt('/data-warehouse/databases/all', fakeAuthenticationService(), [di => di.bindValue(DatabaseService, service)]);
  return { router, service, user: userEvent.setup() };
}

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('DatabasesPage', () => {
  it('lists the databases by name', async () => {
    setup();

    const table = await screen.findByRole('table');
    // The header row and the 17 databases, all on the first page. Owner and Created Time only show from `md` / `sm`,
    // which jsdom's `matchMedia` never matches.
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(18);
    expect(rows[1]).toHaveTextContent('bi_service_schema');
    expect(rows[17]).toHaveTextContent('sys');
    expect(screen.getByText('Total: 17')).toBeInTheDocument();
  });

  it('searches as the user types', async () => {
    const { user } = setup();
    await screen.findByRole('table');

    await user.type(screen.getByRole('textbox', { name: 'Search database' }), 'DI0');

    expect(screen.getByText('Total: 3')).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Search database' }));
    await user.type(screen.getByRole('textbox', { name: 'Search database' }), 'nothing here');
    expect(screen.getByText('No databases found')).toBeInTheDocument();
  });

  it('opens a database on the Schema page', async () => {
    const { router, user } = setup();

    await user.click(await screen.findByText('sample_v2'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/schema'));
    expect(router.state.location.search).toBe('?database=sample_v2');
  });

  it('deletes a database after the confirm, without opening it', async () => {
    const { router, service, user } = setup();

    await user.click(await screen.findByRole('button', { name: 'Delete dw0_probe' }));
    expect(await screen.findByText("Are you sure you want to permanently delete database 'dw0_probe'?")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(service.delete).toHaveBeenCalledWith('dw0_probe'));
    expect(await screen.findByText('Database dw0_probe deleted')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/data-warehouse/databases/all');
    await waitFor(() => expect(service.listMyData).toHaveBeenCalledTimes(2));
  });

  it("shows the server's message when a delete fails", async () => {
    const service = fakeDatabaseService({
      listMyData: vi.fn<DatabaseService['listMyData']>(async () => entries),
      delete: vi.fn<DatabaseService['delete']>(async () => {
        throw new ApiError('You do not have permissions to perform this action!', 403, 'insufficient_permission');
      })
    });
    const { user } = setup(service);

    await user.click(await screen.findByRole('button', { name: 'Delete dw0_probe' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('You do not have permissions to perform this action!')).toBeInTheDocument();
  });

  it('says when the warehouse has no database', async () => {
    setup(fakeDatabaseService());

    expect(await screen.findByText('Your database is empty')).toBeInTheDocument();
  });

  it('retries after an error', async () => {
    const listMyData = vi
      .fn<DatabaseService['listMyData']>()
      .mockRejectedValueOnce(new ApiError('Failed to fetch', 500, 'internal_error'))
      .mockResolvedValue(entries);
    const { user } = setup(fakeDatabaseService({ listMyData }));

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('shares a database with people only, through its own endpoints', async () => {
    const sharing = fakeDatabaseShareService({
      getSharing: vi.fn<DatabaseShareService['getSharing']>(async () => new ResourceSharing(fixture.shareListAfterCreate.response))
    });
    const ann = { username: 'ann', full_name: 'Ann Lee', email: 'ann@example.com' };
    const users = fakeUserService({
      suggest: vi.fn<UserService['suggest']>(async () => ({ total: 1, users: [{ profile: new UserProfile(ann), json: ann }] }))
    });
    renderAppAt('/data-warehouse/databases/all', fakeAuthenticationService(), [
      di => {
        di.bindValue(DatabaseService, fakeDatabaseService({ listMyData: vi.fn<DatabaseService['listMyData']>(async () => entries) }));
        di.bindValue(DatabaseShareService, sharing);
        di.bindValue(UserService, users);
      }
    ]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Share dw0_probe' }));

    const people = await screen.findByRole('list', { name: 'People with access' });
    expect(within(people).getByText('DW0 Viewer')).toBeInTheDocument();
    expect(sharing.getSharing).toHaveBeenCalledWith('dw0_probe');
    expect(screen.queryByRole('button', { name: 'Get link' })).not.toBeInTheDocument();

    await user.type(screen.getByRole('combobox', { name: 'Add people and groups' }), 'an');
    await user.click(await screen.findByText('Ann Lee', {}, { timeout: 2000 }));
    await user.click(screen.getAllByRole('button', { name: 'Apply' })[0] as HTMLElement);

    await waitFor(() => expect(sharing.shareWithUsers).toHaveBeenCalledWith('dw0_probe', { ann: ['view'] }));
    expect(sharing.editShares).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('list', { name: 'People with access' })).not.toBeInTheDocument());
  });
});
