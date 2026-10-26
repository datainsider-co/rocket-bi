import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/dashboard/filters.fixture.json';
import type { ChartWidget, Widget } from '@/core/dashboard/Widget';
import { buildChartQuery } from './chartQuery.utils';
import { MAIN_DATE_ID } from './controls.utils';

const dashboard = dashboardFromJson(fixture);
const widgets = new Map<number, Widget>(dashboard.widgets.map(widget => [widget.id, widget]));
const chart = (id: number) => widgets.get(id) as ChartWidget;

/** Final conditions of the "Revenue by country" chart, by control id. */
function finals(controls: Parameters<typeof buildChartQuery>[1]) {
  const filters = buildChartQuery(chart(20), controls, widgets).setting['filters'] as Record<string, unknown>[];
  const conditions = filters[0]!['conditions'] as Record<string, unknown>[];
  return Object.fromEntries(conditions.filter(c => c['final_condition']).map(c => [c['dynamic_widget_id'], c['final_condition']]));
}

describe('buildChartQuery', () => {
  it('leaves a chart without controls as stored', () => {
    expect(buildChartQuery(chart(21), {}, widgets)).toEqual({ setting: chart(21).setting, filterRequests: [], parameters: {} });
  });

  it('applies the main date, slicer and tree values', () => {
    const result = finals({
      [MAIN_DATE_ID]: { min_value: ['2015-01-01 00:00:00'], max_value: ['2015-12-31 23:59:59'] },
      14: { min_value: ['100'], max_value: ['400'] },
      17: { keys: ['Region//Asia'], selected_value: ['Asia'] }
    });
    expect(result[MAIN_DATE_ID]).toMatchObject({ min: '2015-01-01 00:00:00', max: '2015-12-31 23:59:59' });
    expect(result[14]).toMatchObject({ class_name: 'between_and_including', min: '100', max: '400' });
    expect(result[17]).toMatchObject({ class_name: 'in', possible_values: ['Asia'] });
  });

  it('puts the picked tab control column in place of the controlled one', () => {
    const setting = buildChartQuery(chart(20), { 19: { selected_value: ['profit_1'] } }, widgets).setting;
    expect(setting['y_axis']).toEqual([expect.objectContaining({ name: 'Profit', dynamic_function_id: 19 })]);
  });

  it('turns the inner filter selection into a filter request on the chart', () => {
    const pie = chart(22);
    const { filterRequests } = buildChartQuery(pie, { [pie.chartFilter!.id]: { selected_value: ['Asia'] } }, widgets);
    expect(filterRequests).toEqual([expect.objectContaining({ filter_id: 22, condition: expect.objectContaining({ possible_values: ['Asia'] }) })]);
    expect(buildChartQuery(pie, {}, widgets).filterRequests).toEqual([]);
  });

  it('sends the parameter input value, else the stored one', () => {
    expect(buildChartQuery(chart(24), {}, widgets).parameters).toEqual({ min_units: '5000' });
    expect(buildChartQuery(chart(24), { 23: { selected_value: ['9000'] } }, widgets).parameters).toEqual({ min_units: '9000' });
  });
});
