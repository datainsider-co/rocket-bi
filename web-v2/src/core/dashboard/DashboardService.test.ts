import { describe, expect, it, vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { HttpDashboardService } from './DashboardService';

function setup(body: unknown) {
  const requests: { method: string; url: string; body: string }[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    requests.push({ method: request.method, url: request.url, body: await request.clone().text() });
    return Response.json(body);
  });
  const service = new HttpDashboardService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
  return { service, requests, sent: () => JSON.parse(requests[0]?.body || 'null') as unknown };
}

describe('HttpDashboardService', () => {
  it('creates a dashboard with snake_case fields', async () => {
    // Reply of `POST dashboards/create` from the local backend.
    const { service, requests, sent } = setup({
      org_id: 0,
      id: 1,
      name: 'probe-dash',
      creator_id: 'root',
      owner_id: 'root',
      widgets: [],
      widget_positions: {}
    });

    const dashboard = await service.create('probe-dash', 2);

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/dashboards/create' });
    expect(sent()).toEqual({ name: 'probe-dash', parent_directory_id: 2, directory_type: 'dashboard' });
    expect(dashboard).toMatchObject({ id: 1, name: 'probe-dash', ownerId: 'root' });
  });

  it('gets a dashboard with its widgets', async () => {
    const { service, requests } = setup({ id: 5, name: 'Sales', owner_id: 'root', widgets: [{ class_name: 'text_widget', id: 9 }], widget_positions: {} });

    const dashboard = await service.get(5);

    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/dashboards/5' });
    expect(dashboard).toMatchObject({ id: 5, name: 'Sales', widgets: [{ id: 9, kind: 'text' }] });
  });

  it('renames with to_name', async () => {
    const { service, requests, sent } = setup({ success: true });

    await service.rename(1, 'KPI');

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/dashboards/1/rename' });
    expect(sent()).toEqual({ to_name: 'KPI' });
  });

  it('saves every widget position with z_index', async () => {
    const { service, requests, sent } = setup({ success: true });

    await service.resizeWidgets(3, {
      1: { row: 4, column: 0, width: 7, height: 2, zIndex: 0 },
      2: { row: 0, column: 7, width: 5, height: 6, zIndex: 1 }
    });

    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'http://api.test/dashboards/3/widgets/resize' });
    // Body accepted by the local backend.
    expect(sent()).toEqual({
      positions: {
        '1': { row: 4, column: 0, width: 7, height: 2, z_index: 0 },
        '2': { row: 0, column: 7, width: 5, height: 6, z_index: 1 }
      }
    });
  });

  it('lists drill through dashboards', async () => {
    // Reply of the local backend, the dashboard cut to what is read.
    const { service, requests, sent } = setup({ total: 1, data: [{ org_id: 0, id: 2, name: 'v2 Filters', owner_id: 'root', widgets: [] }] });
    const field = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'region', field_type: 'string' };

    const page = await service.listDrillThrough({ fields: [field], excludeIds: [1], from: 0, size: 40 });

    expect(requests[0]).toMatchObject({ method: 'POST', url: 'http://api.test/dashboards/list_drill_through' });
    // Body accepted by the local backend.
    expect(sent()).toEqual({ fields: [field], exclude_ids: [1], from: 0, size: 40, is_removed: false });
    expect(page).toMatchObject({ total: 1, dashboards: [{ id: 2, name: 'v2 Filters' }] });
  });

  it('gets the directory id of a dashboard', async () => {
    // The local backend answers a bare number.
    const { service, requests } = setup(8);

    expect(await service.getDirectoryId(1)).toBe(8);
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'http://api.test/dashboards/1/get_directory_id' });
  });
});
