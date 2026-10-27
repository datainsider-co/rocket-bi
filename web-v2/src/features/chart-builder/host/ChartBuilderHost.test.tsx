import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { DiProvider } from '@/app/di/DiContext';
import stored from '@/core/chart-builder/builder.fixture.json';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import { widgetFromJson, type ChartWidget } from '@/core/dashboard/Widget';
import { createContainer } from '@/core/di/Container';
import { asRecord, type JsonObject } from '@/core/json/json';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { QueryService } from '@/core/query/QueryService';
import { SchemaService } from '@/core/schema/SchemaService';
import type { ChartBuilderRequest } from '@/features/dashboard/edit/chartBuilderBridge';
import type { DashboardEditor } from '@/features/dashboard/edit/useDashboardEditor';
import { DashboardControlsProvider } from '@/features/dashboard/controls/DashboardControlsContext';
import { fakeQueryService, fakeSchemaService } from '@/features/dashboard/testing';
import { ChartBuilderHost } from './ChartBuilderHost';

const dashboard = dashboardFromJson(stored);

const chart = (id: number): ChartWidget => {
  const found = dashboard.widgets.find(widget => widget.id === id);
  if (found?.kind !== 'chart') throw new Error(`no chart ${id}`);
  return found;
};

function fakeEditor() {
  return {
    createWidget: vi.fn<DashboardEditor['createWidget']>(async json => widgetFromJson({ ...json, id: 99 })),
    updateWidget: vi.fn<DashboardEditor['updateWidget']>(async json => widgetFromJson(json))
  };
}

function renderHost(request: ChartBuilderRequest, queries = fakeQueryService()) {
  const editor = fakeEditor();
  const onClose = vi.fn<() => void>();
  const container = createContainer([
    di => {
      di.bindValue(QueryService, queries);
      di.bindValue(SchemaService, fakeSchemaService());
    }
  ]);
  render(
    <DiProvider container={container}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AntApp>
          <DashboardControlsProvider dashboard={dashboard} storage={{ load: () => undefined, save: () => {}, remove: () => {} }}>
            <ChartBuilderHost request={request} dashboard={dashboard} editor={editor as unknown as DashboardEditor} onClose={onClose} />
          </DashboardControlsProvider>
        </AntApp>
      </QueryClientProvider>
    </DiProvider>
  );
  return { editor, onClose };
}

const sentJson = (calls: unknown[][]) => calls[0]?.[0] as JsonObject;

describe('ChartBuilderHost', () => {
  it('picks the type of a new chart first, then builds it', async () => {
    const user = userEvent.setup();
    renderHost({ kind: 'addChart' });
    const types = screen.getByRole('list', { name: 'Chart types' });
    expect(within(types).getByRole('button', { name: 'Collapse Table' })).toBeDisabled();
    await user.click(within(types).getByRole('button', { name: 'Pie' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('region', { name: 'Legend' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(within(dialog).getByText('Drag and drop fields into the zones to build the chart')).toBeInTheDocument();
  });

  it('closes when the picker is cancelled', async () => {
    const user = userEvent.setup();
    const { onClose } = renderHost({ kind: 'addChart' });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('updates a chart once its preview loads', async () => {
    const user = userEvent.setup();
    const { editor, onClose } = renderHost({ kind: 'configChart', chart: chart(31) });
    const update = await screen.findByRole('button', { name: 'Update' });
    await waitFor(() => expect(update).toBeEnabled());
    await user.click(update);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sentJson(editor.updateWidget.mock.calls)).toMatchObject({ id: 31, class_name: 'chart_v3', chart_filter: { id: -41 }, extra_data: { current_chart_type: 'column' } });
  });

  it('saves an inner filter within its chart', async () => {
    const user = userEvent.setup();
    // The fake answers by setting class; a filter's tab control setting gets the tab filter's rows.
    const rows = visualizationResponseFromJson(asRecord(responses)['tab_filter_chart_setting']);
    const { editor } = renderHost({ kind: 'configInnerFilter', chart: chart(31) }, fakeQueryService({ query: async () => rows }));
    const update = await screen.findByRole('button', { name: 'Update' });
    await waitFor(() => expect(update).toBeEnabled());
    await user.click(update);
    await waitFor(() => expect(editor.updateWidget).toHaveBeenCalled());
    expect(sentJson(editor.updateWidget.mock.calls)).toMatchObject({ id: 31, chart_filter: { id: -41, extra_data: { current_chart_type: 'drop_down_filter' } } });
  });

  it('asks before leaving with changes, and leaves at once without', async () => {
    const user = userEvent.setup();
    const { onClose } = renderHost({ kind: 'configChart', chart: chart(31) });
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'More actions for country' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect((await screen.findAllByText('Discard changes?')).length).toBeGreaterThan(0);
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClose).toHaveBeenCalled();
  });
});
