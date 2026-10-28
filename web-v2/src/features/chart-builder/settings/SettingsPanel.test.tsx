import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartType } from '@/core/chart-builder/chartType';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import stored from '@/core/chart-builder/builder.fixture.json';
import sent from '@/core/chart-builder/builderRequests.fixture.json';
import type { ControlEntry } from '@/features/dashboard/controls/controls.utils';
import { BuilderProvider, useBuilder } from '../state/BuilderContext';
import type { BuilderStart } from '../state/useBuilderState';
import { SettingsPanel } from './SettingsPanel';

const response: SeriesOneResponse = {
  kind: 'series_one',
  xAxis: ['Asia'],
  yAxis: [],
  series: [
    { name: 'Revenue', data: [1] },
    { name: 'total_profit', data: [2] }
  ]
};

/** Shows the builder's stored viz options, to check what the tabs changed. */
function Probe() {
  const { state } = useBuilder();
  return <output data-testid="options">{JSON.stringify(state.options['options'])}</output>;
}

const options = () => JSON.parse(screen.getByTestId('options').textContent ?? '{}') as Record<string, Record<string, unknown>>;

function renderPanel(start: BuilderStart | string, filterEntry?: ControlEntry) {
  render(
    <BuilderProvider start={typeof start === 'string' ? { chartType: start } : start} controls={[]}>
      <SettingsPanel response={response} themeColors={['#111111', '#222222']} filterEntry={filterEntry} />
      <Probe />
    </BuilderProvider>
  );
}

describe('SettingsPanel', () => {
  it('saves the title on Enter, stored snake_case', async () => {
    renderPanel(ChartType.Column);
    const title = screen.getByRole('textbox', { name: 'Title text' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Revenue by region{Enter}');
    expect(options()['title']).toMatchObject({ text: 'Revenue by region' });
  });

  it('turns the dual axis on with the second series on it', async () => {
    renderPanel(ChartType.Line);
    await userEvent.click(screen.getByText('Dual Y Axis'));
    const [on] = screen.getAllByRole('switch', { name: 'On' });
    if (!on) throw new Error('no On switch');
    await userEvent.click(on);
    expect(options()['y_axis']).toMatchObject([{}, { visible: true }]);
    expect(options()['plot_options']).toMatchObject({ series: { response: { total_profit: { y_axis: 1 } } } });
  });

  it('shows the stack tab on areas only', () => {
    renderPanel(ChartType.Area);
    expect(screen.getByText('Stack')).toBeInTheDocument();
  });

  it('gives pies a label style', async () => {
    renderPanel(ChartType.Pie);
    await userEvent.click(screen.getByText('Data Label'));
    expect(screen.getByText('Label style')).toBeInTheDocument();
  });

  it('lets tables turn their title off', async () => {
    renderPanel(ChartType.Table);
    await userEvent.click(screen.getByRole('switch', { name: 'Title' }));
    expect(options()['title']).toMatchObject({ enabled: false });
  });

  it("colors a collapse table's toggle once its rows expand, and formats its shown columns", async () => {
    renderPanel({ widget: sent.collapse_table });
    const collapseTab = screen.getByText('Collapsed And Expanded');
    await userEvent.click(collapseTab);
    const panel = collapseTab.closest<HTMLElement>('.ant-collapse-item');
    if (!panel) throw new Error('no panel');
    await userEvent.click(within(panel).getByRole('button', { name: 'Revert to default' }));
    expect(options()['toggle_icon']).toEqual({ background_color: 'var(--toggle-color)', color: 'var(--text-color)' });
    await userEvent.click(screen.getByText('Field formatting'));
    await userEvent.click(screen.getByRole('combobox', { name: /Select field/ }));
    expect(screen.getByTitle('units_sold')).toBeInTheDocument();
    expect(screen.queryByTitle('country')).not.toBeInTheDocument();
  });

  it("turns a pivot table's total row off, and gives its grid the total and header lines", async () => {
    renderPanel({ widget: sent.pivot_table });
    expect(screen.getByText('Collapsed And Expanded')).toBeInTheDocument();
    const totalTab = screen.getByText('Total');
    await userEvent.click(totalTab);
    const panel = totalTab.closest<HTMLElement>('.ant-collapse-item');
    if (!panel) throw new Error('no panel');
    await userEvent.click(within(panel).getByRole('switch', { name: 'Show total' }));
    expect(options()['total']).toMatchObject({ enabled: false, label: { text: 'Total' } });
    await userEvent.click(screen.getByText('Grid'));
    expect(screen.getAllByRole('switch', { name: 'Total' })).toHaveLength(2);
  });

  it("saves a filter's selection in the preview as its default, and resets it", async () => {
    const widget = stored.widgets.find(item => item.id === 39);
    if (!widget) throw new Error('no tab filter');
    renderPanel({ widget }, { selected_value: ['Asia'] });
    await userEvent.click(screen.getByRole('button', { name: "Use the preview's selection" }));
    expect(options()['default']).toMatchObject({ setting: { value: ['Asia'], conditions: { class_name: 'in', possible_values: ['Asia'] } } });
    expect(screen.getByText('Asia')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(options()['default']).toMatchObject({ setting: null });
  });

  it('gives a dropdown no tab look', () => {
    renderPanel(ChartType.DropDown);
    expect(screen.getByText('Tab controls')).toBeInTheDocument();
    expect(screen.queryByText('Search box')).not.toBeInTheDocument();
  });
});
