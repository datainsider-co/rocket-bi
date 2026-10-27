import { Button, Switch } from 'antd';

interface FormattingRowProps {
  label: string;
  value: boolean;
  onToggle: (enabled: boolean) => void;
  onAdvanced: () => void;
}

/** One conditional formatting: on / off, and its dialog (v1 `ToggleTextButtonSetting`). */
export function FormattingRow({ label, value, onToggle, onAdvanced }: FormattingRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch size="small" checked={value} aria-label={label} onChange={onToggle} />
      <span className="flex-1 text-sm">{label}</span>
      <Button size="small" type="link" onClick={onAdvanced}>
        Advanced controls
      </Button>
    </div>
  );
}
