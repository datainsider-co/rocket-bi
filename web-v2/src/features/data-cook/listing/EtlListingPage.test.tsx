import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson, type EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeEtlService } from '../testing';

const ETLS: readonly EtlJob[] = fixture.myEtl.response.data.map(etlJobFromJson);
const RUNNING: EtlJob = { ...ETLS[1]!, id: 9, displayName: 'Running ETL', status: 'Running' };

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

function renderListing(path: string, overrides: Partial<EtlService> = {}, rows: readonly EtlJob[] = ETLS) {
  const service = fakeEtlService({ list: vi.fn<EtlService['list']>(async () => ({ total: rows.length, data: rows })), ...overrides });
  const router = renderAppAt(`/data-warehouse/data-cook/${path}`, fakeAuthenticationService(), [
    di => di.bindValue(EtlService, service)
  ]);
  return { service, router };
}

function row(name: string): HTMLElement {
  return screen.getByText(name).closest('tr') as HTMLElement;
}

async function confirmWith(button: string) {
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: button }));
}

describe('EtlListingPage', () => {
  it.each([
    ['my-etl', 'mine'],
    ['shared', 'shared'],
    ['trash', 'trash']
  ])('%s asks for the %s listing, newest first', async (path, listing) => {
    const { service } = renderListing(path);
    await screen.findByText('DC0 probe');

    expect(service.list).toHaveBeenCalledWith(
      listing,
      { from: 0, size: 20, keyword: undefined, sorts: [{ field: 'created_time', order: 'DESC' }] },
      expect.anything()
    );
  });

  it('shows the owner, the last run and the next run', async () => {
    renderListing('my-etl');

    await screen.findByText('DC0 probe');
    const probe = row('DC0 probe');
    expect(within(probe).getByText('Error')).toBeInTheDocument();
    expect(within(probe).getAllByText('root').length).toBeGreaterThan(0);
    // No schedule: the server's Long.MaxValue is no next run.
    expect(within(row('DC0 fixture')).getAllByText('--').length).toBeGreaterThan(0);
  });

  it('searches by name and sorts by a clicked column', async () => {
    const { service } = renderListing('my-etl');
    await screen.findByText('DC0 probe');

    await userEvent.type(screen.getByRole('textbox', { name: 'Search ETL name' }), 'probe');
    await waitFor(() => expect(vi.mocked(service.list).mock.lastCall?.[1].keyword).toBe('probe'));

    await userEvent.click(screen.getByRole('columnheader', { name: 'Name' }));
    await waitFor(() =>
      expect(vi.mocked(service.list).mock.lastCall?.[1].sorts).toEqual([{ field: 'display_name', order: 'ASC' }])
    );
  });

  it('opens the editor from a row', async () => {
    const { router } = renderListing('my-etl');
    await userEvent.click(await screen.findByText('DC0 probe'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/my-etl/dc0-probe-1'));
  });

  it('opens the editor from Edit; Share waits for DC5', async () => {
    const { router } = renderListing('shared');
    await screen.findByText('DC0 v1 ETL');

    await userEvent.click(screen.getByRole('button', { name: 'More actions for DC0 v1 ETL' }));
    expect(await screen.findByRole('menuitem', { name: 'Share' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/my-etl/dc0-v1-etl-2'));
  });

  it('force runs today from the dialog', async () => {
    const { service } = renderListing('my-etl');
    await screen.findByText('DC0 probe');

    await userEvent.click(within(row('DC0 probe')).getByRole('button', { name: 'Force Run' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('DC0 probe')).toBeInTheDocument();
    const before = Date.now();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Force Run' }));

    await waitFor(() => expect(service.forceRun).toHaveBeenCalledWith(1, expect.any(Number)));
    expect(vi.mocked(service.forceRun).mock.lastCall?.[1]).toBeGreaterThanOrEqual(before);
    expect(await screen.findByText('The ETL will run now')).toBeInTheDocument();
  });

  it('cancels a running ETL', async () => {
    const { service } = renderListing('my-etl', {}, [RUNNING]);
    await screen.findByText('Running ETL');

    await userEvent.click(within(row('Running ETL')).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(service.cancel).toHaveBeenCalledWith(9));
    expect(await screen.findByText('ETL cancelled')).toBeInTheDocument();
  });

  it('moves an ETL to the trash after a confirm, from the row menu', async () => {
    const { service } = renderListing('my-etl');
    await screen.findByText('DC0 probe');

    await userEvent.click(screen.getByRole('button', { name: 'More actions for DC0 probe' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(await screen.findByText(/Are you sure to delete 'DC0 probe'\?/)).toBeInTheDocument();
    await confirmWith('Delete');

    await waitFor(() => expect(service.moveToTrash).toHaveBeenCalledWith(1));
  });

  it('restores and deletes forever in the trash, without opening the editor', async () => {
    const { service, router } = renderListing('trash');
    await userEvent.click(await screen.findByText('DC0 probe'));
    expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/trash');
    expect(within(row('DC0 probe')).queryByRole('button', { name: 'Force Run' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Restore DC0 probe' }));
    await confirmWith('Restore');
    await waitFor(() => expect(service.restore).toHaveBeenCalledWith(1));

    await userEvent.click(screen.getByRole('button', { name: 'Delete DC0 v1 ETL forever' }));
    expect(await screen.findByText(/'DC0 v1 ETL' forever/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0));
    const dialog = screen.getAllByRole('dialog').at(-1)!;
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(service.deleteForever).toHaveBeenCalledWith(2));
  });

  it('offers a first ETL on an empty My ETL', async () => {
    renderListing('my-etl', {}, []);

    expect(await screen.findByRole('link', { name: 'ETL' })).toHaveAttribute('href', '/data-warehouse/data-cook/my-etl/create');
  });

  it('says what an empty search found', async () => {
    renderListing('shared', {}, []);
    expect(await screen.findByText("You don't have any ETL yet")).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search ETL name' }), 'xyz');
    expect(await screen.findByText('No ETL matches "xyz"')).toBeInTheDocument();
  });

  it('shows a load error with Retry', async () => {
    const list = vi.fn<EtlService['list']>().mockRejectedValueOnce(new Error('boom')).mockResolvedValue({ total: 0, data: [] });
    renderListing('my-etl', { list });

    expect(await screen.findByText('boom')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Add your first')).toBeInTheDocument();
  });
});
