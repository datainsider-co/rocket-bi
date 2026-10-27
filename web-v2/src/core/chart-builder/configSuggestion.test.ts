import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import { chartTypeInfoOf, type ChartTypeInfo } from './chartCatalogue';
import { ChartType } from './chartType';
import { suggestConfigs } from './configSuggestion';
import { functionDataFromJson } from './FunctionData';

const item = (id: number, family: string, type = '') =>
  functionDataFromJson({ id, name: `f${id}`, function_family: family, function_type: type, field: { field_type: 'string' }, sorting: 'Unsorted', is_nested: false } as JsonObject);

const info = (chartType: string): ChartTypeInfo => {
  const found = chartTypeInfoOf(chartType);
  if (!found) throw new Error(chartType);
  return found;
};

const ids = (configs: Record<string, readonly { id: number }[]>) => Object.fromEntries(Object.entries(configs).map(([key, items]) => [key, items.map(i => i.id)]));

describe('suggestConfigs', () => {
  const group = item(1, 'Group By');
  const sum = item(2, 'Aggregation', 'Sum');
  const avg = item(3, 'Aggregation', 'Average');
  const legend = item(4, 'Group By');
  const sorted = { ...item(5, 'Group By'), sorting: 'Ascending' };

  it('keeps the zones with the same key and the sorting, between series types', () => {
    const column = { x_axis: [group], y_axis: [sum, avg], legend_optional: [legend], sorting: [sorted] };
    expect(ids(suggestConfigs(info(ChartType.Line), column))).toEqual({ x_axis: [1], y_axis: [2, 3], legend_optional: [4], sorting: [5] });
  });

  it('fills a zone with the first items of other zones whose family it takes, up to its max', () => {
    const column = { x_axis: [group], y_axis: [sum, avg], legend_optional: [legend] };
    expect(ids(suggestConfigs(info(ChartType.Pie), column))).toEqual({ legend: [1], value: [2], sorting: [] });
  });

  it('puts an item in one zone only', () => {
    const pie = { legend: [group], value: [sum] };
    expect(ids(suggestConfigs(info(ChartType.Column), pie))).toEqual({ x_axis: [1], y_axis: [2], legend_optional: [], sorting: [] });
  });

  it('takes items from several zones into a zone without a max, keeping their function', () => {
    const column = { x_axis: [group], y_axis: [sum, avg], legend_optional: [legend] };
    const table = suggestConfigs(info(ChartType.Table), column);
    expect(ids(table)).toEqual({ columns: [1, 2, 3, 4], sorting: [] });
    expect(table['columns']?.[1]).toBe(sum);
  });

  it('counts the max over every zone it takes from', () => {
    const many = { a: [item(1, 'Aggregation', 'Sum')], b: [item(2, 'Aggregation', 'Sum')], c: [item(3, 'Aggregation', 'Sum')] };
    const narrowInfo: ChartTypeInfo = { ...info(ChartType.Column), zones: [{ key: 'y_axis', title: 'Y-Axis', optional: false, families: ['Aggregation'], maxItems: 3 }] };
    expect(ids(suggestConfigs(narrowInfo, many))).toEqual({ y_axis: [1, 2, 3], sorting: [] });
  });

  it('leaves a zone empty when nothing fits and does not change its input', () => {
    const previous = { y_axis: [sum] };
    const snapshot = structuredClone(previous);
    expect(ids(suggestConfigs(info(ChartType.Pie), previous))).toEqual({ legend: [], value: [2], sorting: [] });
    expect(previous).toEqual(snapshot);
  });
});
