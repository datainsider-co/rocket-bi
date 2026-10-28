import { describe, expect, it } from 'vitest';
import type { BuilderData } from '@/core/chart-builder/BuilderData';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { ChartType } from '@/core/chart-builder/chartType';
import { newConditionData } from '@/core/chart-builder/ConditionData';
import { functionDataFromJson } from '@/core/chart-builder/FunctionData';
import { resolveDrop, type DragSource } from '@/shared/field-dnd/fieldDnd.utils';
import type { FieldTreePayload } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';
import {
  builderActionOf,
  builderTransferMode,
  builderZoneRules,
  configZonesOf,
  dragLookOf,
  droppedControl,
  FILTER_ZONE,
  filterGroupsOf,
  groupIdOf,
  groupZoneId,
  hasFilterZone
} from './builderDnd.utils';

const field = (name: string, type: string, className = 'table_field') => ({ class_name: className, db_name: 'db', tbl_name: 'sales', field_name: name, field_type: type });

const dropped = (name: string, type: string, className?: string): DroppedField => ({ field: field(name, type, className), columnName: name, tableName: 'sales' });

const region = dropped('region', 'string');
const measure = dropped('profit', 'double', 'expression_field');

const fromTree = (payload: FieldTreePayload): DragSource => ({ kind: 'external', payload });
const column = (value: DroppedField) => fromTree({ kind: 'column', field: value });

const control = (infoType: ChartControl['infoType']): ChartControl => ({ id: 9, title: 'Group by', chartType: 'tab_filter', infoType, data: { id: 9 } });

const item = (id: number, name: string, type = 'string', overrides: Record<string, unknown> = {}) =>
  functionDataFromJson({ id, name, function_family: 'Group By', field: field(name, type), sorting: 'Unsorted', is_nested: false, column_name: name, table_name: 'sales', ...overrides });

const condition = (id: number, groupId: number, name: string) => newConditionData({ id, groupId, field: field(name, 'string'), columnName: name, tableName: 'sales' });

const data: BuilderData = {
  chartType: ChartType.Column,
  configs: {
    x_axis: [item(1, 'region')],
    y_axis: [item(2, 'revenue', 'double', { function_family: 'Aggregation', function_type: 'Sum' })],
    sorting: []
  },
  filters: { '4': [condition(1, 4, 'country'), condition(2, 4, 'city')] }
};

describe('zone ids', () => {
  it('names a filter group and reads it back', () => {
    expect(groupZoneId(4)).toBe('filters:4');
    expect(groupIdOf('filters:4')).toBe(4);
  });

  it.each([FILTER_ZONE, 'x_axis', 'filters:x'])('reads no group from %s', zoneId => {
    expect(groupIdOf(zoneId)).toBeUndefined();
  });
});

describe('configZonesOf and hasFilterZone', () => {
  it('adds Sorting after the zones of a chart', () => {
    expect(configZonesOf(ChartType.Column).map(zone => zone.key)).toEqual(['x_axis', 'y_axis', 'legend_optional', 'sorting']);
    expect(hasFilterZone(ChartType.Column)).toBe(true);
  });

  it('shows neither Sorting nor Filters for a slicer', () => {
    expect(configZonesOf(ChartType.SlicerFilter).map(zone => zone.key)).toEqual(['value']);
    expect(hasFilterZone(ChartType.SlicerFilter)).toBe(false);
  });

  it('has no zones for a type v2 does not build', () => {
    expect(configZonesOf('arearange')).toEqual([]);
    expect(hasFilterZone('arearange')).toBe(false);
  });
});

describe('filterGroupsOf', () => {
  it('lists the groups with their numeric id', () => {
    expect(filterGroupsOf(data).map(([groupId, conditions]) => [groupId, conditions.length])).toEqual([[4, 2]]);
  });
});

describe('droppedControl', () => {
  it('makes the control a chart control field carrying its data', () => {
    expect(droppedControl(control('FunctionController'))).toEqual({
      field: { class_name: 'chart_control_field', db_name: '', tbl_name: '', field_name: '', field_type: '', control_data: { id: 9 } },
      columnName: 'Group by',
      tableName: '',
      dynamicFunction: { id: 9 }
    });
  });
});

