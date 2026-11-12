import { describe, expect, it, vi } from 'vitest';
import { asRecord } from '@/core/json/json';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { HttpQueryService } from './QueryService';
import { pagingOf, toQueryRequestJson } from './QueryRequest';
import { responseHasData, visualizationResponseFromJson } from './VisualizationResponse';
// `POST chart/query` replies from the local backend for the sample dashboard (records cut to 3).
import responses from './queryResponses.fixture.json';

const settingOf = (id: number) => fixture.widgets.find(widget => widget.id === id)!.setting as Record<string, unknown>;

describe('toQueryRequestJson', () => {
  it('builds the body the backend accepted, without viz options', () => {
    expect(toQueryRequestJson({ setting: settingOf(4), dashboardId: 1, chartId: 4 })).toEqual({
      query_setting: { ...settingOf(4), options: {} },
      filter_requests: [],
      from: -1,
      size: -1,
      use_boost: false,
      dashboard_id: 1,
      chart_id: 4,
      parameters: {}
    });
  });

  it('pages tables from their first 20 rows unless told otherwise', () => {
    expect(toQueryRequestJson({ setting: { class_name: 'table_chart_setting' } })).toMatchObject({ from: 0, size: 20 });
    expect(toQueryRequestJson({ setting: { class_name: 'table_chart_setting' }, paging: { from: 40, size: 20 } })).toMatchObject({
      from: 40,
      size: 20
    });
  });

  it('asks a pivot table with columns for its first row group only', () => {
    const group = (name: string) => ({ name, function: { class_name: 'group' } });
    const setting = { class_name: 'pivot_table_chart_setting', columns: [group('channel')], rows: [group('region'), group('country')], values: [] };
    expect(asRecord(toQueryRequestJson({ setting })['query_setting'])['rows']).toEqual([group('region')]);
  });
});

describe('visualizationResponseFromJson', () => {
  it('reads series one responses', () => {
    const response = visualizationResponseFromJson(responses.series_chart_setting);
    expect(response).toMatchObject({ kind: 'series_one', xAxis: expect.arrayContaining(['Asia', 'Europe']) });
    expect(response.kind === 'series_one' && response.series[0]?.name).toBe('Revenue');
  });

  it('reads pie points as name and value', () => {
    expect(visualizationResponseFromJson(responses.pie_chart_setting)).toEqual({
      kind: 'series_two',
      series: [{ name: 'sales_channel', data: [['Offline', 587060], ['Online', 441986]], points: [['Offline', 587060], ['Online', 441986]] }],
      total: 1029046
    });
  });

  it('reads the words of a word cloud and their weights', () => {
    const json = { class_name: 'word_cloud_response', name: '', data: [{ name: 'Albania', weight: 2104 }, { name: 'Algeria', weight: 9681 }] };
    const response = visualizationResponseFromJson(json);
    expect(response).toEqual({ kind: 'word_cloud', name: '', data: [{ name: 'Albania', weight: 2104 }, { name: 'Algeria', weight: 9681 }] });
    expect(responseHasData(response)).toBe(true);
    expect(responseHasData(visualizationResponseFromJson({ class_name: 'word_cloud_response', data: [] }))).toBe(false);
  });

  it("keeps a scatter's and a bubble's points as the server sent them", () => {
    const json = { class_name: 'series_two_response', series: [{ name: 'Online', data: [[651.21, 9247, 3.5]] }] };
    const response = visualizationResponseFromJson(json);
    expect(response.kind === 'series_two' && response.series[0]?.points).toEqual([[651.21, 9247, 3.5]]);
  });

  it('reads generic rows as they are, a value per column', () => {
    expect(visualizationResponseFromJson(responses.generic_chart_setting)).toEqual({
      kind: 'generic',
      headers: ['sales_channel', 'Units', 'Average units'],
      records: [
        ['Offline', 587060, 5699.6117],
        ['Online', 441986, 4556.5567]
      ]
    });
  });

  it('reads json tables with their header keys', () => {
    const response = visualizationResponseFromJson(responses.table_chart_setting);
    expect(response.kind).toBe('json_table');
    if (response.kind !== 'json_table') return;
    expect(response.headers.map(header => [header.key, header.label, header.isTextLeft])).toEqual([
      ['0', 'region', true],
      ['1', 'country', true],
      ['2', 'item_type', true],
      ['3', 'total_revenue', false]
    ]);
    expect(response.records[0]).toMatchObject({ '0': 'North America', '3': '6021738.87' });
  });

  it("reads a pivot table's grouped headers and their totals", () => {
    const response = visualizationResponseFromJson(responses.pivot_table_chart_setting);
    if (response.kind !== 'json_table') throw new Error('not a json table');
    const [region, offline] = response.headers;
    expect(region).toMatchObject({ key: '960db2', label: 'region', isGroupBy: true });
    expect(region).not.toHaveProperty('total');
    expect(offline).toMatchObject({ key: '', label: 'Offline' });
    expect(offline?.children.map(header => [header.key, header.label, header.total])).toEqual([
      ['e1015b', 'total_revenue', '1.2792258188999999E8'],
      ['d28fcf', 'units_sold', '587060']
    ]);
  });

  it("reads a table's min and max per column", () => {
    const response = visualizationResponseFromJson({
      class_name: 'json_table_response',
      headers: [],
      records: [],
      min_max_values: [{ value_name: 'total_revenue', min: 2733.69, max: 6456747.15 }, { value_name: 'bad', min: null, max: 1 }]
    });
    expect(response.kind === 'json_table' && response.minMaxValues).toEqual([{ valueName: 'total_revenue', min: 2733.69, max: 6456747.15 }]);
  });

  it('reads compared values of number charts', () => {
    const response = visualizationResponseFromJson({
      class_name: 'series_one_response',
      series: [{ name: 'p', data: [2] }],
      compare_responses: { RawValues: { class_name: 'series_one_response', series: [{ name: 'p', data: [1] }] } }
    });
    expect(response.kind === 'series_one' && response.compareValue).toBe(1);
  });

  it('reads filter values as rows', () => {
    const response = visualizationResponseFromJson(responses.tab_filter_chart_setting);
    expect(response).toMatchObject({ kind: 'table', headers: ['label', 'value'], records: [['Asia', 'Asia'], expect.anything(), expect.anything()] });
  });

  it('keeps nulls in series data', () => {
    const response = visualizationResponseFromJson({ class_name: 'series_one_response', series: [{ name: 'a', data: [1, null] }] });
    expect(response.kind === 'series_one' && response.series[0]?.data).toEqual([1, null]);
  });

  it('marks unknown responses', () => {
    expect(visualizationResponseFromJson({ class_name: 'map_response' })).toEqual({ kind: 'unsupported', className: 'map_response' });
  });
});

