import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import { ChartType } from './chartType';
import { functionDataFromJson, type FunctionData } from './FunctionData';
import { convertRowMode } from './functionConvertor';

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
