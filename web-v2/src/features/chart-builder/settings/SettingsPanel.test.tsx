import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartType } from '@/core/chart-builder/chartType';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { BuilderProvider, useBuilder } from '../state/BuilderContext';
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

function renderPanel(chartType: string) {
  render(
    <BuilderProvider start={{ chartType }} controls={[]}>
      <SettingsPanel response={response} themeColors={['#111111', '#222222']} />
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

  it('says when a chart type has no settings yet', () => {
    renderPanel(ChartType.DropDown);
    expect(screen.getByText(/settings are not available yet/)).toBeInTheDocument();
  });
});
