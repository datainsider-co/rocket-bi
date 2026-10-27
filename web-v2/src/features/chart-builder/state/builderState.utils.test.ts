import { describe, expect, it } from 'vitest';
import { asRecord, type JsonObject } from '@/core/json/json';
import { ChartType } from '@/core/chart-builder/chartType';
import { defaultVizOptions, vizTitleOf } from '@/core/chart-builder/defaultVizOptions';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import stored from '@/core/chart-builder/builder.fixture.json';
import storedDashboard from '@/core/dashboard/dashboard.fixture.json';
import {
  builderExtraDataOf,
  builderReducer,
  builderSettingOf,
  builderStateOf,
  newBuilderState,
  type BuilderAction,
  type BuilderState,
  type DroppedField
} from './builderState.utils';

const field = (name: string, type: string): DroppedField => ({
  field: { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: name, field_type: type },
  columnName: name,
  tableName: 'sales'
});

const region = field('region', 'string');
const revenue = field('total_revenue', 'double');

const run = (state: BuilderState, ...actions: BuilderAction[]) => actions.reduce(builderReducer, state);

const insert = (zoneId: string, dropped: DroppedField, index = 0): BuilderAction => ({ type: 'drop', drop: { type: 'insert', zoneId, index }, field: dropped });

const items = (state: BuilderState, zone: string): readonly FunctionData[] => state.data.configs[zone] ?? [];

const column = () => run(newBuilderState(ChartType.Column), insert('x_axis', region), insert('y_axis', revenue));

const storedWidget = (id: number): JsonObject => {
  const widget = stored.widgets.find(item => item.id === id);
  if (!widget) throw new Error(`no widget ${id}`);
  return widget;
};

describe('newBuilderState', () => {
  it("starts empty with the type's default options and no setting", () => {
    const state = newBuilderState(ChartType.Pie);
    expect(state.data).toEqual({ chartType: ChartType.Pie, configs: {}, filters: {} });
    expect(state.options).toEqual(defaultVizOptions(ChartType.Pie));
    expect(builderSettingOf(state)).toBeUndefined();
  });

  it('has no options for a type v2 does not build', () => {
    expect(newBuilderState('pivot_table').options).toEqual({});
  });
});

describe('builderStateOf', () => {
  it('opens a stored chart on its setting and gives its extra_data back unchanged', () => {
    const widget = storedWidget(31);
    const state = builderStateOf(widget);
    expect(state.data.chartType).toBe(ChartType.Column);
    expect(builderSettingOf(state)).toStrictEqual(widget['setting']);
    expect(builderExtraDataOf(state)).toStrictEqual(widget['extra_data']);
  });

  it('keeps the stored setting of a chart without builder data until the zones change', () => {
    const widget = asRecord(storedDashboard.widgets.find(item => item.class_name === 'chart_v3'));
    const state = builderStateOf(widget);
    expect(state.data.configs).toEqual({});
    expect(builderSettingOf(state)).toStrictEqual(widget['setting']);
    expect(builderSettingOf(run(state, insert('value', revenue)))).not.toEqual(widget['setting']);
  });

  it('shows option changes on the stored setting without rebuilding it', () => {
    const widget = storedWidget(36);
    const options = { class_name: 'number_chart_setting', options: { title: { text: 'Profit' } } };
    const state = run(builderStateOf(widget), { type: 'options', options });
    expect(state.touched).toBe(false);
    expect(builderSettingOf(state)).toStrictEqual({ ...asRecord(widget['setting']), options });
  });
});

