import { describe, expect, it, vi } from 'vitest';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';
import { HttpQueryService } from './QueryService';
import { toQueryRequestJson } from './QueryRequest';
import { visualizationResponseFromJson } from './VisualizationResponse';
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
      series: [{ name: 'sales_channel', data: [['Offline', 587060], ['Online', 441986]] }],
      total: 1029046
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

describe('HttpQueryService', () => {
  it('posts to chart/query and parses the reply', async () => {
    const fetch = vi.fn<(request: Request) => Promise<Response>>(async () => Response.json(responses.pie_chart_setting));
    const service = new HttpQueryService(new HttpClientBuilder('http://api.test').withFetch(fetch).build());

    const response = await service.query({ query_setting: {} });

    expect(fetch.mock.calls[0]?.[0]).toMatchObject({ method: 'POST', url: 'http://api.test/chart/query' });
    expect(response.kind).toBe('series_two');
  });
});
