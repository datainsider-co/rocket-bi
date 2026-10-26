import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import filtersFixture from '@/core/dashboard/filters.fixture.json';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeDashboardService } from '@/features/directory/testing';
import { QueryService } from '@/core/query/QueryService';
import { fakeQueryService } from '@/features/dashboard/testing';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/shared/http/ApiError';

/** The page loads lazily and draws charts; under a full parallel run that can take more than the default second. */
const SLOW = { timeout: 5000 };

/** `possible_values` of the column chart's Region condition in its latest query, if the condition applies. */
function regionFilterOfColumn(queries: QueryService): string[] | undefined {
  const calls = vi.mocked(queries.query).mock.calls.map(([request]) => request as { chart_id?: number; query_setting: { filters?: unknown } });
  const last = calls.filter(request => request.chart_id === 4).at(-1);
  const filters = last?.query_setting.filters as { conditions: { final_condition?: { possible_values: string[] } }[] }[] | undefined;
  return filters?.[0]?.conditions[0]?.final_condition?.possible_values;
}

/** Final conditions and measure of the latest "Revenue by country" query (widget 20 of the filters fixture). */
function revenueByCountry(queries: QueryService) {
  const calls = vi.mocked(queries.query).mock.calls.map(([request]) => request as { chart_id?: number; query_setting: Record<string, unknown> });
  const setting = calls.filter(request => request.chart_id === 20).at(-1)?.query_setting;
  const filters = setting?.['filters'] as { conditions: { dynamic_widget_id: number; final_condition?: unknown }[] }[] | undefined;
  const finals = (filters?.[0]?.conditions ?? []).filter(condition => condition.final_condition).map(condition => condition.dynamic_widget_id);
  const measure = (setting?.['y_axis'] as { name: string }[] | undefined)?.[0]?.name;
  return { finals, measure };
}

/** `filter_requests` of the latest query of a chart. */
function filterRequestsOf(queries: QueryService, chartId: number): unknown[] | undefined {
  const calls = vi.mocked(queries.query).mock.calls.map(([request]) => request as { chart_id?: number; filter_requests: unknown[] });
  return calls.filter(request => request.chart_id === chartId).at(-1)?.filter_requests;
}

/** Filling charts and tables wait for their container's size; jsdom lays nothing out, so report one. */
function stubResizeObserver() {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe() {
        this.callback([{ contentRect: { width: 400, height: 300 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    }
  );
}

function renderAt(path: string, get: DashboardService['get']) {
  return renderAppAt(path, fakeAuthenticationService(), [
    di => di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(get) }))
  ]);
}

