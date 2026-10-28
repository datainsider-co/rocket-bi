import { Input } from 'antd';
import { SettingField } from './SettingField';

interface TextSettingProps {
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

/** Text applied on Enter or when the field loses focus, like v1 `InputSetting`. */
export function TextSetting({ label, value, placeholder, maxLength, disabled, className, onChange }: TextSettingProps) {
  const commit = (text: string) => {
    if (text !== value) onChange(text);
  };
  return (
    <SettingField label={label} className={className}>
      {/* Keyed by the value, so a revert shows in the field. */}
      <Input
        key={value}
        defaultValue={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        onBlur={event => commit(event.target.value)}
        onPressEnter={event => commit(event.currentTarget.value)}
      />
    </SettingField>
  );
}
