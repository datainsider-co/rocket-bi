import { useCallback, useMemo } from 'react';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import { useBuilder } from '../state/BuilderContext';
import type { DroppedField } from '../state/builderState.utils';
import { useFieldChoices } from './FieldChoicesContext';
import { conditionChips } from './filter/conditionEditor.utils';

/** What the config panel shows of the builder's state and the changes it makes to it. */
export function useConfigPanel() {
  const { state, dispatch, controls } = useBuilder();
  const tables = useFieldChoices();
  const items = state.data.configs;
  const onItemChange = useCallback((zone: string, item: FunctionData) => dispatch({ type: 'updateItem', zone, item }), [dispatch]);
  const onItemRemove = useCallback((zone: string, id: number) => dispatch({ type: 'removeItem', zone, id }), [dispatch]);
  const fields = useMemo(
    () => ({
      tables,
      // v1 `ConfigDraggable.handleSelectColumn`: a field picked by click goes last.
      onAdd: (zone: string, field: DroppedField) => dispatch({ type: 'drop', drop: { type: 'insert', zoneId: zone, index: items[zone]?.length ?? 0 }, field }),
      onSwap: (zone: string, id: number, field: DroppedField) => dispatch({ type: 'changeItemField', zone, id, field })
    }),
    [tables, items, dispatch]
  );
  const filter = useMemo(
    () => ({
      chipsOf: (condition: ConditionData) => conditionChips(condition, controls),
      onApply: (condition: ConditionData) => dispatch({ type: 'updateCondition', condition }),
      onRemove: (condition: ConditionData) => dispatch({ type: 'removeCondition', groupId: condition.groupId, id: condition.id }),
      onAddField: (field: DroppedField) => dispatch({ type: 'addCondition', field }),
      onSwapField: (condition: ConditionData, field: DroppedField) => dispatch({ type: 'changeConditionField', groupId: condition.groupId, id: condition.id, field })
    }),
    [controls, dispatch]
  );
  return { data: state.data, onItemChange, onItemRemove, fields, filter };
}
