import { Switch } from 'antd';
import '../Settings.css';

interface FormattingRowProps {
  label: string;
  value: boolean;
  onToggle: (enabled: boolean) => void;
  onAdvanced: () => void;
}

/** One conditional formatting (v1 `ToggleTextButtonSetting`): on / off, and its dialog while it is on. */
export function FormattingRow({ label, value, onToggle, onAdvanced }: FormattingRowProps) {
  return (
    <div className="formatting-row">
      <label className="toggle-setting">
        <Switch size="small" checked={value} onChange={onToggle} />
        <span>{label}</span>
      </label>
      {value && (
        <button type="button" className="formatting-row__advanced" onClick={onAdvanced}>
          Advanced controls
        </button>
      )}
    </div>
  );
}
