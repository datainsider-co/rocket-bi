import { useMemo, useState } from 'react';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import { FilterInput, inputOf, type FilterCondition } from '@/core/query/internalFilter';
import { useBuilder } from '../../state/BuilderContext';
import {
  canUseControl,
  conditionChoicesOf,
  draftOf,
  familyOfCondition,
  valueControlsOf,
  withDraftCondition,
  withDraftControl,
  type ValueMode
} from './conditionEditor.utils';
import { useColumnValues } from './useColumnValues';

/**
 * The editor's draft of one condition (v1 `InternalFilterPopover`). The column's values are loaded only while a list
 * is typed in by hand. Mount it per opening so the draft starts from the condition.
 */
export function useConditionEditor(condition: ConditionData) {
  const { controls } = useBuilder();
  const family = familyOfCondition(condition);
  const [draft, setDraft] = useState(() => draftOf(condition));
  const input = inputOf(family, draft.condition);
  const columnValues = useColumnValues(condition, draft.mode === 'manual' && input === FilterInput.MultiSelect);
  const valueControls = useMemo(() => valueControlsOf(controls), [controls]);

  return {
    draft,
    input,
    conditions: conditionChoicesOf(family),
    /** No mode switch without controls to pick, nor for a condition taking no values. */
    controls: canUseControl(family, draft.condition) ? valueControls : [],
    columnValues,
    onCondition: (next: FilterCondition) => setDraft(current => withDraftCondition(current, family, next)),
    onMode: (mode: ValueMode, controlId?: number) => setDraft(current => withDraftControl(current, mode, controlId)),
    onValues: (values: readonly string[]) => setDraft(current => ({ ...current, values }))
  };
}

export type ConditionEditorState = ReturnType<typeof useConditionEditor>;