describe('drop', () => {
  it("adds a tree column with the zone's default function and builds the setting once the zones are filled", () => {
    const state = column();
    expect(items(state, 'x_axis')).toMatchObject([{ id: 1, functionFamily: 'Group By', name: 'region', sorting: 'Unsorted' }]);
    expect(items(state, 'y_axis')).toMatchObject([{ id: 2, functionFamily: 'Aggregation', functionType: 'Sum' }]);
    expect(builderSettingOf(state)).toMatchObject({ class_name: 'series_chart_setting', x_axis: { name: 'region' }, y_axis: [{ name: 'total_revenue' }] });
  });

  it('sorts a column dropped into Sorting ascending', () => {
    expect(items(run(column(), insert('sorting', revenue)), 'sorting')).toMatchObject([{ id: 3, sorting: 'Ascending' }]);
  });

  it("replaces a full single-item zone's item, keeping its id", () => {
    const state = run(column(), { type: 'drop', drop: { type: 'replace', zoneId: 'x_axis', index: 0 }, field: field('country', 'string') });
    expect(items(state, 'x_axis').map(item => [item.id, item.name])).toEqual([[1, 'country']]);
  });

  it('keeps the function of the replaced item for the same kind of column only', () => {
    const pie = run(newBuilderState(ChartType.Pie), insert('value', revenue));
    const [sum] = items(pie, 'value');
    if (!sum) throw new Error('no item');
    const averaged = run(pie, { type: 'updateItem', zone: 'value', item: { ...sum, functionType: 'Average' } });
    const replace = { type: 'replace', zoneId: 'value', index: 0 } as const;
    expect(items(run(averaged, { type: 'drop', drop: replace, field: field('total_profit', 'double') }), 'value')).toMatchObject([{ name: 'total_profit', functionType: 'Average' }]);
    expect(items(run(averaged, { type: 'drop', drop: replace, field: region }), 'value')).toMatchObject([{ name: 'region', functionType: 'Count all' }]);
  });

  it('adds a chart control as a dynamic item', () => {
    const data = { id: 50, display_name: 'Group by', chart_info_type: 'FunctionController' };
    const control: DroppedField = { field: { class_name: 'chart_control_field', control_data: data }, columnName: 'Group by', tableName: '', dynamicFunction: data };
    expect(items(run(newBuilderState(ChartType.Column), insert('x_axis', control)), 'x_axis')).toMatchObject([{ functionFamily: 'Dynamic', dynamicFunction: data }]);
  });

  it('reorders inside a zone, keeping the items', () => {
    const state = run(column(), insert('y_axis', field('total_profit', 'double'), 1), { type: 'drop', drop: { type: 'reorder', zoneId: 'y_axis', from: 1, to: 0 } });
    expect(items(state, 'y_axis').map(item => [item.id, item.name])).toEqual([
      [3, 'total_profit'],
      [2, 'total_revenue']
    ]);
  });

  it('moves an item to another zone with a new id and that zone sorting, or copies it', () => {
    const moved = run(column(), { type: 'drop', drop: { type: 'transfer', mode: 'move', from: { zoneId: 'x_axis', index: 0 }, to: { zoneId: 'legend_optional', index: 0 } } });
    expect(items(moved, 'x_axis')).toEqual([]);
    expect(items(moved, 'legend_optional')).toMatchObject([{ id: 3, name: 'region', functionFamily: 'Group By', sorting: 'Unsorted' }]);

    const copied = run(column(), { type: 'drop', drop: { type: 'transfer', mode: 'copy', from: { zoneId: 'y_axis', index: 0 }, to: { zoneId: 'sorting', index: 0 } } });
    expect(items(copied, 'y_axis')).toHaveLength(1);
    expect(items(copied, 'sorting')).toMatchObject([{ id: 3, functionType: 'Sum', sorting: 'Ascending' }]);
  });

  it('ignores a tree drop without its column and a drop into a zone the type lacks', () => {
    const state = column();
    expect(run(state, { type: 'drop', drop: { type: 'insert', zoneId: 'x_axis', index: 0 } })).toBe(state);
    expect(run(state, insert('columns', region))).toBe(state);
  });
});

describe('updateItem and removeItem', () => {
  it('replaces an item by id and leaves unknown ids alone', () => {
    const state = column();
    const [sum] = items(state, 'y_axis');
    if (!sum) throw new Error('no item');
    const updated = run(state, { type: 'updateItem', zone: 'y_axis', item: { ...sum, functionType: 'Average' } });
    expect(items(updated, 'y_axis')).toMatchObject([{ id: 2, functionType: 'Average' }]);
    expect(run(state, { type: 'updateItem', zone: 'y_axis', item: { ...sum, id: 99 } })).toBe(state);
  });

  it('makes the other table columns follow one that stops grouping', () => {
    const table = run(newBuilderState(ChartType.Table), insert('columns', region), insert('columns', revenue, 1));
    const [first] = items(table, 'columns');
    if (!first) throw new Error('no item');
    const grouped = run(table, { type: 'updateItem', zone: 'columns', item: { ...first, functionFamily: 'Group By' } });
    expect(items(grouped, 'columns').map(item => item.functionFamily)).toEqual(['Group By', 'Group By']);
  });

  it('removes an item, and does nothing for an unknown one', () => {
    const state = column();
    expect(items(run(state, { type: 'removeItem', zone: 'x_axis', id: 1 }), 'x_axis')).toEqual([]);
    expect(run(state, { type: 'removeItem', zone: 'x_axis', id: 9 })).toBe(state);
    expect(run(state, { type: 'removeItem', zone: 'nowhere', id: 1 })).toBe(state);
  });
});

