import { describe, expect, it } from 'vitest';
import { asRecord, type JsonObject } from '@/core/json/json';
import { builderDataFromJson } from './BuilderData';
import { CHART_TYPES, chartIconOf, chartTypeInfoOf, ChartKind, defaultFunctionOf, functionInfoForFamily, newFunctionData, pickerItemsOf, SORTING_ZONE } from './chartCatalogue';
import { ChartType } from './chartType';
import { canBuildSetting } from './querySetting';
import sent from './builderRequests.fixture.json';

const widgets = sent as Record<string, JsonObject>;

const field = (type: string, className = 'table_field') => ({ class_name: className, db_name: 'sample_v2', tbl_name: 'sales', field_name: 'region', field_type: type });

const zoneOf = (chartType: string, key: string) => {
  const zone = chartTypeInfoOf(chartType)?.zones.find(item => item.key === key);
  if (!zone) throw new Error(`no zone ${key} for ${chartType}`);
  return zone;
};

describe('CHART_TYPES', () => {
  it('lists every chart type once', () => {
    expect(new Set(CHART_TYPES.map(info => info.type)).size).toBe(CHART_TYPES.length);
    expect(CHART_TYPES.map(info => info.type).sort()).toEqual(Object.values(ChartType).sort());
  });

  it('keeps the zones v1 stored for every chart made in CB0', () => {
    for (const widget of Object.values(widgets)) {
      const extraData = asRecord(widget['extra_data']);
      const info = chartTypeInfoOf(String(extraData['current_chart_type']));
      const keys = [...(info?.zones.map(zone => zone.key) ?? []), SORTING_ZONE.key];
      expect(keys).toEqual(expect.arrayContaining(Object.keys(asRecord(extraData['configs']))));
    }
  });

  it('shows the bar zones as Y-Axis then X-Axis, stored as x_axis and y_axis', () => {
    expect(chartTypeInfoOf(ChartType.Bar)?.zones.map(zone => [zone.key, zone.title])).toEqual([
      ['x_axis', 'Y-Axis'],
      ['y_axis', 'X-Axis'],
      ['legend_optional', 'Legend']
    ]);
  });

  it('tells the inner filters and the input filters without Sorting and Filters apart', () => {
    expect(chartTypeInfoOf(ChartType.DropDownInnerFilter)?.kind).toBe(ChartKind.InnerFilter);
    expect(chartTypeInfoOf(ChartType.SlicerFilter)?.extraZones).toBe(false);
    expect(chartTypeInfoOf(ChartType.Column)?.extraZones).toBe(true);
  });
});

describe('chartIconOf', () => {
  it.each([
    [ChartType.Donut, 'ic_donut.svg'],
    ['pivot_table', 'ic_pivot_table.svg'],
    ['unknown', 'chart_control.svg']
  ])('%s has %s', (chartType, icon) => {
    expect(chartIconOf(chartType)).toBe(icon);
  });
});

describe('defaultFunctionOf', () => {
  it.each([
    [ChartType.Column, 'x_axis', 'string', 'Group By', ''],
    [ChartType.Column, 'x_axis', 'datetime', 'Date histogram', 'Year'],
    [ChartType.Column, 'y_axis', 'double', 'Aggregation', 'Sum'],
    [ChartType.Column, 'y_axis', 'string', 'Aggregation', 'Count all'],
    [ChartType.Table, 'columns', 'int32', 'None', ''],
    [ChartType.TabFilter, 'values', 'int64', 'Aggregation', 'Sum'],
    [ChartType.SlicerFilter, 'value', 'int32', 'None', '']
  ])('%s %s starts a %s column as %s %s', (chartType, key, type, family, functionType) => {
    expect(defaultFunctionOf(field(type), zoneOf(chartType, key))).toEqual({ family, type: functionType });
  });

  it('falls back to v1 defaults without a zone, and aggregates a measure by its expression', () => {
    expect(defaultFunctionOf(field('double'))).toEqual({ family: 'Aggregation', type: 'Sum' });
    expect(defaultFunctionOf(field('datetime'), SORTING_ZONE)).toEqual({ family: 'Date histogram', type: 'Year' });
    expect(defaultFunctionOf(field('double', 'expression_field'), zoneOf(ChartType.Column, 'x_axis'))).toEqual({ family: 'Aggregation', type: 'Expression' });
  });
});

