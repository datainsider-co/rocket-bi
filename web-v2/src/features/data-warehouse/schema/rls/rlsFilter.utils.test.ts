import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import type { TableSchema } from '@/core/schema/SchemaService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { tableNodesOf } from '@/features/chart-builder/field-tree/fieldTree.utils';
import {
  columnMenuItems,
  conditionDataOf,
  conditionsOfGroups,
  describeFilter,
  filterGroupsOf,
  groupList,
  withCondition,
  withConditionField,
  withNewCondition,
  withoutCondition
} from './rlsFilter.utils';

const table: TableSchema = {
  dbName: 'dw0_probe',
  name: 'products',
  columns: [
    { name: 'name', displayName: 'Name', type: 'string' },
    { name: 'qty', displayName: 'Qty', type: 'int32' },
    { name: 'created_at', displayName: 'Created At', type: 'datetime' }
  ]
};
const field = (name: string, type: string): JsonObject => ({ class_name: 'table_field', db_name: 'dw0_probe', tbl_name: 'products', field_name: name, field_type: type });
const picked = (name: string, type: string, title: string) => ({ field: field(name, type), columnName: title, tableName: 'products' });
const inName = fixture.policiesList.response.data[0]!.conditions[0] as JsonObject;
const qtyAbove = { class_name: 'greater_than', field: field('qty', 'int32'), value: '5' };
const before = { class_name: 'less_than', field: field('created_at', 'datetime'), value: '2026-01-01' };

describe('conditionDataOf', () => {
  it("reads the DW0 policy's in condition", () => {
    expect(conditionDataOf(inName, table, { id: 1, groupId: 1 })).toMatchObject({
      id: 1,
      groupId: 1,
      columnName: 'Name',
      tableName: 'products',
      subType: 'in',
      allValues: ['Phở', "O'Brien tea"],
      currentInputType: 'multi_select'
    });
  });

  it('reads less_than by the field type', () => {
    expect(conditionDataOf(before, table, { id: 1, groupId: 1 })).toMatchObject({ subType: 'earlier than', firstValue: '2026-01-01' });
    expect(conditionDataOf({ ...qtyAbove, class_name: 'less_than' }, table, { id: 1, groupId: 1 })).toMatchObject({ subType: 'less than' });
  });

  it('reads ranges, numbers and nested columns', () => {
    const between = { class_name: 'between', field: field('qty', 'int32'), min: 1, max: 9, scalar_function: { class_name: 'get_array_element', index: 1 } };
    expect(conditionDataOf(between, table, { id: 2, groupId: 1 })).toMatchObject({ subType: 'between', allValues: ['1', '9'], isNested: true });
  });

  it("can't read what the editor can't hold", () => {
    expect(conditionDataOf({ class_name: 'always_true' }, table, { id: 1, groupId: 1 })).toBeUndefined();
    expect(conditionDataOf({ class_name: 'empty', field: field('qty', 'int32') }, table, { id: 1, groupId: 1 })).toBeUndefined();
  });

  it('turns back into the condition it was read from', () => {
    // `is_include_null` is the server's default; the editor doesn't write it.
    const { is_include_null: _includeNull, ...inNameWritten } = inName;
    for (const condition of [inNameWritten, qtyAbove, before]) {
      const data = conditionDataOf(condition, table, { id: 1, groupId: 1 })!;
      expect(conditionsOfGroups({ 1: [data] })).toEqual([{ class_name: 'and', conditions: [condition] }]);
    }
  });
});

describe('filterGroupsOf', () => {
  it('makes a group of each and, and of each lone condition, counting what it skips', () => {
    const { groups, skipped } = filterGroupsOf([{ class_name: 'and', conditions: [qtyAbove, before] }, inName, { class_name: 'or', conditions: [] }], table);

    expect(groupList(groups).map(([groupId, conditions]) => [groupId, conditions.map(condition => condition.id)])).toEqual([
      [1, [1, 2]],
      [2, [3]]
    ]);
    expect(skipped).toBe(1);
  });

  it('has no groups for View All', () => {
    expect(filterGroupsOf([{ class_name: 'always_true' }], table)).toEqual({ groups: {}, skipped: 1 });
  });
});

describe('group changes', () => {
  const start = filterGroupsOf([inName], table).groups;

  it('adds a condition to a group or a new one', () => {
    const joined = withNewCondition(start, picked('qty', 'int32', 'Qty'));
    expect(groupList(joined).map(([groupId, conditions]) => [groupId, conditions.map(condition => [condition.id, condition.subType])])).toEqual([
      [1, [[1, 'in']]],
      [2, [[2, 'equal']]]
    ]);
    expect(withNewCondition(start, picked('qty', 'int32', 'Qty'), 1)[1]).toHaveLength(2);
  });

  it('replaces, refields and removes a condition', () => {
    const condition = start[1]![0]!;
    expect(withCondition(start, { ...condition, allValues: ['Phở'] })[1]![0]!.allValues).toEqual(['Phở']);
    expect(withCondition(start, { ...condition, groupId: 9 })).toBe(start);
    expect(withConditionField(start, condition, picked('qty', 'int32', 'Qty'))[1]![0]).toMatchObject({ id: 1, columnName: 'Qty', subType: 'equal', allValues: [] });
    expect(withoutCondition(start, condition)).toEqual({});
    expect(start[1]).toHaveLength(1);
  });

  it('leaves unfinished conditions out of the policy', () => {
    expect(conditionsOfGroups(withNewCondition({}, picked('qty', 'int32', 'Qty')))).toEqual([]);
  });
});

describe('describeFilter', () => {
  it('puts the filter in words', () => {
    expect(describeFilter([{ class_name: 'and', conditions: [qtyAbove, before] }, inName], table)).toBe(
      "Qty greater than 5 and Created At earlier than 2026-01-01 or Name in Phở, O'Brien tea"
    );
    expect(describeFilter([inName, { class_name: 'dynamic_condition' }], table)).toBe("Name in Phở, O'Brien tea + 1 other condition");
  });
});

describe('columnMenuItems', () => {
  it("lists the table's columns without a submenu, by title", () => {
    expect(columnMenuItems(tableNodesOf([table])).map(item => item && 'label' in item && item.label)).toEqual(['Created At', 'Name', 'Qty']);
    expect(columnMenuItems([])).toEqual([]);
  });
});
