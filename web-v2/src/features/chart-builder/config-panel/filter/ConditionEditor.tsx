import type { ConditionData } from '@/core/chart-builder/ConditionData';
import { appliedCondition } from './conditionEditor.utils';
import { ConditionEditorView } from './ConditionEditorView';
import { useConditionEditor } from './useConditionEditor';

interface ConditionEditorProps {
  condition: ConditionData;
  onApply: (condition: ConditionData) => void;
  onRemove: () => void;
  onCancel: () => void;
}

/** The editor of one filter condition; mount it per opening. */
export function ConditionEditor({ condition, onApply, onRemove, onCancel }: ConditionEditorProps) {
  const editor = useConditionEditor(condition);
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
