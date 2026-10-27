import { Button } from 'antd';

export interface DefaultValueFieldProps {
  label?: string;
  /** The stored default, as text. */
  summary: string;
  /** Whether the preview's selection would change it. */
  canSave: boolean;
  onSave: () => void;
  onReset: () => void;
}

/**
 * v1 `DefaultValueSetting`: the filter's selection in the preview becomes the value it starts with on the dashboard;
 * Reset drops it.
 */
export function DefaultValueField({ label = 'Default filter', summary, canSave, onSave, onReset }: DefaultValueFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-black/65">{label}</span>
      <span className="truncate text-sm" title={summary}>
        {summary}
      </span>
      <div className="flex gap-2">
        <Button size="small" disabled={!canSave} onClick={onSave}>
          Use the preview&apos;s selection
        </Button>
        <Button size="small" disabled={summary === 'None'} onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
