import { Switch } from 'antd';

interface ToggleSettingProps {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

/** An on / off setting, its label on the left (v1 `ToggleSetting`). */
export function ToggleSetting({ label, value, disabled, onChange }: ToggleSettingProps) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <Switch size="small" checked={value} disabled={disabled} onChange={onChange} />
    </label>
  );
}