describe('dashboard page', () => {
  beforeEach(() => saveSession('session-1', 60));
  afterEach(() => {
    clearSession();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the dashboard and its widgets', async () => {
    const get = vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture));
    renderAt('/dashboard/v2-sample-1', get);

    expect(await screen.findByRole('heading', { name: 'v2 Sample' }, SLOW)).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(1);
    // Text widget, rendered as HTML.
    expect(screen.getByText('Sample').tagName).toBe('B');
    // The tab widget's first tab.
    expect(screen.getByRole('tab', { name: 'Pie' })).toBeInTheDocument();
  });

  it('queries and draws each chart', async () => {
    stubResizeObserver();
    renderAt('/dashboard/v2-sample-1', async () => dashboardFromJson(fixture));

    // KPI with its prefix, and the Highcharts charts (column, pie, the pie in the tab) with response categories.
    expect(await screen.findByText('250,771,358.37', {}, SLOW)).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('highcharts-chart')).toHaveLength(3), SLOW);
    expect(screen.getAllByText('North America')).not.toHaveLength(0);
  });

  it('filters the charts that depend on a filter, and resets', { timeout: 15_000 }, async () => {
    const queries = fakeQueryService();
    renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
        di.bindValue(QueryService, queries);
      }
    ]);
    // Charts don't draw here (no layout), so the filter's tag is the only "Asia".
    const regionTag = async (label: string) => (await screen.findByText(label, {}, SLOW)).closest('.ant-tag')!;

    await userEvent.click(await regionTag('Asia'));

    // The column chart (widget 4) has a dynamic condition on the Region filter (widget 8).
    await waitFor(() => expect(regionFilterOfColumn(queries)).toEqual(['Asia']), SLOW);
    await userEvent.click(screen.getByRole('button', { name: /Reset Filters/ }));
    await waitFor(() => expect(regionFilterOfColumn(queries)).toBeUndefined(), SLOW);
    expect(screen.queryByRole('button', { name: /Reset Filters/ })).not.toBeInTheDocument();
  });

  it('applies filter panel changes on Apply, tab control picks at once', { timeout: 15_000 }, async () => {
    const queries = fakeQueryService();
    renderAppAt('/dashboard/v2-filters-2', fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(filtersFixture)) }));
        di.bindValue(QueryService, queries);
      }
    ]);
    await waitFor(() => expect(revenueByCountry(queries).measure).toBe('Revenue'), SLOW);

    // Sales channel (13) sits in the filter panel: the chart waits for Apply. The fake answers every tab filter with
    // regions.
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Asia' }, SLOW));
    expect(screen.getByRole('checkbox', { name: 'Asia' })).toBeChecked();
    expect(revenueByCountry(queries).finals).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(revenueByCountry(queries).finals).toEqual([13]), SLOW);

    // Measure (19) is a tab control: picking Profit swaps the chart's controlled column.
    await userEvent.click(screen.getByText('Profit'));
    await waitFor(() => expect(revenueByCountry(queries).measure).toBe('Profit'), SLOW);
  });

  it('sorts a table on the server and downloads a chart', { timeout: 15_000 }, async () => {
    stubResizeObserver();
    const queries = fakeQueryService();
    const saved = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
        di.bindValue(QueryService, queries);
      }
    ]);
    const tableQueries = () =>
      vi.mocked(queries.query).mock.calls.map(([request]) => request as { chart_id?: number; query_setting: { sorts?: unknown[] } }).filter(request => request.chart_id === 7);

    // The Sales table (widget 7): a header click sorts on the server, from the first page.
    await userEvent.click(await screen.findByRole('columnheader', { name: /country/ }, SLOW));
    await waitFor(() => expect(tableQueries().at(-1)?.query_setting.sorts).toEqual([expect.objectContaining({ class_name: 'order_by', order: 'ASC' })]), SLOW);

    // Its menu downloads every row as CSV.
    const table = document.querySelector<HTMLElement>('[data-widget-id="7"]')!;
    await userEvent.click(within(table).getByRole('button', { name: 'Chart actions' }));
    await userEvent.click(await screen.findByText('Download CSV'));
    await waitFor(() => expect(queries.export).toHaveBeenCalledWith(expect.objectContaining({ chart_id: 7, from: -1, size: -1 }), 'csv'), SLOW);
    await waitFor(() => expect(saved).toHaveBeenCalled(), SLOW);
  });

  it('applies the filters of the URL to every chart, and turns one off from the header', { timeout: 15_000 }, async () => {
    const queries = fakeQueryService();
    // What v1's drill through put in `?filters=`.
    const v1Filter = {
      className: 'dynamic_filter',
      name: 'Region',
      currentValues: ['Asia'],
      currentOptionSelected: 'in',
      isEnable: true,
      field: { className: 'table_field', dbName: 'sample_v2', tblName: 'sales', fieldName: 'region', fieldType: 'string' }
    };
    renderAppAt(`/dashboard/v2-sample-1?filters=${encodeURIComponent(JSON.stringify([v1Filter]))}`, fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
        di.bindValue(QueryService, queries);
      }
    ]);
    const region = {
      filter_id: -1,
      condition: { class_name: 'in', possible_values: ['Asia'], field: { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'region', field_type: 'string' } },
      is_apply_relatively: true,
      is_active: true
    };

    expect(await screen.findByText('Filters (1)', {}, SLOW)).toBeInTheDocument();
    // The KPI (3) has no condition on any filter widget, yet the header filter reaches it.
    await waitFor(() => expect(filterRequestsOf(queries, 3)).toEqual([region]), SLOW);

    await userEvent.click(screen.getByRole('button', { name: 'Turn off Region' }));
    await waitFor(() => expect(filterRequestsOf(queries, 3)).toEqual([]), SLOW);
    await userEvent.click(screen.getByRole('button', { name: /Reset Filters/ }));
    await waitFor(() => expect(filterRequestsOf(queries, 3)).toEqual([region]), SLOW);
  });

  it('rewrites an outdated name in the URL', async () => {
    const router = renderAt('/dashboard/old-name-1?token=abc', async () => dashboardFromJson(fixture));

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/v2-sample-1'), SLOW);
    expect(router.state.location.search).toBe('?token=abc');
  });

  it('goes to All Data when the dashboard does not exist', async () => {
    const router = renderAt('/dashboard/gone-7', async () => {
      throw new ApiError('no dashboard found for id: 7', 404, 'not_found');
    });

    await waitFor(() => expect(router.state.location.pathname).toBe('/mydata'), SLOW);
  });

  it('explains a missing permission', async () => {
    renderAt('/dashboard/secret-2', async () => {
      throw new ApiError('You do not have permissions to perform this action!', 401, 'not_allowed');
    });

    expect(await screen.findByText("You don't have permission to view dashboard", {}, SLOW)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