describe('functionInfoForFamily', () => {
  it.each([
    ['string', 'Aggregation', 'Aggregation', 'Count all'],
    ['int64', 'Aggregation', 'Aggregation', 'Sum'],
    ['datetime', 'Aggregation', 'Aggregation', 'Count all'],
    ['datetime', 'Group By', 'Group By', ''],
    ['int64', 'Date histogram', 'Date histogram', 'Year'],
    ['string', 'None', 'None', ''],
    ['int64', 'Dynamic', 'Aggregation', 'Sum']
  ])('a %s column picked as %s is %s %s', (type, family, expectedFamily, expectedType) => {
    expect(functionInfoForFamily(field(type), family)).toEqual({ family: expectedFamily, type: expectedType });
  });

  it('keeps a measure on its expression', () => {
    expect(functionInfoForFamily(field('double', 'expression_field'), 'Group By')).toEqual({ family: 'Aggregation', type: 'Expression' });
  });
});

describe('newFunctionData', () => {
  it('makes the item v1 made for a dropped field', () => {
    const stored = builderDataFromJson(asRecord(widgets['inner_filter'])['extra_data']).configs['values']?.[0];
    if (!stored) throw new Error('the inner filter fixture has no item');
    const item = newFunctionData({ id: stored.id, field: stored.field, columnName: 'region', tableName: 'sales', zone: zoneOf(ChartType.DropDownInnerFilter, 'values') });
    expect(item).toEqual(stored);
  });

  it('makes a chart control dropped into a zone a dynamic item holding its data', () => {
    const control = { id: 50, display_name: 'Group by', chart_info_type: 'FunctionController' };
    const item = newFunctionData({
      id: 3,
      field: { class_name: 'chart_control_field', control_data: control },
      columnName: 'Group by',
      tableName: '',
      dynamicFunction: control,
      zone: zoneOf(ChartType.Column, 'x_axis')
    });
    expect(item).toMatchObject({ functionFamily: 'Dynamic', functionType: '', name: 'Group by', dynamicFunction: control });
  });

  it('sorts ascending in the Sorting zone', () => {
    const item = newFunctionData({ id: 1, field: field('double'), columnName: 'total', tableName: 'sales', zone: SORTING_ZONE });
    expect(item).toMatchObject({ functionFamily: 'Aggregation', functionType: 'Sum', sorting: 'Ascending' });
  });

  it('fills the zones a chart needs', () => {
    const x = newFunctionData({ id: 1, field: field('string'), columnName: 'region', tableName: 'sales', zone: zoneOf(ChartType.Column, 'x_axis') });
    const y = newFunctionData({ id: 2, field: field('double'), columnName: 'total', tableName: 'sales', zone: zoneOf(ChartType.Column, 'y_axis') });
    expect(canBuildSetting({ chartType: ChartType.Column, configs: { x_axis: [x], y_axis: [y] }, filters: {} })).toBe(true);
  });
});

describe('pickerItemsOf', () => {
  it("lists v1's charts then the filter widgets, the ones v2 doesn't build disabled", () => {
    const items = pickerItemsOf(ChartKind.Chart);
    expect(items).toHaveLength(39 + 9);
    expect(items[0]).toEqual({ type: 'flatten_table', title: 'Table', icon: 'ic_table.svg', buildable: true });
    expect(items[1]).toEqual({ type: 'table', title: 'Collapse Table', icon: 'ic_collapse_table.svg', buildable: false });
    expect(items.at(-1)).toMatchObject({ type: 'multi_tree_filter', buildable: true });
    expect(items.filter(item => item.buildable)).toHaveLength(CHART_TYPES.length - 2);
  });

  it('lists the inner filter types for an inner filter', () => {
    expect(pickerItemsOf(ChartKind.InnerFilter).map(item => item.type)).toEqual(['drop_down_filter', 'tab_inner_filter']);
  });
});
