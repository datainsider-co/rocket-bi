import { useMemo, useState } from 'react';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import type { JsonObject } from '@/core/json/json';
import type { TableSchema } from '@/core/schema/SchemaService';
import { tableNodesOf, type TableNode } from '@/features/chart-builder/field-tree/fieldTree.utils';
import type { DroppedField } from '@/features/chart-builder/state/builderState.utils';
import {
  conditionsOfGroups,
  filterGroupsOf,
  groupList,
  withCondition,
  withConditionField,
  withNewCondition,
  withoutCondition,
  type FilterGroups
} from './rlsFilter.utils';

export interface RlsFilter {
  readonly groups: ReturnType<typeof groupList>;
  /** The table's columns to filter on, as the builder's field menu lists them. */
  readonly tables: readonly TableNode[];
  /** Conditions of the policy the editor can't show; applying drops them. */
  readonly skipped: number;
  /** The conditions Apply gives the policy; none while no condition has its values. */
  readonly conditions: JsonObject[];
  readonly onAdd: (field: DroppedField, groupId?: number) => void;
  readonly onApply: (condition: ConditionData) => void;
  readonly onSwapField: (condition: ConditionData, field: DroppedField) => void;
  readonly onRemove: (condition: ConditionData) => void;
}

/** A policy's Custom filter while it is edited: and-groups of the table's columns, or-ed. */
export function useRlsFilter(initial: readonly JsonObject[], table: TableSchema): RlsFilter {
  const [start] = useState(() => filterGroupsOf(initial, table));
  const [groups, setGroups] = useState<FilterGroups>(start.groups);
  const tables = useMemo(() => tableNodesOf([table]), [table]);
  const conditions = useMemo(() => conditionsOfGroups(groups), [groups]);
  return {
    groups: groupList(groups),
    tables,
    skipped: start.skipped,
    conditions,
    onAdd: (field, groupId) => setGroups(current => withNewCondition(current, field, groupId)),
    onApply: condition => setGroups(current => withCondition(current, condition)),
    onSwapField: (condition, field) => setGroups(current => withConditionField(current, condition, field)),
    onRemove: condition => setGroups(current => withoutCondition(current, condition))
  };
}