describe('builderZoneRules', () => {
  const rules = builderZoneRules(data);
  const accepts = (zoneId: string, source: DragSource) => rules[zoneId]?.accepts?.(source) ?? true;

  it('describes the config zones, the Filters zone and each group', () => {
    expect(Object.keys(rules)).toEqual(['x_axis', 'y_axis', 'legend_optional', 'sorting', 'filters', 'filters:4']);
    expect(rules['x_axis']).toMatchObject({ size: 1, maxItems: 1 });
    expect(rules['legend_optional']).toMatchObject({ size: 0 });
    expect(rules['filters:4']).toMatchObject({ size: 2 });
  });

  it('takes columns and function controllers into the config zones, not other controls', () => {
    expect(accepts('y_axis', column(region))).toBe(true);
    expect(accepts('y_axis', fromTree({ kind: 'control', control: control('FunctionController') }))).toBe(true);
    expect(accepts('y_axis', fromTree({ kind: 'control', control: control('Normal') }))).toBe(false);
    expect(accepts('y_axis', { kind: 'external', payload: 'nonsense' })).toBe(false);
    expect(accepts('sorting', { kind: 'zone', zoneId: 'filters:4', index: 0 })).toBe(true);
  });

  it('takes columns, column items and conditions into the filters, not measures or controls', () => {
    expect(accepts('filters', column(region))).toBe(true);
    expect(accepts('filters', column(measure))).toBe(false);
    expect(accepts('filters:4', fromTree({ kind: 'control', control: control('Normal') }))).toBe(false);
    expect(accepts('filters:4', { kind: 'zone', zoneId: 'x_axis', index: 0 })).toBe(true);
    expect(accepts('filters:4', { kind: 'zone', zoneId: 'filters:4', index: 1 })).toBe(true);
  });

  it('keeps chart control items and measures out of the filters', () => {
    const dynamic = item(5, 'Group by', '', { function_family: 'Dynamic', field: { class_name: 'chart_control_field' }, dynamic_function: { id: 9 } });
    const withControl = builderZoneRules({ ...data, configs: { ...data.configs, y_axis: [dynamic] } });
    expect(withControl['filters']?.accepts?.({ kind: 'zone', zoneId: 'y_axis', index: 0 })).toBe(false);
    expect(withControl['filters']?.accepts?.({ kind: 'zone', zoneId: 'y_axis', index: 3 })).toBe(false);
  });

  it('has no filter zones for a type without them', () => {
    expect(Object.keys(builderZoneRules({ chartType: ChartType.InputFilter, configs: {}, filters: {} }))).toEqual(['value']);
  });
});

describe('builderTransferMode', () => {
  it.each([
    ['x_axis', 'legend_optional', 'move'],
    ['x_axis', 'sorting', 'copy'],
    ['sorting', 'y_axis', 'copy'],
    ['x_axis', 'filters:4', 'copy'],
    ['filters:4', 'x_axis', 'copy'],
    ['filters:4', 'filters', 'move'],
    ['filters:4', 'filters:5', 'move']
  ])('%s to %s is a %s', (from, to, mode) => {
    expect(builderTransferMode(from, to)).toBe(mode);
  });
});

