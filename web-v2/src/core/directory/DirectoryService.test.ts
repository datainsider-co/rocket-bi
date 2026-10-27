import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { DefaultDirectoryId, DirectoryType } from './Directory';
import { HttpDirectoryService, SortOrder } from './DirectoryService';

/** Shape of one item of `POST directories/{id}/list` from the local backend. */
const DASHBOARD_JSON = {
  id: 3,
  name: 'probe-dash',
  owner: { username: 'root', full_name: 'root', gender: 0 },
  created_date: 0,
  parent_id: 2,
  is_removed: false,
  directory_type: 'dashboard',
  dashboard_id: 1,
  updated_date: 1792685626918,
  is_starred: true
};

function setup(body: unknown = { success: true }) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return Response.json(body);
  });
  const service = new HttpDirectoryService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
  const sent = (index = 0) => JSON.parse(requests[index]?.body || 'null') as unknown;
  return { service, requests, sent };
}

describe('HttpDirectoryService', () => {
  it('lists a directory and parses snake_case items', async () => {
    const { service, requests, sent } = setup([DASHBOARD_JSON]);

    const [item] = await service.list(2, [{ field: 'name', order: SortOrder.Asc }]);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/directories/2/list' });
    expect(sent()).toEqual({ sorts: [{ field: 'name', order: 'ASC' }], from: 0, size: 10000 });
    expect(item).toMatchObject({
      id: 3,
      parentId: 2,
      directoryType: DirectoryType.Dashboard,
      dashboardId: 1,
      isStarred: true,
      updatedDate: 1792685626918
    });
    expect(item?.owner.displayName).toBe('root');
  });

  it('reads a non-array reply as empty', async () => {
    const { service } = setup({});
    await expect(service.listTrash([])).resolves.toEqual([]);
  });

  it.each([
    ['listSharedWithMe', 'directories/-2/list/shared'],
    ['listRecent', 'directories/recent'],
    ['listStarred', 'directories/star'],
    ['listTrash', 'directories/trash']
  ] as const)('%s posts to %s', async (method, path) => {
    const { service, requests } = setup([]);

    await (method === 'listSharedWithMe' ? service.listSharedWithMe(-2, []) : service[method]([]));

    expect(requests[0]).toMatchObject({ method: 'POST', url: `http://api.test/${path}` });
  });

  it('parses the parents', async () => {
    const { service } = setup({
      root_directory: { id: 1, parent_id: -1 },
      is_all: true,
      parent_directories: [
        { id: 1, name: 'root-root', parent_id: -1 },
        { id: 2, name: 'v2-probe', parent_id: 1 }
      ]
    });

    const parents = await service.getParents(2);

    expect(parents.isAll).toBe(true);
    expect(parents.rootDirectory.id).toBe(1);
    expect(parents.parentDirectories.map(item => [item.id, item.parentId])).toEqual([
      [1, -1],
      [2, 1]
    ]);
  });

  it('creates a folder with snake_case fields', async () => {
    const { service, requests, sent } = setup({ id: 9, name: 'New', parent_id: 1, directory_type: 'directory' });

    const created = await service.createFolder('New', DefaultDirectoryId.MyData);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/directories/create' });
    expect(sent()).toEqual({ name: 'New', parent_id: -1, is_removed: false, directory_type: 'directory' });
    expect(created).toMatchObject({ id: 9, isFolder: true });
  });

  it('renames with to_name', async () => {
    const { service, requests, sent } = setup();
    await service.rename(4, 'B');
    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/directories/4/rename' });
    expect(sent()).toEqual({ to_name: 'B' });
  });

  it('moves with to_parent_id', async () => {
    const { service, requests, sent } = setup();
    await service.move(4, 1);
    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/directories/4/move' });
    expect(sent()).toEqual({ to_parent_id: 1 });
  });

  it.each([
    ['remove', 'PUT', 'directories/4/remove'],
    ['restore', 'PUT', 'directories/4/restore'],
    ['deleteForever', 'DELETE', 'directories/trash/4/delete'],
    ['star', 'POST', 'directories/4/star'],
    ['unstar', 'POST', 'directories/4/unstar']
  ] as const)('%s sends %s %s', async (method, verb, path) => {
    const { service, requests } = setup();
    await service[method](4);
    expect(requests[0]).toMatchObject({ method: verb, url: `http://api.test/${path}` });
  });

  it('sets a password on the whole directory, other data kept', async () => {
    // Directory 9 of the local backend, with an unknown key in `data`.
    const { service, requests, sent } = setup({ ...DASHBOARD_JSON, id: 9, data: { extra: 1 } });

    await service.setPassword(9, 'ba7816bf');

    expect(requests.map(request => `${request.method} ${request.url}`)).toEqual([
      'GET http://api.test/directories/9',
      'PUT http://api.test/directories/9'
    ]);
    // Body accepted by the local backend.
    expect(sent(1)).toEqual({ ...DASHBOARD_JSON, id: 9, data: { extra: 1, config: { enabled: true, hashed_password: 'ba7816bf' } } });
  });

  it('adds data to a directory that has none', async () => {
    const { service, sent } = setup(DASHBOARD_JSON);

    await service.setPassword(3, 'ab');

    expect(sent(1)).toEqual({ ...DASHBOARD_JSON, data: { config: { enabled: true, hashed_password: 'ab' } } });
  });

  it('removes the password by dropping config', async () => {
    const { service, sent } = setup({ ...DASHBOARD_JSON, data: { config: { enabled: true, hashed_password: 'ab' } } });

    await service.setPassword(3, undefined);

    expect(sent(1)).toEqual({ ...DASHBOARD_JSON, data: {} });
  });
});
