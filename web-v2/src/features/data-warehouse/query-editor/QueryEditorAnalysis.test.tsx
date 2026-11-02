import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import { DashboardService } from '@/core/dashboard/DashboardService';
import type { JsonObject } from '@/core/json/json';
import { ResourceAction, ResourcePermissionService } from '@/core/permission/ResourcePermissionService';
import { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import fixture from '@/core/schema/warehouse.fixture.json';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeQueryService, fakeResourcePermissionService } from '@/features/dashboard/testing';
import { fakeDashboardService } from '@/features/directory/testing';
import type { CodeEditorProps } from '@/shared/code-editor/CodeEditor';

// Monaco doesn't run in jsdom: a textarea stands in for the editor.
vi.mock('@/shared/code-editor/LazyCodeEditor', async () => {
  const { useImperativeHandle } = await import('react');
  return {
    LazyCodeEditor: ({ value, onChange, ariaLabel, handleRef, readOnly }: CodeEditorProps) => {
      useImperativeHandle(handleRef, () => ({ insertText: text => onChange(value + text), selectedText: () => '' }), [value, onChange]);
      return <textarea aria-label={ariaLabel} value={value} readOnly={readOnly} onChange={event => onChange(event.target.value)} />;
    }
  };
});

const RESULT = {
  class_name: 'json_table_response',
  headers: [{ key: '0', label: 'name', is_group_by: false, is_text_left: true }],
  records: [{ '0': 'Phở' }],
  total: 1
};
const query = { ...fixture.analysisCreate.request.widgets[0]!, id: 21 };
const pie = {
  class_name: 'chart_v3',
  id: 23,
  name: 'Qty by name',
  setting: { class_name: 'pie_chart_setting', sql_views: [{ class_name: 'sql_view', alias_name: 'view_pie', query: { class_name: 'sql_query', query: 'select name, qty from t' } }], options: { options: {} } }
};
const analysis = dashboardFromJson({ id: 5, name: 'DW0 Analysis', owner_id: 'root', widgets: [query, pie] });

function setup(path: string, actions?: ResourceAction[]) {
  const dashboards = fakeDashboardService({ get: vi.fn<DashboardService['get']>(async () => analysis) });
  const queries = fakeQueryService({ query: vi.fn<QueryService['query']>(async () => visualizationResponseFromJson(RESULT)) });
  const permissions = fakeResourcePermissionService(actions ? { permittedActions: vi.fn<ResourcePermissionService['permittedActions']>(async () => actions) } : {});
  const router = renderAppAt(path, fakeAuthenticationService(), [
    di => {
      di.bindValue(DashboardService, dashboards);
      di.bindValue(QueryService, queries);
      di.bindValue(ResourcePermissionService, permissions);
    }
  ]);
  return { router, dashboards, queries, user: userEvent.setup() };
}

const settingOf = (widget: JsonObject) => widget['setting'] as JsonObject;

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('Query Editor analyses', { timeout: 15_000 }, () => {
  it('opens a saved analysis with its query run, its charts and where it is saved', async () => {
    const { queries } = setup('/data-warehouse/query-editor?adhoc=5');

    expect(await screen.findByRole('textbox', { name: 'SQL query' })).toHaveValue('select id, name, qty from dw0_probe.products where qty > {{min_qty}}');
    expect(await screen.findByText('Phở')).toBeInTheDocument();
    expect(screen.getByText('DW0 Analysis')).toBeInTheDocument();
    expect(screen.getByText('Qty by name')).toBeInTheDocument();
    expect(screen.getByTestId('parameter-min_qty')).toBeInTheDocument();
    expect(vi.mocked(queries.query).mock.calls[0]![0]).toMatchObject({ parameters: { min_qty: "''" } });
  });

  it('saves only the changed tab, then shows it saved', async () => {
    const { dashboards, user } = setup('/data-warehouse/query-editor?adhoc=5');
    const editor = await screen.findByRole('textbox', { name: 'SQL query' });
    await user.type(editor, ' and id < 5');

    await user.click(screen.getByRole('button', { name: 'Save*' }));

    await waitFor(() => expect(dashboards.editWidget).toHaveBeenCalledTimes(1));
    const [dashboardId, widget] = vi.mocked(dashboards.editWidget).mock.calls[0]!;
    expect(dashboardId).toBe(5);
    expect(widget).toMatchObject({ id: 21, setting: { sql: 'select id, name, qty from dw0_probe.products where qty > {{min_qty}} and id < 5' } });
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows a chart tab with its own SQL', async () => {
    const { user } = setup('/data-warehouse/query-editor?adhoc=5');
    await screen.findByText('Phở');

    await user.click(screen.getByText('Qty by name'));

    expect(await screen.findByRole('textbox', { name: 'SQL query' })).toHaveValue('select name, qty from t');
    expect(screen.getByRole('button', { name: 'Edit chart' })).toBeInTheDocument();
  });

  it('saves a new query as an analysis in the folder picked, then opens it', async () => {
    const { dashboards, router, user } = setup('/data-warehouse/query-editor');
    await user.type(await screen.findByRole('textbox', { name: 'SQL query' }), 'select 1;');
    await user.click(screen.getByRole('button', { name: 'Save Analysis' }));
    await user.type(await screen.findByRole('textbox', { name: 'Analysis name' }), 'My query');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(dashboards.createQuery).toHaveBeenCalled());
    const [name, folderId, widgets] = vi.mocked(dashboards.createQuery).mock.calls[0]!;
    expect([name, folderId]).toEqual(['My query', -1]);
    expect(settingOf(widgets[0]!)).toMatchObject({ class_name: 'raw_query_setting', sql: 'select 1', options: { options: { raw_query: 'select 1;' } } });
    await waitFor(() => expect(router.state.location.search).toBe('?adhoc=51'));
  });

  it('only runs and reads an analysis the user may not edit', async () => {
    setup('/data-warehouse/query-editor?adhoc=5', [ResourceAction.View]);
    await screen.findByText('Phở');

    expect(screen.getByRole('textbox', { name: 'SQL query' })).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: /Save/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Chart/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Param/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Execute/ })).toBeEnabled();
  });
});
