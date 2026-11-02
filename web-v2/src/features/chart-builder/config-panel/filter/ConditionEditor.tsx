import type { ConditionData } from '@/core/chart-builder/ConditionData';
import { appliedCondition } from './conditionEditor.utils';
import { ConditionEditorView } from './ConditionEditorView';
import { useConditionEditor, type ConditionEditorContext } from './useConditionEditor';

interface ConditionEditorProps {
  condition: ConditionData;
  context: ConditionEditorContext;
  onApply: (condition: ConditionData) => void;
  onRemove: () => void;
  onCancel: () => void;
}

/** The editor of one filter condition, in the builder or outside it (RLS); mount it per opening. */
export function ConditionEditor({ condition, context, onApply, onRemove, onCancel }: ConditionEditorProps) {
  const editor = useConditionEditor(condition, context);
  return (
    <ConditionEditorView
      title={condition.columnName ?? ''}
      editor={editor}
      onApply={() => onApply(appliedCondition(condition, editor.draft))}
      onRemove={onRemove}
      onCancel={onCancel}
    />
  );
}