describe('responseHasData', () => {
  it('is false for series without points', () => {
    expect(responseHasData({ kind: 'series_one', series: [{ name: 'a', data: [] }], xAxis: [], yAxis: [] })).toBe(false);
    expect(responseHasData({ kind: 'series_one', series: [{ name: 'a', data: [null] }], xAxis: ['x'], yAxis: [] })).toBe(true);
    expect(responseHasData({ kind: 'series_two', series: [], total: 0 })).toBe(false);
  });

  it('goes by the total of tables and the rows of generic responses', () => {
    expect(responseHasData({ kind: 'table', headers: ['a'], records: [], total: 0 })).toBe(false);
    expect(responseHasData({ kind: 'json_table', headers: [], records: [], total: 3 })).toBe(true);
    expect(responseHasData({ kind: 'generic', headers: [], records: [] })).toBe(false);
  });

  it('leaves unknown responses to the renderer', () => {
    expect(responseHasData({ kind: 'unsupported', className: 'x' })).toBe(true);
  });
});

describe('HttpQueryService', () => {
  it('posts to chart/query and parses the reply', async () => {
    const fetch = vi.fn<(request: Request) => Promise<Response>>(async () => Response.json(responses.pie_chart_setting));
    const service = new HttpQueryService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());

    const response = await service.query({ query_setting: {} });

    expect(fetch.mock.calls[0]?.[0]).toMatchObject({ method: 'POST', url: 'http://api.test/chart/query' });
    expect(response.kind).toBe('series_two');
  });

  it('posts View As queries with the user as sent by the server', async () => {
    const bodies: unknown[] = [];
    const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
      bodies.push(await request.clone().json());
      return Response.json(responses.pie_chart_setting);
    });
    const service = new HttpQueryService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());
    const user = { username: 'ann', properties: { 'team.region': 'Asia' } };

    const response = await service.queryAs({ query_setting: {} }, user);

    expect(fetch.mock.calls[0]?.[0]).toMatchObject({ method: 'POST', url: 'http://api.test/chart/view_as' });
    // Body accepted by the local backend.
    expect(bodies[0]).toEqual({ query_request: { query_setting: {} }, user_profile: user });
    expect(response.kind).toBe('series_two');
  });
});

describe('pagingOf', () => {
  const page = { from: 40, size: 20 };
  const withPoints = (className: string, numDataPoint?: unknown) => ({ class_name: className, options: { options: { num_data_point: numDataPoint } } });

  it('gives a table the page it shows, and other charts none', () => {
    expect(pagingOf({ class_name: 'table_chart_setting' }, page)).toBe(page);
    expect(pagingOf({ class_name: 'series_chart_setting' }, page)).toBeUndefined();
  });

  it.each(['scatter_chart_setting', 'bubble_chart_setting'])('asks for the first rows of a %s, as many as its max data point', className => {
    expect(pagingOf(withPoints(className, 250), page)).toEqual({ from: 0, size: 250 });
    expect(pagingOf(withPoints(className, '500'), page)).toEqual({ from: 0, size: 500 });
  });

  it.each([undefined, 0, -5, 'many'])('falls back to 1000 rows for a max data point of %s', numDataPoint => {
    expect(pagingOf(withPoints('scatter_chart_setting', numDataPoint), page)).toEqual({ from: 0, size: 1000 });
    expect(pagingOf({ class_name: 'bubble_chart_setting' }, page)).toEqual({ from: 0, size: 1000 });
  });
});
