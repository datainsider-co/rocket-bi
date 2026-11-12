import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import { ChartType } from './chartType';
import { functionDataFromJson, type FunctionData } from './FunctionData';
import { convertFunctions, convertRowMode, convertScatterAxes } from './functionConvertor';

const item = (id: number, family: string, fieldType = 'string', extra: JsonObject = {}) =>
  functionDataFromJson({ id, name: `f${id}`, function_family: family, function_type: '', field: { class_name: 'table_field', field_type: fieldType }, sorting: 'Unsorted', is_nested: false, ...extra });

const families = (configs: Readonly<Record<string, readonly FunctionData[]>>) =>
  Object.fromEntries(Object.entries(configs).map(([key, items]) => [key, items.map(i => [i.functionFamily, i.functionType])]));

describe('convertRowMode', () => {
  it('turns the other items into group by when a column starts grouping, dates by year', () => {
    const before = item(1, 'None');
    const updated = { ...before, functionFamily: 'Group By' };
    const configs = { columns: [updated, item(2, 'None', 'datetime'), item(3, 'None', 'int64')], sorting: [item(4, 'None')] };
    expect(families(convertRowMode(ChartType.Table, 'columns', configs, updated, before))).toEqual({
      columns: [
        ['Group By', ''],
        ['Date histogram', 'Year'],
        ['Group By', '']
      ],
      sorting: [['Group By', '']]
    });
  });

  it('turns the other items into none when a column stops grouping, leaving measures and chart controls', () => {
    const before = item(1, 'Group By');
    const updated = { ...before, functionFamily: 'None' };
    const measure = item(2, 'Aggregation', 'double', { field: { class_name: 'expression_field', field_type: 'double' }, function_type: 'Expression' });
    const control = item(3, 'Dynamic', 'string', { dynamic_function: { id: 9 } });
    const configs = { columns: [updated, measure, control, item(4, 'Aggregation', 'int32')] };
    expect(families(convertRowMode(ChartType.Table, 'columns', configs, updated, before))['columns']).toEqual([
      ['None', ''],
      ['Aggregation', 'Expression'],
      ['Dynamic', ''],
      ['None', '']
    ]);
  });

  it('converts the collapse table the same way', () => {
    const before = item(1, 'Group By');
    const updated = { ...before, functionFamily: 'None' };
    const configs = { columns: [updated, item(2, 'Aggregation', 'double')] };
    expect(families(convertRowMode(ChartType.CollapseTable, 'columns', configs, updated, before))['columns']).toEqual([
      ['None', ''],
      ['None', '']
    ]);
  });

  it('changes nothing when the column stays in the same mode, in another zone or another chart type', () => {
    const before = item(1, 'Group By');
    const updated = { ...before, functionFamily: 'Aggregation' };
    const configs = { columns: [updated, item(2, 'None')] };
    expect(convertRowMode(ChartType.Table, 'columns', configs, updated, before)).toBe(configs);
    const toNone = { ...before, functionFamily: 'None' };
    expect(convertRowMode(ChartType.Table, 'sorting', configs, toNone, before)).toBe(configs);
    expect(convertRowMode(ChartType.Column, 'columns', configs, toNone, before)).toBe(configs);
  });
});

describe('convertScatterAxes', () => {
  const legendOf = (family: string) => item(3, family);
  const axes = { x_axis: [item(1, 'None', 'double')], y_axis: [item(2, 'None', 'datetime')] };

  it('aggregates the axes once the legend groups: numbers summed, the rest counted', () => {
    const updated = legendOf('Group By');
    const configs = { ...axes, legend_optional: [updated] };
    expect(families(convertScatterAxes(ChartType.Scatter, 'legend_optional', configs, updated, legendOf('None')))).toEqual({
      x_axis: [['Aggregation', 'Sum']],
      y_axis: [['Aggregation', 'Count all']],
      legend_optional: [['Group By', '']]
    });
  });

  it('keeps an axis that already aggregates, and chart controls', () => {
    const updated = legendOf('Date histogram');
    const average = { ...item(1, 'Aggregation', 'double'), functionType: 'Average' };
    const control = item(2, 'None', 'double', { dynamic_function: { id: 9 } });
    const configs = { x_axis: [average], y_axis: [control], legend_optional: [updated] };
    const converted = convertScatterAxes(ChartType.Scatter, 'legend_optional', configs, updated, legendOf('None'));
    expect(converted['x_axis']?.[0]).toBe(average);
    expect(converted['y_axis']?.[0]).toBe(control);
  });

  it('lists rows again once the legend stops grouping', () => {
    const updated = legendOf('None');
    const configs = { x_axis: [item(1, 'Aggregation', 'double')], y_axis: [item(2, 'Aggregation')], legend_optional: [updated] };
    expect(families(convertScatterAxes(ChartType.Scatter, 'legend_optional', configs, updated, legendOf('Group By')))).toEqual({
      x_axis: [['None', '']],
      y_axis: [['None', '']],
      legend_optional: [['None', '']]
    });
  });

  it('leaves the configs as they are for another zone, another chart type, or a legend that keeps its mode', () => {
    const updated = legendOf('Group By');
    const configs = { ...axes, legend_optional: [updated] };
    expect(convertScatterAxes(ChartType.Scatter, 'x_axis', configs, updated, legendOf('None'))).toBe(configs);
    expect(convertScatterAxes(ChartType.Bubble, 'legend_optional', configs, updated, legendOf('None'))).toBe(configs);
    expect(convertScatterAxes(ChartType.Scatter, 'legend_optional', configs, updated, legendOf('Date histogram'))).toBe(configs);
  });

  it('does not change its input', () => {
    const updated = legendOf('Group By');
    const configs = { ...axes, legend_optional: [updated] };
    const before = JSON.stringify(configs);
    convertScatterAxes(ChartType.Scatter, 'legend_optional', configs, updated, legendOf('None'));
    expect(JSON.stringify(configs)).toBe(before);
  });
});

describe('convertFunctions', () => {
  it("applies the table's rule and the scatter's, and nothing for other types", () => {
    const before = item(1, 'None');
    const grouped = { ...before, functionFamily: 'Group By' };
    const table = { columns: [grouped, item(2, 'None')] };
    expect(families(convertFunctions(ChartType.Table, 'columns', table, grouped, before))['columns']).toEqual([['Group By', ''], ['Group By', '']]);
    const scatter = { x_axis: [item(2, 'None', 'double')], legend_optional: [grouped] };
    expect(families(convertFunctions(ChartType.Scatter, 'legend_optional', scatter, grouped, before))['x_axis']).toEqual([['Aggregation', 'Sum']]);
    const column = { x_axis: [grouped], y_axis: [item(2, 'None')] };
    expect(convertFunctions(ChartType.Column, 'x_axis', column, grouped, before)).toBe(column);
  });
});
