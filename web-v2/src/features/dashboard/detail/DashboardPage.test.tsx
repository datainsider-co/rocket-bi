import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import filtersFixture from '@/core/dashboard/filters.fixture.json';
import { LoginResponse } from '@/core/auth/LoginResponse';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { Directory } from '@/core/directory/Directory';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { PermissionService } from '@/core/permission/PermissionService';
import { ResourcePermissionService } from '@/core/permission/ResourcePermissionService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeDashboardService, fakeDirectoryService } from '@/features/directory/testing';
import { QueryService } from '@/core/query/QueryService';
import { fakeQueryService, fakeResourcePermissionService } from '@/features/dashboard/testing';
import { fakePermissionService } from '@/features/data-source/testing';
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
    // Text widget, rendered as HTML, once the dashboard's password check is done.
    expect((await screen.findByText('Sample', {}, SLOW)).tagName).toBe('B');
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
    // Charts don't draw here (no layout), so the filter's tab is the only "Asia".
    const regionTag = (label: string) => screen.findByRole('button', { name: label }, SLOW);

    await userEvent.click(await regionTag('Asia'));

    // The column chart (widget 4) has a dynamic condition on the Region filter (widget 8).
    await waitFor(() => expect(regionFilterOfColumn(queries)).toEqual(['Asia']), SLOW);
    await userEvent.click(screen.getByRole('button', { name: /Reset Filters/ }));
    await waitFor(() => expect(regionFilterOfColumn(queries)).toBeUndefined(), SLOW);
    expect(screen.queryByRole('button', { name: /Reset Filters/ })).not.toBeInTheDocument();
  });

  it('applies a main date range to the charts that follow it', { timeout: 15_000 }, async () => {
    const queries = fakeQueryService();
    renderAppAt('/dashboard/v2-filters-2', fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(filtersFixture)) }));
        di.bindValue(QueryService, queries);
      }
    ]);
    await waitFor(() => expect(revenueByCountry(queries).measure).toBe('Revenue'), SLOW);
    expect(revenueByCountry(queries).finals).not.toContain(-99887766);

    await userEvent.click(screen.getByRole('button', { name: 'Main date: All Time' }));
    expect(await screen.findByRole('group', { name: 'Start Date' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'End Date' })).toBeInTheDocument();
    // View mode has no Remove or Edit Main Date.
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Date range' }));
    await userEvent.click(await screen.findByTitle('Last Year'));
    await userEvent.click(within(document.querySelector<HTMLElement>('.main-date-popover')!).getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(revenueByCountry(queries).finals).toContain(-99887766), SLOW);
    const year = new Date().getFullYear() - 1;
    expect(screen.getByRole('button', { name: `Main date: 01/01/${year} - 31/12/${year}` })).toBeInTheDocument();
    localStorage.removeItem('main_filter_mode_2');
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

  it('asks for the password of a protected dashboard before showing it', { timeout: 15_000 }, async () => {
    const queries = fakeQueryService();
    // sha256("abc"); the test user is not the owner (root).
    const hashed = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    const directories = fakeDirectoryService({
      get: vi.fn<DirectoryService['get']>(async id => new Directory({ id, directory_type: 'dashboard', data: { config: { enabled: true, hashed_password: hashed } } }))
    });
    renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
        di.bindValue(DirectoryService, directories);
        di.bindValue(QueryService, queries);
      }
    ]);

    const input = await screen.findByLabelText('Password', {}, SLOW);
    expect(queries.query).not.toHaveBeenCalled();
    await userEvent.type(input, 'abd{Enter}');
    expect(await screen.findByText('Password is incorrect!')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Access' }));

    expect(await screen.findByText('Sample', {}, SLOW)).toBeInTheDocument();
    await waitFor(() => expect(queries.query).toHaveBeenCalled(), SLOW);
  });

  it('leaves a protected dashboard on Cancel', async () => {
    const directories = fakeDirectoryService({
      get: vi.fn<DirectoryService['get']>(async id => new Directory({ id, data: { config: { enabled: true, hashed_password: 'x' } } }))
    });
    const router = renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
        di.bindValue(DirectoryService, directories);
      }
    ]);

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }, SLOW));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mydata'), SLOW);
  });

  it('hides downloads from viewers who may not download', { timeout: 15_000 }, async () => {
    const permissions = fakeResourcePermissionService({ permittedActions: vi.fn<ResourcePermissionService['permittedActions']>(async () => ['view']) });
    renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService(), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
        di.bindValue(ResourcePermissionService, permissions);
      }
    ]);

    await screen.findByText('Sample', {}, SLOW);
    await waitFor(() => expect(permissions.permittedActions).toHaveBeenCalledWith('dashboard', 1, expect.arrayContaining(['download'])), SLOW);
    const table = document.querySelector<HTMLElement>('[data-widget-id="7"]')!;
    // Nothing else is in the table's menu, so it has none.
    expect(within(table).queryByRole('button', { name: 'Chart actions' })).not.toBeInTheDocument();
  });

  it('lays the dashboard over the app in full screen, and back', async () => {
    renderAt('/dashboard/v2-sample-1', async () => dashboardFromJson(fixture));
    await screen.findByText('Sample', {}, SLOW);
    const page = document.querySelector('.dashboard-page')!;

    await userEvent.click(screen.getByRole('button', { name: 'Options' }));
    await userEvent.click(await screen.findByText('Full screen'));
    expect(page).toHaveAttribute('data-mode', 'fullscreen');
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Exit full screen' }));
    expect(page).toHaveAttribute('data-mode', 'view');
  });

  it('queries the dashboard as another user, and back', { timeout: 15_000 }, async () => {
    const queries = fakeQueryService();
    const ann = new LoginResponse({ user_info: { username: 'ann' } });
    renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService({}, ann), [
      di => {
        di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
        di.bindValue(PermissionService, fakePermissionService(['rls:view:*']));
        di.bindValue(QueryService, queries);
      }
    ]);
    await screen.findByText('Sample', {}, SLOW);

    await userEvent.click(screen.getByRole('button', { name: 'Options' }));
    await userEvent.click(await screen.findByText('View As', {}, SLOW));
    await userEvent.click(screen.getByRole('combobox', { name: 'User' }));
    await userEvent.click(await screen.findByTitle('root', {}, SLOW));
    await userEvent.click(screen.getByRole('button', { name: 'View As' }));

    // The KPI (3) is queried again as root, with the profile the server sent.
    const root = { username: 'root', full_name: 'root', email: 'hello@gmail.com', gender: 0 };
    await waitFor(() => expect(queries.queryAs).toHaveBeenCalledWith(expect.objectContaining({ chart_id: 3 }), root, expect.anything()), SLOW);
    expect(screen.getByRole('button', { name: /View As:\s*root/ })).toBeInTheDocument();

    const before = vi.mocked(queries.query).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /Exit View As/ }));
    expect(screen.queryByRole('button', { name: /View As:\s*root/ })).not.toBeInTheDocument();
    // Back to the viewer's own data.
    await waitFor(() => expect(vi.mocked(queries.query).mock.calls.length).toBeGreaterThan(before), SLOW);
  });

  it('offers View As only with the rls:view permission', async () => {
    renderAt('/dashboard/v2-sample-1', async () => dashboardFromJson(fixture));
    await screen.findByText('Sample', {}, SLOW);
    await userEvent.click(screen.getByRole('button', { name: 'Options' }));
    expect(await screen.findByText('Full screen')).toBeInTheDocument();
    expect(screen.queryByText('View As')).not.toBeInTheDocument();
  });

  it('shows the embedded dashboard alone, at its embedded URL', async () => {
    const router = renderAt('/embedded/dashboard/old-name-1', async () => dashboardFromJson(fixture));

    expect(await screen.findByText('Sample', {}, SLOW)).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/embedded/dashboard/v2-sample-1'), SLOW);
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Options' })).not.toBeInTheDocument();
    // No app header around it.
    expect(screen.queryByRole('link', { name: 'Dashboards' })).not.toBeInTheDocument();
  });

  it('says an embedded dashboard is missing instead of leaving', async () => {
    const router = renderAt('/embedded/dashboard/gone-7', async () => {
      throw new ApiError('not found', 404, 'not_found');
    });

    expect(await screen.findByText('Dashboard not found', {}, SLOW)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/embedded/dashboard/gone-7');
  });

  describe('edit mode', () => {
    function renderEditable(overrides: Partial<DashboardService> = {}) {
      const dashboards = fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)), ...overrides });
      const router = renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService(), [di => di.bindValue(DashboardService, dashboards)]);
      return { dashboards, router };
    }

    async function startEditing() {
      await screen.findByText('Sample', {}, SLOW);
      await userEvent.click(await screen.findByRole('button', { name: /Edit/ }, SLOW));
      return screen.findByRole('button', { name: /Save/ });
    }

    it('adds a text widget', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: /Adding/ }));
      await userEvent.click(await screen.findByText('Add text'));
      await userEvent.type(await screen.findByRole('textbox', { name: 'Text' }), 'Quarterly notes');
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(dashboards.createWidget).toHaveBeenCalled(), SLOW);
      const [dashboardId, json, position] = vi.mocked(dashboards.createWidget).mock.calls[0]!;
      expect(dashboardId).toBe(1);
      expect(json).toMatchObject({ class_name: 'text_widget', id: -1, content: 'Quarterly notes', is_html_render: false });
      expect(position).toEqual({ row: -1, column: -1, width: 8, height: 3, zIndex: 1 });
      expect(await screen.findByText('Quarterly notes', {}, SLOW)).toBeInTheDocument();
    });

    it('deletes a widget after asking', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();
      const note = document.querySelector<HTMLElement>('[data-widget-id="10"]')!;

      await userEvent.click(within(note).getByRole('button', { name: 'Widget actions' }));
      await userEvent.click(await screen.findByText('Delete'));
      await userEvent.click(await screen.findByRole('button', { name: 'Yes' }));

      await waitFor(() => expect(dashboards.deleteWidget).toHaveBeenCalledWith(1, 10), SLOW);
      await waitFor(() => expect(document.querySelector('[data-widget-id="10"]')).toBeNull(), SLOW);
    });

    it('saves every position on Save and goes back to view', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      const save = await startEditing();

      await userEvent.click(save);

      await waitFor(() => expect(dashboards.resizeWidgets).toHaveBeenCalled(), SLOW);
      const [, positions] = vi.mocked(dashboards.resizeWidgets).mock.calls[0]!;
      expect(Object.keys(positions).map(Number).sort((a, b) => a - b)).toEqual(fixture.widgets.map(widget => widget.id).sort((a, b) => a - b));
      expect(await screen.findByRole('button', { name: /Edit/ })).toBeInTheDocument();
    });

    it('renames the dashboard', { timeout: 15_000 }, async () => {
      const { dashboards, router } = renderEditable();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: 'Rename dashboard' }));
      const input = await screen.findByLabelText('Dashboard Name');
      await userEvent.clear(input);
      await userEvent.type(input, 'Sales 2026{Enter}');

      await waitFor(() => expect(dashboards.rename).toHaveBeenCalledWith(1, 'Sales 2026'), SLOW);
      expect(await screen.findByRole('heading', { name: 'Sales 2026' })).toBeInTheDocument();
      // Still editing the same dashboard at its new URL.
      await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/sales-2026-1'), SLOW);
      expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
    });

    it('asks before leaving while editing', { timeout: 15_000 }, async () => {
      renderEditable();
      await startEditing();
      expect(screen.queryByRole('button', { name: 'Back' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Back' }));
      // antd shows a confirm's title twice (header and body).
      expect((await screen.findAllByText('Leave edit mode?')).length).toBeGreaterThan(0);
      await userEvent.click(screen.getByRole('button', { name: 'Stay' }));
      expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
    });

    it('adds a tab and moves a widget into it', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      const save = await startEditing();
      const tabs = () => document.querySelector<HTMLElement>('[data-widget-id="12"]')!;
      const openTabMenu = async () => userEvent.click(within(tabs()).getAllByRole('button', { name: 'Widget actions' })[0]!);
      const lastEdit = () => vi.mocked(dashboards.editWidget).mock.calls.at(-1)?.[1] as { tab_items: { name: string; widget_ids: number[] }[] };

      await openTabMenu();
      await userEvent.click(await screen.findByText('Add tab'));
      await waitFor(() => expect(lastEdit()?.tab_items.map(tab => tab.name)).toEqual(['Pie', 'Empty', 'New tab']), SLOW);

      await userEvent.click(within(tabs()).getByRole('button', { name: 'Actions of tab Pie' }));
      await userEvent.click(await screen.findByText('Add chart'));
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Note' }));
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await waitFor(() => expect(lastEdit()?.tab_items[0]?.widget_ids).toEqual([11, 10]), SLOW);

      // On Save the note gets a place in the tab's grid.
      await userEvent.click(save);
      await waitFor(() => expect(dashboards.resizeWidgets).toHaveBeenCalled(), SLOW);
      const [, positions] = vi.mocked(dashboards.resizeWidgets).mock.calls[0]!;
      expect(positions[10]!.row).toBeGreaterThanOrEqual(0);
    });

    it("sets a tab widget's header on the left", { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();
      const tabs = document.querySelector<HTMLElement>('[data-widget-id="12"]')!;

      await userEvent.click(within(tabs).getAllByRole('button', { name: 'Widget actions' })[0]!);
      await userEvent.click(await screen.findByText('Config tab'));
      await userEvent.click(await screen.findByText('Left'));
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(dashboards.editWidget).toHaveBeenCalled(), SLOW);
      expect(vi.mocked(dashboards.editWidget).mock.calls[0]![1]).toMatchObject({ id: 12, extra_data: { current_chart_type: 'tab', header: { position: 'vertical' } } });
    });

    it("saves the dashboard's theme from Options → Settings", { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: 'Options' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Settings' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Dashboard Setting')).toBeInTheDocument();
      await userEvent.click(within(dialog).getByRole('button', { name: 'Clear Sky' }));
      expect(within(dialog).getByRole('button', { name: 'Clear Sky' })).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(within(dialog).getByRole('switch', { name: 'Overlap mode' }));
      await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));

      await waitFor(() => expect(dashboards.editSetting).toHaveBeenCalled(), SLOW);
      const [dashboardId, setting] = vi.mocked(dashboards.editSetting).mock.calls[0]!;
      expect(dashboardId).toBe(1);
      expect(setting).toMatchObject({
        theme_name: 'dark_theme1',
        enable_overlap: true,
        background: { color: '#000', opacity: 10 },
        // Saved without a setting, the dashboard had v1's default all time date filter.
        main_date_filter: { id: -99887766, mode: 'all_time' },
        widget_setting: { padding: 15 }
      });
      await waitFor(() => expect(document.querySelector('.dashboard-page')).toHaveAttribute('data-dashboard-theme', 'clear-sky'), SLOW);
    });

    it('edits the widgets from the gear in the corner', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: 'Setting Dashboard' }));
      await userEvent.click(await screen.findByText('Edit Widgets'));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Bold' }));
      await userEvent.click(within(dialog).getByRole('tab', { name: /Padding and Border/ }));
      const padding = within(dialog).getByRole('spinbutton', { name: 'Padding' });
      await userEvent.clear(padding);
      await userEvent.type(padding, '24');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(dashboards.editSetting).toHaveBeenCalled(), SLOW);
      expect(vi.mocked(dashboards.editSetting).mock.calls[0]![1]).toMatchObject({
        theme_name: 'light_default',
        widget_setting: { padding: 24, primary_text: { is_bold: true, font_size: '20px' } }
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), SLOW);
    });

    it('turns auto refresh on from the gear at once', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: 'Setting Dashboard' }));
      await userEvent.hover(await screen.findByText('Auto Refresh Data'));
      await userEvent.click(await screen.findByText('30 Seconds'));

      await waitFor(() => expect(dashboards.editSetting).toHaveBeenCalled(), SLOW);
      expect(vi.mocked(dashboards.editSetting).mock.calls[0]![1]).toMatchObject({ auto_refresh_setting: { is_auto_refresh: true, refresh_interval_ms: 30_000 } });
    });

    it('sets up the main date filter from the header', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable({
        get: vi.fn<DashboardService['get']>(async () => dashboardFromJson({ ...fixture, setting: { theme_name: 'light_theme1' } }))
      });
      await screen.findByText('Sample', {}, SLOW);
      // A stored setting without a main date filter has none, and only edit mode offers one.
      expect(screen.queryByRole('button', { name: /Main date/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Setup Main Date Filter' })).not.toBeInTheDocument();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: 'Setup Main Date Filter' }));
      expect(await screen.findByText('Choose Default Time Range')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Last 30 Days' }));

      await waitFor(() => expect(dashboards.editSetting).toHaveBeenCalled(), SLOW);
      const [, setting] = vi.mocked(dashboards.editSetting).mock.calls[0]!;
      expect(setting).toMatchObject({ theme_name: 'light_theme1', main_date_filter: { id: -99887766, mode: 'last_30_days' } });
      expect(await screen.findByRole('button', { name: /Main date: \d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}/ }, SLOW)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Setup Main Date Filter' })).not.toBeInTheDocument();
      localStorage.removeItem('main_filter_mode_1');
    });

    it('removes the main date filter after asking', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: 'Main date: All Time' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
      expect((await screen.findAllByText('Remove main date filter')).length).toBeGreaterThan(0);
      expect(screen.getByText('Are you sure that you want to remove the main date filter?')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

      await waitFor(() => expect(dashboards.editSetting).toHaveBeenCalled(), SLOW);
      const [, setting] = vi.mocked(dashboards.editSetting).mock.calls[0]!;
      expect(setting).not.toHaveProperty('main_date_filter');
      expect(await screen.findByRole('button', { name: 'Setup Main Date Filter' }, SLOW)).toBeInTheDocument();
    });

    it('chooses the default range again with Edit Main Date', { timeout: 15_000 }, async () => {
      const { dashboards } = renderEditable();
      await startEditing();

      await userEvent.click(screen.getByRole('button', { name: 'Main date: All Time' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Edit Main Date' }));
      await userEvent.click(await screen.findByRole('button', { name: 'This Year' }));

      await waitFor(() => expect(dashboards.editSetting).toHaveBeenCalled(), SLOW);
      expect(vi.mocked(dashboards.editSetting).mock.calls[0]![1]).toMatchObject({ main_date_filter: { id: -99887766, mode: 'this_year' } });
      localStorage.removeItem('main_filter_mode_1');
    });

    it('offers no Edit without the edit permission', async () => {
      renderAppAt('/dashboard/v2-sample-1', fakeAuthenticationService(), [
        di => {
          di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture)) }));
          di.bindValue(ResourcePermissionService, fakeResourcePermissionService({ permittedActions: async () => ['view', 'download'] }));
        }
      ]);
      await screen.findByText('Sample', {}, SLOW);
      await waitFor(() => expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument(), SLOW);
    });
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
