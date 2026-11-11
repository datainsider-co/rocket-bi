import { Switch } from 'antd';
import '../Settings.css';

interface ToggleSettingProps {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

/** An on / off setting: the switch, then its label (v1 `ToggleSetting`). */
export function ToggleSetting({ label, value, disabled, onChange }: ToggleSettingProps) {
  return (
    <label className={`toggle-setting${disabled ? ' toggle-setting--disabled' : ''}`}>
      <Switch size="small" checked={value} disabled={disabled} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
