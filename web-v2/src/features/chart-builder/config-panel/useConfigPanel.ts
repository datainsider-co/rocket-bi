import { useCallback, useMemo } from 'react';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import { useBuilder } from '../state/BuilderContext';
import { conditionChips } from './filter/conditionEditor.utils';

/** What the config panel shows of the builder's state and the changes it makes to it. */
export function useConfigPanel() {
  const { state, dispatch, controls } = useBuilder();
  const onItemChange = useCallback((zone: string, item: FunctionData) => dispatch({ type: 'updateItem', zone, item }), [dispatch]);
  const onItemRemove = useCallback((zone: string, id: number) => dispatch({ type: 'removeItem', zone, id }), [dispatch]);
  const filter = useMemo(
    () => ({
      chipsOf: (condition: ConditionData) => conditionChips(condition, controls),
      onApply: (condition: ConditionData) => dispatch({ type: 'updateCondition', condition }),
      onRemove: (condition: ConditionData) => dispatch({ type: 'removeCondition', groupId: condition.groupId, id: condition.id })
    }),
    [controls, dispatch]
  );
  return { data: state.data, onItemChange, onItemRemove, filter };
}
