import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { App } from 'antd';
import type { EtlGraph } from '@/core/data-cook/etlGraph';
import type { EtlOperator, JoinOperator, JoinType } from '@/core/data-cook/EtlOperator';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { TreeTable } from '@/shared/database-tree/databaseTree.utils';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { findSource, newSourceOperator } from '../../draft/etlDraft.utils';
import type { TablePreviewState } from '../../preview/useEtlPreview';
import { useLoadSource } from '../../source/useLoadSource';
import { EMPTY_CONDITION, joinConditions, joinFormError, joinFormOf, newJoinOperator, sourceAsPreviewTable, updatedJoin, type ConditionForm, type JoinForm } from '../join.utils';
import { knownTable, newTableConfig } from '../operators.utils';
import type { OperatorExtras } from '../useOperatorDialog';
import { rightOptions, withCondition, withoutRightColumns } from './joinDialog.utils';

/** The table on the right: one of the ETL, or a warehouse table that comes in as a new source (`source`). */
export interface JoinRight {
  readonly operator: EtlOperator;
  readonly table: TableSchema;
  readonly source: EtlOperator | undefined;
}

export interface JoinSides {
  readonly left: EtlOperator;
  readonly leftTable: TableSchema;
  /** Set when editing: the right table can't change then (v1). */
  readonly right: JoinRight | undefined;
  readonly editing: JoinOperator | undefined;
}

export interface JoinDialogContext {
  readonly graph: EtlGraph;
  readonly previews: ReadonlyMap<string, TablePreviewState>;
  readonly dbName: string;
  readonly onAdd: (operator: EtlOperator, parentNames: readonly string[], extras?: OperatorExtras) => void;
  readonly onUpdate: (operator: EtlOperator) => void;
}

/**
 * Join Table (v1 `JoinTable` and the table menu's "Select Table to Join"): the right table, its conditions and its
 * type. A warehouse table picked on the right is read as v1 did, its columns on the preview database under the name
 * its new source gets.
 */
export function useJoinDialog(sides: JoinSides, context: JoinDialogContext) {
  const { graph, previews, dbName, onAdd, onUpdate } = context;
  const { message } = App.useApp();
  const loadSource = useLoadSource();
  const [right, setRight] = useState(sides.right);
  const [form, setForm] = useState<JoinForm>(() => (sides.editing ? joinFormOf(sides.editing) : { conditions: [EMPTY_CONDITION], joinType: 'left' }));
  const [error, setError] = useState<string>();
  const [picking, setPicking] = useState(false);
  const leftName = sides.left.destTable.tblName;

  const change = useCallback((next: (current: JoinForm) => JoinForm) => {
    setForm(next);
    setError(undefined);
  }, []);
  const choose = useCallback(
    (next: JoinRight) => {
      setRight(next);
      change(withoutRightColumns);
    },
    [change]
  );
  const pickEtlTable = useCallback(
    (name: string) => {
      const operator = graph.operators.get(name);
      if (operator) choose({ operator, table: knownTable(previews, operator, dbName), source: undefined });
    },
    [graph, previews, dbName, choose]
  );

  const warehouse = useMutation({
    mutationFn: async (table: TreeTable): Promise<JoinRight> => {
      // A table that is already a source joins as that source (v1 `createGetDataOperator`).
      const existing = findSource(graph, table.dbName, table.name);
      const loaded = existing ? undefined : await loadSource(table);
      const operator = existing ?? newSourceOperator(loaded?.json ?? {}, loaded?.dbDisplayName ?? '', new Set(graph.operators.keys()));
      if (operator.kind !== 'getData') throw new Error(`${table.name} can't be read`);
      const { tblName, tblDisplayName } = operator.destTable;
      const columns = previews.get(tblName)?.table ?? sourceAsPreviewTable(operator.tableSchema, dbName, tblName, tblDisplayName);
      return { operator, table: columns, source: existing ? undefined : operator };
    },
    onSuccess: next => {
      choose(next);
      setPicking(false);
    },
    onError: failure => void message.error(toErrorMessage(failure))
  });

  const submit = useCallback(() => {
    const invalid = right ? joinFormError(form) : 'Select a table to join';
    if (invalid || !right) {
      setError(invalid);
      return;
    }
    if (sides.editing) {
      onUpdate(updatedJoin(sides.editing, form.joinType, joinConditions(form, sides.leftTable, right.table, sides.editing.joins[0]?.conditions)));
      return;
    }
    const sources = right.source ? [right.source] : [];
    const destTable = newTableConfig(graph, [sides.left, right.operator], sources.map(source => source.destTable.tblName));
    const operator = newJoinOperator(sides.left, right.operator, destTable, form.joinType, joinConditions(form, sides.leftTable, right.table));
    onAdd(operator, [leftName, right.operator.destTable.tblName], { sources });
  }, [right, form, sides, graph, leftName, onAdd, onUpdate]);

  return {
    right,
    rightOptions: useMemo(() => rightOptions(graph, leftName, previews), [graph, leftName, previews]),
    form,
    error,
    pickEtlTable,
    picker: { isOpen: picking, busy: warehouse.isPending, open: () => setPicking(true), close: () => setPicking(false), pick: warehouse.mutate },
    conditions: {
      add: () => change(current => ({ ...current, conditions: [...current.conditions, EMPTY_CONDITION] })),
      remove: (index: number) => change(current => ({ ...current, conditions: current.conditions.filter((_, at) => at !== index) })),
      set: (index: number, value: Partial<ConditionForm>) => change(current => withCondition(current, index, value))
    },
    setJoinType: (joinType: JoinType) => change(current => ({ ...current, joinType })),
    submit
  };
}

export type JoinDialogModel = ReturnType<typeof useJoinDialog>;