describe('chartType', () => {
  it('moves the zones across and keeps the title', () => {
    const titled = run(column(), { type: 'options', options: { ...defaultVizOptions(ChartType.Column), options: { title: { text: 'Revenue' } } } });
    const pie = run(titled, { type: 'chartType', chartType: ChartType.Pie });
    expect(Object.fromEntries(Object.entries(pie.data.configs).map(([key, list]) => [key, list.map(item => item.id)]))).toEqual({ legend: [1], value: [2], sorting: [] });
    expect(pie.options['class_name']).toBe('highcharts_pie_chart_setting');
    expect(vizTitleOf(pie.options)).toBe('Revenue');
  });

  it('gives the latest edit back when switching back to its type', () => {
    const state = column();
    const back = run(state, { type: 'chartType', chartType: ChartType.Pie }, { type: 'chartType', chartType: ChartType.Column });
    expect(back.data.configs).toBe(state.data.configs);
    expect(back.options).toBe(state.options);
  });

  it('starts from empty zones before any edit', () => {
    const state = run(newBuilderState(ChartType.Column), { type: 'chartType', chartType: ChartType.Number });
    expect(state.data.configs).toEqual({});
    expect(state.options['class_name']).toBe('number_chart_setting');
  });

  it('ignores the same type and a type v2 does not build', () => {
    const state = column();
    expect(run(state, { type: 'chartType', chartType: ChartType.Column })).toBe(state);
    expect(run(state, { type: 'chartType', chartType: 'pivot_table' })).toBe(state);
  });

  it('leaves out the sorting and filters of a type without those zones', () => {
    const sorted = run(newBuilderState(ChartType.Column), insert('sorting', revenue), { type: 'addCondition', field: region });
    const slicer = run(sorted, { type: 'chartType', chartType: ChartType.SlicerFilter });
    expect(slicer.data.configs['sorting']).toHaveLength(1);
    expect(builderSettingOf(slicer)).toMatchObject({ class_name: 'input_control_chart_setting', sorts: [], filters: [] });
  });
});

describe('conditions', () => {
  const withRegion = () => run(column(), { type: 'addCondition', field: region });

  it('adds a field as a new or-group, then into an and-group', () => {
    const state = run(withRegion(), { type: 'addCondition', field: revenue }, { type: 'addCondition', field: region, groupId: 1 });
    expect(Object.fromEntries(Object.entries(state.data.filters).map(([key, group]) => [key, group.map(condition => [condition.id, condition.subType])]))).toEqual({
      '1': [
        [1, 'in'],
        [3, 'in']
      ],
      '2': [[2, 'equal']]
    });
  });

  it('updates a condition in its group, or adds it there', () => {
    const state = withRegion();
    const condition = state.data.filters['1']?.[0];
    if (!condition) throw new Error('no condition');
    const updated = run(state, { type: 'updateCondition', condition: { ...condition, allValues: ['Asia'] } });
    expect(builderSettingOf(updated)?.['filters']).toEqual([{ class_name: 'and', conditions: [{ class_name: 'in', possible_values: ['Asia'], field: region.field }] }]);
    const added = run(state, { type: 'updateCondition', condition: { ...condition, id: 5, groupId: 8 } });
    expect(Object.keys(added.data.filters)).toEqual(['1', '8']);
  });

  it('adds a condition at an index of its group', () => {
    const state = run(withRegion(), { type: 'addCondition', field: revenue, groupId: 1, index: 0 });
    expect(state.data.filters['1']?.map(condition => condition.id)).toEqual([2, 1]);
  });

  it('moves a condition to another group, dropping its emptied group', () => {
    const state = run(withRegion(), { type: 'addCondition', field: revenue });
    const moved = run(state, { type: 'moveCondition', from: { groupId: 2, index: 0 }, to: { groupId: 1, index: 0 } });
    expect(Object.keys(moved.data.filters)).toEqual(['1']);
    expect(moved.data.filters['1']?.map(condition => [condition.id, condition.groupId])).toEqual([
      [2, 1],
      [1, 1]
    ]);
  });

  it('moves a condition into a new group', () => {
    const state = run(withRegion(), { type: 'addCondition', field: revenue, groupId: 1 });
    const moved = run(state, { type: 'moveCondition', from: { groupId: 1, index: 1 }, to: { index: 0 } });
    expect(Object.fromEntries(Object.entries(moved.data.filters).map(([key, group]) => [key, group.map(condition => [condition.id, condition.groupId])]))).toEqual({
      '1': [[1, 1]],
      '2': [[2, 2]]
    });
  });

  it('reorders a condition inside its group', () => {
    const state = run(withRegion(), { type: 'addCondition', field: revenue, groupId: 1 });
    const moved = run(state, { type: 'moveCondition', from: { groupId: 1, index: 1 }, to: { groupId: 1, index: 0 } });
    expect(moved.data.filters['1']?.map(condition => condition.id)).toEqual([2, 1]);
  });

  it('ignores a move from a missing condition', () => {
    const state = withRegion();
    expect(run(state, { type: 'moveCondition', from: { groupId: 1, index: 3 }, to: { index: 0 } })).toBe(state);
  });

  it('removes a condition with its group once empty, and ignores unknown ones', () => {
    const state = withRegion();
    expect(run(state, { type: 'removeCondition', groupId: 1, id: 1 }).data.filters).toEqual({});
    expect(run(state, { type: 'removeCondition', groupId: 1, id: 7 })).toBe(state);
  });
});

describe('builderReducer', () => {
  it('does not change the state it is given', () => {
    const state = column();
    const snapshot = structuredClone(state);
    run(state, insert('legend_optional', region), { type: 'removeItem', zone: 'y_axis', id: 2 }, { type: 'addCondition', field: region }, { type: 'chartType', chartType: ChartType.Pie });
    expect(state).toEqual(snapshot);
  });
});
