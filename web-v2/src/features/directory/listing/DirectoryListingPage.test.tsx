import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { DefaultDirectoryId, Directory, DirectoryParents } from '@/core/directory/Directory';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { ShareService } from '@/core/share/ShareService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeShareService } from '@/features/share/testing';
import { fakeDashboardService, fakeDirectoryService } from '../testing';

const OWNER = { username: 'root', full_name: 'Root User' };
const SALES = new Directory({ id: 2, name: 'Sales', parent_id: 1, directory_type: 'directory', owner: OWNER });
const ARCHIVE = new Directory({ id: 5, name: 'Archive', parent_id: 1, directory_type: 'directory', owner: OWNER });
const KPI = new Directory({
  id: 3,
  name: 'KPI',
  parent_id: 1,
  directory_type: 'dashboard',
  dashboard_id: 9,
  is_starred: true,
  owner: OWNER
});

function renderAt(path: string, directories: DirectoryService, dashboards = fakeDashboardService(), share = fakeShareService()) {
  return renderAppAt(path, fakeAuthenticationService(), [
    di => {
      di.bindValue(DirectoryService, directories);
      di.bindValue(DashboardService, dashboards);
      di.bindValue(ShareService, share);
    }
  ]);
}

async function openSettings(name: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Settings of ${name}` }));
}

describe('directory listing', () => {
  beforeEach(() => {
    saveSession('session-1', 60);
    // A wide screen: the Action column only shows from `md` up.
    vi.spyOn(window, 'matchMedia').mockImplementation(
      query =>
        ({
          matches: true,
          media: query,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {}
        }) as unknown as MediaQueryList
    );
  });
  afterEach(() => {
    clearSession();
    vi.restoreAllMocks();
  });

  it('redirects home to All Data and lists the root', async () => {
    const service = fakeDirectoryService({ list: vi.fn<DirectoryService['list']>(async () => [KPI, SALES]) });
    const router = renderAt('/', service);

    expect(await screen.findByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('KPI')).toBeInTheDocument();
    expect(screen.getByLabelText('Starred')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/mydata');
    expect(service.list).toHaveBeenCalledWith(DefaultDirectoryId.MyData, [{ field: 'name', order: 'ASC' }]);
  });

  it('opens a folder, with its breadcrumb, and a dashboard', async () => {
    const service = fakeDirectoryService({
      list: vi.fn<DirectoryService['list']>(async id => (id === 2 ? [] : [KPI, SALES])),
      getParents: vi.fn<DirectoryService['getParents']>(
        async () =>
          new DirectoryParents({
            parent_directories: [
              { id: 1, name: 'root-root', parent_id: -1 },
              { id: 2, name: 'Sales', parent_id: 1 }
            ]
          })
      )
    });
    const router = renderAt('/mydata', service);

    await userEvent.click(await screen.findByText('Sales'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/mydata/sales-2'));
    expect(await screen.findByText('Your dashboard listing is empty', { exact: false })).toBeInTheDocument();
    expect(service.getParents).toHaveBeenCalledWith(2);
    // The breadcrumb, since the folder itself is empty.
    expect(screen.getByText('Sales')).toBeInTheDocument();

    await userEvent.click(within(screen.getByRole('navigation', { name: 'Directory' })).getByText('All Data'));
    await userEvent.click(await screen.findByText('KPI'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/kpi-9'));
  });

  it('creates a folder in the open folder and opens it', async () => {
    const service = fakeDirectoryService();
    const router = renderAt('/mydata/sales-2', service);

    await userEvent.click(await screen.findByRole('button', { name: 'New' }));
    await userEvent.click(await screen.findByText('Folder'));
    await userEvent.click(await screen.findByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Field is required.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Folder name'), 'Q1');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/mydata/q1-100'));
    expect(service.createFolder).toHaveBeenCalledWith('Q1', 2);
  });

  it('shows the server error when creating a dashboard fails', async () => {
    const dashboards = fakeDashboardService({
      create: vi.fn<DashboardService['create']>(async () => {
        throw new Error('Dashboard already exists');
      })
    });
    renderAt('/starred', fakeDirectoryService(), dashboards);

    await userEvent.click(await screen.findByRole('button', { name: 'New' }));
    await userEvent.click(await screen.findByText('Dashboard'));
    await userEvent.type(await screen.findByLabelText('Dashboard name'), 'KPI');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Dashboard already exists')).toBeInTheDocument();
    expect(dashboards.create).toHaveBeenCalledWith('KPI', DefaultDirectoryId.MyData);
  });

  it('renames a dashboard through the dashboard API', async () => {
    const service = fakeDirectoryService({ list: vi.fn<DirectoryService['list']>(async () => [KPI]) });
    const dashboards = fakeDashboardService();
    renderAt('/mydata', service, dashboards);

    await openSettings('KPI');
    await userEvent.click(await screen.findByText('Rename'));
    const input = await screen.findByRole('textbox', { name: 'Name' });
    expect(input).toHaveValue('KPI');
    await userEvent.clear(input);
    await userEvent.type(input, 'KPI 2026');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(dashboards.rename).toHaveBeenCalledWith(9, 'KPI 2026'));
    expect(service.rename).not.toHaveBeenCalled();
  });

  it('moves a folder into another one', async () => {
    const service = fakeDirectoryService({ list: vi.fn<DirectoryService['list']>(async id => (id === 5 ? [] : [ARCHIVE, SALES])) });
    renderAt('/mydata', service);

    await openSettings('Sales');
    await userEvent.click(await screen.findByText('Move to'));
    const dialog = await screen.findByRole('dialog', { name: 'Move "Sales" to' });
    // The folder being moved is not a target.
    expect(within(dialog).queryByText('Sales')).not.toBeInTheDocument();
    await userEvent.click(await within(dialog).findByText('Archive'));
    expect(await within(dialog).findByText('No folders')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Select' }));

    await waitFor(() => expect(service.move).toHaveBeenCalledWith(2, 5));
  });

  it('stars and removes from the settings menu', async () => {
    const service = fakeDirectoryService({ list: vi.fn<DirectoryService['list']>(async () => [SALES]) });
    renderAt('/mydata', service);

    await openSettings('Sales');
    await userEvent.click(await screen.findByText('Add to starred'));
    await waitFor(() => expect(service.star).toHaveBeenCalledWith(2));

    await openSettings('Sales');
    await userEvent.click(await screen.findByText('Remove'));
    expect(await screen.findByText("Are you sure to delete folder 'Sales'?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(service.remove).toHaveBeenCalledWith(2));
  });

  it('shares a folder from its row and reloads the listing after Apply', async () => {
    const service = fakeDirectoryService({ list: vi.fn<DirectoryService['list']>(async () => [SALES]) });
    const share = fakeShareService();
    renderAt('/mydata', service, fakeDashboardService(), share);

    await userEvent.click(await screen.findByRole('button', { name: 'Share Sales' }));
    expect(await screen.findByRole('list', { name: 'People with access' })).toBeInTheDocument();
    expect(share.getSharing).toHaveBeenCalledWith({ type: 'directory', id: 2 }, 0, 100);

    await userEvent.click(screen.getByRole('button', { name: 'Get link' }));
    expect(await screen.findByRole('textbox', { name: 'Link' })).toHaveValue(`${window.location.origin}/shared/sales-2?token=tok-1`);
    expect(screen.queryByRole('switch', { name: 'Password protection' })).not.toBeInTheDocument();
    const loads = vi.mocked(service.list).mock.calls.length;
    await userEvent.click(screen.getAllByRole('button', { name: 'Apply' })[0] as HTMLElement);

    await waitFor(() => expect(screen.queryByRole('list', { name: 'People with access' })).not.toBeInTheDocument());
    await waitFor(() => expect(vi.mocked(service.list).mock.calls.length).toBeGreaterThan(loads));
  });

  it('restores and deletes forever in Trash, where rows do not open', async () => {
    const service = fakeDirectoryService({ listTrash: vi.fn<DirectoryService['listTrash']>(async () => [SALES]) });
    const router = renderAt('/trash', service);

    await userEvent.click(await screen.findByText('Sales'));
    expect(router.state.location.pathname).toBe('/trash');

    await userEvent.click(screen.getByRole('button', { name: 'Restore Sales' }));
    await waitFor(() => expect(service.restore).toHaveBeenCalledWith(2));

    await userEvent.click(screen.getByRole('button', { name: 'Delete Sales' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(service.deleteForever).toHaveBeenCalledWith(2));
  });

  it('shows a load error with Retry', async () => {
    const list = vi.fn<DirectoryService['list']>(async () => {
      throw new Error('Load failed');
    });
    renderAt('/mydata', fakeDirectoryService({ list }));

    expect(await screen.findByText('Load failed')).toBeInTheDocument();
    list.mockResolvedValue([SALES]);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Sales')).toBeInTheDocument();
  });
});