describe('builderActionOf', () => {
  it('adds a tree column to a config zone', () => {
    const action = { type: 'insert', zoneId: 'legend_optional', index: 0 } as const;
    expect(builderActionOf(action, column(region), data)).toEqual({ type: 'drop', drop: action, field: region });
  });

  it('adds a function controller as its control field', () => {
    const source = fromTree({ kind: 'control', control: control('FunctionController') });
    const action = { type: 'replace', zoneId: 'x_axis', index: 0 } as const;
    expect(builderActionOf(action, source, data)).toEqual({ type: 'drop', drop: action, field: droppedControl(control('FunctionController')) });
  });

  it('ignores a tree drop it can not read', () => {
    expect(builderActionOf({ type: 'insert', zoneId: 'x_axis', index: 0 }, { kind: 'external', payload: null }, data)).toBeUndefined();
  });

  it('adds a tree column as a new group, or into a group at the index', () => {
    expect(builderActionOf({ type: 'insert', zoneId: FILTER_ZONE, index: 0 }, column(region), data)).toEqual({ type: 'addCondition', field: region, groupId: undefined, index: 0 });
    expect(builderActionOf({ type: 'insert', zoneId: 'filters:4', index: 1 }, column(region), data)).toEqual({ type: 'addCondition', field: region, groupId: 4, index: 1 });
  });

  it('reorders a zone or a group', () => {
    const zone = { type: 'reorder', zoneId: 'y_axis', from: 1, to: 0 } as const;
    expect(builderActionOf(zone, { kind: 'zone', zoneId: 'y_axis', index: 1 }, data)).toEqual({ type: 'drop', drop: zone });
    expect(builderActionOf({ type: 'reorder', zoneId: 'filters:4', from: 1, to: 0 }, { kind: 'zone', zoneId: 'filters:4', index: 1 }, data)).toEqual({
      type: 'moveCondition',
      from: { groupId: 4, index: 1 },
      to: { groupId: 4, index: 0 }
    });
  });

  const transfer = (from: string, fromIndex: number, to: string, toIndex = 0) =>
    builderActionOf(
      { type: 'transfer', mode: builderTransferMode(from, to), from: { zoneId: from, index: fromIndex }, to: { zoneId: to, index: toIndex } },
      { kind: 'zone', zoneId: from, index: fromIndex },
      data
    );

  it('moves items between config zones', () => {
    expect(transfer('x_axis', 0, 'legend_optional')).toMatchObject({ type: 'drop', drop: { type: 'transfer', mode: 'move' } });
  });

  it('moves conditions between groups and into a new one', () => {
    expect(transfer('filters:4', 1, 'filters:7', 0)).toEqual({ type: 'moveCondition', from: { groupId: 4, index: 1 }, to: { groupId: 7, index: 0 } });
    expect(transfer('filters:4', 0, FILTER_ZONE)).toEqual({ type: 'moveCondition', from: { groupId: 4, index: 0 }, to: { groupId: undefined, index: 0 } });
  });

  it('copies a condition into a config zone as a column', () => {
    expect(transfer('filters:4', 1, 'legend_optional')).toEqual({
      type: 'drop',
      drop: { type: 'insert', zoneId: 'legend_optional', index: 0 },
      field: { field: field('city', 'string'), columnName: 'city', tableName: 'sales', isNested: false }
    });
  });

  it('copies an item into the filters as a condition', () => {
    expect(transfer('x_axis', 0, 'filters:4', 2)).toEqual({
      type: 'addCondition',
      field: { field: field('region', 'string'), columnName: 'region', tableName: 'sales', isNested: false },
      groupId: 4,
      index: 2
    });
  });

  it('ignores transfers from missing items and conditions', () => {
    expect(transfer('x_axis', 5, 'filters:4')).toBeUndefined();
    expect(transfer('filters:4', 5, 'x_axis')).toBeUndefined();
    expect(transfer('filters', 0, 'filters:4')).toBeUndefined();
  });

  it('gives what resolveDrop allows under the rules', () => {
    const action = resolveDrop(column(region), { kind: 'zone', zoneId: 'legend_optional' }, builderZoneRules(data), builderTransferMode);
    expect(action && builderActionOf(action, column(region), data)).toMatchObject({ type: 'drop', field: region });
  });
});

describe('dragLookOf', () => {
  it('shows what is dragged as the tree shows it', () => {
    expect(dragLookOf(column(region), data)).toEqual({ title: 'region', icon: { kind: 'type', type: 'string' }, italic: false });
    expect(dragLookOf(fromTree({ kind: 'control', control: control('Normal') }), data)?.title).toBe('Group by');
    expect(dragLookOf({ kind: 'zone', zoneId: 'y_axis', index: 0 }, data)).toEqual({ title: 'revenue', icon: { kind: 'type', type: 'double' }, italic: false });
    expect(dragLookOf({ kind: 'zone', zoneId: 'filters:4', index: 1 }, data)?.title).toBe('city');
  });

  it('shows nothing for what is not there', () => {
    expect(dragLookOf({ kind: 'zone', zoneId: 'x_axis', index: 9 }, data)).toBeUndefined();
    expect(dragLookOf({ kind: 'external', payload: 1 }, data)).toBeUndefined();
  });
});
