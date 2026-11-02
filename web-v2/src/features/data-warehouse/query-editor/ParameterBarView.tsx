import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { QueryParameter } from '@/core/query/queryParameters';
import { ParameterChipView, type ParameterChipActions } from './ParameterChipView';

interface ParameterBarViewProps {
  definitions: readonly QueryParameter[];
  current: readonly QueryParameter[];
  actions: ParameterChipActions;
  /** Add Param; read only there is none, and a parameter is only given values. */
  onAdd: (() => void) | undefined;
}

/** The SQL's parameters under the editor, and Add Param (v1 `param-listing`). */
export function ParameterBarView({ definitions, current, actions, onAdd }: ParameterBarViewProps) {
  return (
    <div className="flex max-h-[10vh] flex-wrap items-center gap-2 overflow-y-auto">
      {definitions.map((definition, index) => (
        <ParameterChipView key={definition.displayName} definition={definition} current={current[index] ?? definition} actions={actions} editable={onAdd !== undefined} />
      ))}
      {onAdd && (
        <Button size="small" icon={<PlusOutlined />} onClick={onAdd}>
          Add Param
        </Button>
      )}
    </div>
  );
}
