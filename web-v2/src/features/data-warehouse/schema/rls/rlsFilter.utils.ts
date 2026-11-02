import { newConditionData, type ConditionData } from '@/core/chart-builder/ConditionData';
import { filtersOf } from '@/core/chart-builder/conditions';
import { asArray, asString, isRecord, type JsonObject } from '@/core/json/json';
import { conditionBody, FAMILY_CONDITIONS, type FilterCondition } from '@/core/query/internalFilter';
import type { TableSchema } from '@/core/schema/SchemaService';
import { fieldMenuItems, filterableField } from '@/features/chart-builder/config-panel/fieldMenu.utils';
import { appliedCondition, conditionChips, familyOfCondition } from '@/features/chart-builder/config-panel/filter/conditionEditor.utils';
import type { TableNode } from '@/features/chart-builder/field-tree/fieldTree.utils';
import type { DroppedField } from '@/features/chart-builder/state/builderState.utils';

/**
 * A policy's Custom filter, edited with the ChartBuilder's condition editor (CB4) as v1 did in a builder modal
 * (`RLSFilterBuilderConfig`, `TableSchema.toFilters`). The policy keeps backend conditions, the editor
 * `ConditionData` in and-groups that are or-ed: the policy's `and` conditions become groups again, a lone field
 * condition a group of its own.
 */

/** And-groups of conditions by group id. */
export type FilterGroups = Readonly<Record<number, readonly ConditionData[]>>;

/** Placeholder values, to learn which keys a condition writes its values to. */
const PROBE = ['1', '2'];

function valuesOfCondition(json: JsonObject, condition: FilterCondition): string[] {
  const keys = Object.keys(conditionBody(condition, PROBE) ?? {}).filter(key => key !== 'class_name');
  if (keys[0] === 'possible_values') return asArray(json['possible_values']).map(String);
  return keys.map(key => (json[key] === undefined || json[key] === null ? '' : String(json[key])));
}

/** The title of a field: its column's display name in `table`, else its name. */
function columnTitle(field: JsonObject, table: TableSchema): string {
  const name = asString(field['field_name']);
  const columns = [...table.columns, ...(table.calculatedColumns ?? [])];
  return columns.find(column => column.name === name)?.displayName ?? name;
}

/**
 * A backend condition on a field as the editor's condition, the reverse of `conditionOf`: the condition of the field's
 * family that writes this class (`less_than` is Earlier Than on a date, Less Than on a number). `undefined` for what
 * the editor can't hold: no field, a chart control condition, a class the family has no condition for.
 */
export function conditionDataOf(json: JsonObject, table: TableSchema, ids: { id: number; groupId: number }): ConditionData | undefined {
  const field = json['field'];
  if (!isRecord(field)) return undefined;
  const scalar = json['scalar_function'];
  const isNested = isRecord(scalar) && scalar['class_name'] === 'get_array_element';
  const data = newConditionData({ ...ids, field, columnName: columnTitle(field, table), tableName: asString(field['tbl_name'], table.name), isNested });
  const family = familyOfCondition(data);
  const condition = family && FAMILY_CONDITIONS[family].find(item => conditionBody(item, PROBE)?.['class_name'] === json['class_name']);
  if (!condition) return undefined;
  return appliedCondition(data, { condition, mode: 'manual', values: valuesOfCondition(json, condition) });
}

/** The policy's conditions as groups, and how many the editor can't show (applying drops them). */
export function filterGroupsOf(conditions: readonly JsonObject[], table: TableSchema): { groups: FilterGroups; skipped: number } {
  const groups: Record<number, ConditionData[]> = {};
  let skipped = 0;
  let id = 0;
  conditions.forEach((condition, index) => {
    const parts = condition['class_name'] === 'and' ? asArray(condition['conditions']).filter(isRecord) : [condition];
    const groupId = index + 1;
    parts.forEach(part => {
      const data = conditionDataOf(part, table, { id: ++id, groupId });
      if (data) groups[groupId] = [...(groups[groupId] ?? []), data];
      else skipped += 1;
    });
  });
  return { groups, skipped };
}

/** The policy's conditions from the groups (v1 `setting.filters`): one `and` per group, unfinished conditions left out. */
export function conditionsOfGroups(groups: FilterGroups): JsonObject[] {
  return filtersOf(groups);
}

const nextId = (ids: readonly number[]) => Math.max(0, ...ids) + 1;
const conditionIds = (groups: FilterGroups) => Object.values(groups).flatMap(group => group.map(condition => condition.id));

/** A field picked for group `groupId`, or for a new or-group: a condition of its family's default, without values. */
export function withNewCondition(groups: FilterGroups, field: DroppedField, groupId?: number): FilterGroups {
  const group = groupId ?? nextId(Object.keys(groups).map(Number));
  const condition = newConditionData({ ...field, id: nextId(conditionIds(groups)), groupId: group });
  return { ...groups, [group]: [...(groups[group] ?? []), condition] };
}

/** The condition replaced by its edit (same id and group). */
export function withCondition(groups: FilterGroups, condition: ConditionData): FilterGroups {
  const group = groups[condition.groupId];
  if (!group) return groups;
  return { ...groups, [condition.groupId]: group.map(item => (item.id === condition.id ? condition : item)) };
}

/** Another field for a condition: it starts over on that field, in its place. */
export function withConditionField(groups: FilterGroups, condition: ConditionData, field: DroppedField): FilterGroups {
  return withCondition(groups, newConditionData({ ...field, id: condition.id, groupId: condition.groupId }));
}

/** The condition taken out; a group left empty goes too. */
export function withoutCondition(groups: FilterGroups, condition: ConditionData): FilterGroups {
  const rest = (groups[condition.groupId] ?? []).filter(item => item.id !== condition.id);
  const { [condition.groupId]: _removed, ...others } = groups;
  return rest.length > 0 ? { ...others, [condition.groupId]: rest } : others;
}

/** The groups in order, for the view. */
export function groupList(groups: FilterGroups): [groupId: number, conditions: readonly ConditionData[]][] {
  return Object.entries(groups)
    .map(([groupId, conditions]): [number, readonly ConditionData[]] => [Number(groupId), conditions])
    .sort(([a], [b]) => a - b);
}

/** One condition in words: `Name in Phở, O'Brien tea`. */
export function describeCondition(condition: ConditionData): string {
  const chips = conditionChips(condition, []);
  return [condition.columnName ?? '', condition.subType ?? '', chips.join(', ')].filter(Boolean).join(' ');
}

/** The filter in words for view mode: `a and b or c`; what the editor can't show is counted. */
export function describeFilter(conditions: readonly JsonObject[], table: TableSchema): string {
  const { groups, skipped } = filterGroupsOf(conditions, table);
  const text = groupList(groups)
    .map(([, group]) => group.map(describeCondition).join(' and '))
    .join(' or ');
  const others = skipped > 0 ? `${skipped} other condition${skipped === 1 ? '' : 's'}` : '';
  return [text, others].filter(Boolean).join(' + ');
}

/** The columns a condition can be added on, without the builder's submenu per table: a policy has one table. */
export function columnMenuItems(tables: readonly TableNode[]) {
  return fieldMenuItems(tables, filterableField).flatMap(item => (item && 'children' in item && item.children ? item.children : [item]));
}
