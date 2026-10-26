import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import {
  applyDynamicFunctions,
  functionKey,
  isFunctionControl,
  referencedFunctionIds,
  selectedColumns
} from './dynamicFunctions';

const revenue = { name: 'Revenue', function: { class_name: 'sum', field: 'revenue' } };
const profit = { name: 'Total Profit', function: { class_name: 'sum', field: 'profit' } };
const control: JsonObject = {
  class_name: 'tab_control_chart_setting',
  values: [revenue, profit],
  options: { class_name: 'tab_filter_chart_setting', options: {} }
};

const controlled = (name: string) => ({ name, function: { class_name: 'sum', field: 'x' }, dynamic_function_id: 19 });

describe('isFunctionControl', () => {
  it('is a tab control with several columns', () => {
    expect(isFunctionControl(control)).toBe(true);
  });

  it.each([
    ['one column', { ...control, values: [revenue] }],
    ['a tree filter', { ...control, options: { class_name: 'tree_filter_chart_setting' } }],
    ['another setting', { ...control, class_name: 'series_chart_setting' }]
  ])('is not %s', (_, setting) => {
    expect(isFunctionControl(setting)).toBe(false);
  });
});

describe('selectedColumns', () => {
  it('maps keys to columns marked with the control id', () => {
    expect(functionKey(profit, 1)).toBe('totalProfit_1');
    expect(selectedColumns(control, ['totalProfit_1'], 19)).toEqual([{ ...profit, is_dynamic_function: true, dynamic_function_id: 19 }]);
  });

  it('skips keys without a column', () => {
    expect(selectedColumns(control, ['x_5', 'nope'], 19)).toEqual([]);
  });
});

describe('referencedFunctionIds', () => {
  it('finds controlled columns and sorts, not filters or options', () => {
    const setting = {
      x_axis: controlled('x'),
      y_axis: [{ name: 'y' }, { ...controlled('y'), dynamic_function_id: 7 }],
      sorts: [{ function: { class_name: 'dynamic_function', dynamic_widget_id: 8 } }],
      filters: [{ dynamic_function_id: 1 }],
      options: { dynamic_function_id: 2 }
    };
    expect([...referencedFunctionIds(setting)].sort()).toEqual([19, 7, 8].sort());
  });
});

describe('applyDynamicFunctions', () => {
  const picked = selectedColumns(control, ['revenue_0', 'totalProfit_1'], 19);

  it('replaces a single column by the first pick and a list by all of them, once', () => {
    const setting = { x_axis: controlled('x'), y_axis: [{ name: 'count' }, controlled('a'), controlled('b')] };
    expect(applyDynamicFunctions(setting, { 19: picked })).toEqual({ x_axis: picked[0], y_axis: [{ name: 'count' }, ...picked] });
  });

  it('expands sorts on the control into one per pick', () => {
    const sort = { function: { class_name: 'dynamic_function', dynamic_widget_id: 19 }, order: 'ASC' };
    const result = applyDynamicFunctions({ sorts: [sort, sort, { order: 'DESC' }] }, { 19: picked });
    expect(result['sorts']).toEqual([
      { ...sort, function: { ...sort.function, final_function: revenue.function } },
      { ...sort, function: { ...sort.function, final_function: profit.function } },
      { order: 'DESC' }
    ]);
  });

  it('leaves other controls, empty picks and the input alone', () => {
    const setting = { value: controlled('v'), values: [controlled('a')] };
    const copy = structuredClone(setting);
    expect(applyDynamicFunctions(setting, { 5: picked, 19: [] })).toEqual(setting);
    expect(applyDynamicFunctions(setting, {})).toBe(setting);
    expect(setting).toEqual(copy);
  });
});
