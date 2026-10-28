import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { DiProvider } from '@/app/di/DiContext';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import stored from '@/core/chart-builder/builder.fixture.json';
import { createContainer } from '@/core/di/Container';
import type { JsonObject } from '@/core/json/json';
import { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { BuilderDndProvider } from '../dnd/BuilderDndProvider';
import { BuilderProvider, useBuilder } from '../state/BuilderContext';
import { ConfigPanel } from './ConfigPanel';

const widget = (id: number): JsonObject => {
  const found = stored.widgets.find(item => item.id === id);
  if (!found) throw new Error(`no widget ${id}`);
  return found;
};

const controls: ChartControl[] = [{ id: 31, title: 'Revenue by country', chartType: 'column', infoType: 'Normal', data: { id: 31 } }];

/** Shows the builder's data, to check what the panel changed. */
function Probe() {
  const { state } = useBuilder();
  return <output data-testid="data">{JSON.stringify(state.data)}</output>;
}

const dataOf = () => JSON.parse(screen.getByTestId('data').textContent ?? '{}') as { configs: Record<string, JsonObject[]>; filters: Record<string, JsonObject[]> };

function renderPanel(widgetId: number) {
  const query = vi.fn<QueryService['query']>(async () =>
    visualizationResponseFromJson({
      class_name: 'json_table_response',
      headers: [{ key: '0', label: 'region', is_group_by: false, is_text_left: true, formatter_key: '' }],
      records: [{ '0': 'Asia' }, { '0': 'Europe' }, { '0': 'Africa' }],
      total: 3
    })
  );
  const container = createContainer([di => di.bindValue(QueryService, { query, queryAs: vi.fn<QueryService['queryAs']>(), export: vi.fn<QueryService['export']>() })]);
  render(
    <DiProvider container={container}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AntApp>
          <BuilderProvider start={{ widget: widget(widgetId) }} controls={controls} dashboardId={3}>
            <BuilderDndProvider>
              <ConfigPanel />
              <Probe />
            </BuilderDndProvider>
          </BuilderProvider>
        </AntApp>
      </QueryClientProvider>
    </DiProvider>
  );
  return { query };
}

describe('ConfigPanel', () => {
  it("shows the chart type's zones, Sorting and the filters", () => {
    renderPanel(31);
    const xAxis = screen.getByRole('region', { name: 'X-Axis' });
    expect(within(xAxis).getByText('country')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Function type of total_profit' })).toHaveTextContent('Average');
    const sorting = screen.getByRole('region', { name: 'Sorting' });
    expect(within(sorting).getByRole('button', { name: 'Sorting of total_revenue' })).toHaveTextContent('Descending');
    expect(within(sorting).getByText('Top 10 value(s)')).toBeInTheDocument();
    const filters = screen.getByRole('region', { name: 'Filters' });
    expect(within(filters).getByText('Asia')).toBeInTheDocument();
    expect(within(filters).getByText('Europe')).toBeInTheDocument();
  });

  it("changes an item's function from its menu", async () => {
    const user = userEvent.setup();
    renderPanel(31);
    await user.click(screen.getByRole('button', { name: 'Function type of total_profit' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Maximum' }));
    expect(dataOf().configs['y_axis']?.[1]).toMatchObject({ name: 'total_profit', functionType: 'Maximum' });
  });

  it('renames an item and sets its top N in the Config dialog', async () => {
    const user = userEvent.setup();
    renderPanel(31);
    await user.click(screen.getByRole('button', { name: 'More actions for total_revenue' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Config' }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText('Display name');
    await user.clear(name);
    await user.type(name, 'Revenue sorted');
    const topN = within(dialog).getByLabelText('Top N');
    await user.clear(topN);
    await user.type(topN, '5');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(dataOf().configs['sorting']?.[0]).toMatchObject({ name: 'Revenue sorted', numElemsShown: 5, sorting: 'Descending' }));
  });

  it('keeps the dialog open on an invalid top N', async () => {
    const user = userEvent.setup();
    renderPanel(31);
    await user.click(screen.getByRole('button', { name: 'More actions for total_revenue' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Config' }));
    const dialog = await screen.findByRole('dialog');
    await user.clear(within(dialog).getByLabelText('Top N'));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('Field is required.')).toBeInTheDocument();
  });

  it('removes an item', async () => {
    const user = userEvent.setup();
    renderPanel(31);
    await user.click(screen.getByRole('button', { name: 'More actions for country' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    expect(dataOf().configs['x_axis']).toEqual([]);
  });

  it("ticks the column's values from the server", async () => {
    const user = userEvent.setup();
    const { query } = renderPanel(31);
    await user.click(screen.getByRole('button', { name: 'Edit filter region' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Africa' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(Object.values(dataOf().filters)[0]?.[0]).toMatchObject({ allValues: ['Asia', 'Europe', 'Africa'] });
    expect(query.mock.calls[0]?.[0]).toMatchObject({ from: 0, size: 80, dashboard_id: 3, query_setting: { class_name: 'table_chart_setting' } });
  });

  it('takes a condition from a chart control', async () => {
    const user = userEvent.setup();
    renderPanel(31);
    await user.click(screen.getByRole('button', { name: 'Edit filter region' }));
    await user.click(await screen.findByRole('radio', { name: 'Chart Control' }));
    await user.click(screen.getByRole('combobox', { name: 'Chart control' }));
    await user.click(await screen.findByText('Revenue by country', { selector: '.ant-select-item-option-content *' }));
    await user.click(screen.getByRole('combobox', { name: 'Control values' }));
    await user.click(await screen.findByText('Selected value', { selector: '.ant-select-item-option-content' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(Object.values(dataOf().filters)[0]?.[0]).toMatchObject({ controlId: 31, allValues: ['selected_value'] });
    expect(screen.getByText('Revenue by country: Selected value')).toBeInTheDocument();
  });

  it('removes a condition with its group', async () => {
    const user = userEvent.setup();
    renderPanel(31);
    await user.click(screen.getByRole('button', { name: 'More actions for filter region' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    expect(dataOf().filters).toEqual({});
  });
});
