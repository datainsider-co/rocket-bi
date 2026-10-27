import { InputNumber } from 'antd';
import { SettingField } from './SettingField';

interface NumberSettingProps {
  label: string;
  value: number;
  min?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  onChange: (value: number) => void;
}

/** A number applied on Enter or when the field loses focus; anything else is dropped. */
export function NumberSetting({ label, value, min, step, disabled, className, onChange }: NumberSettingProps) {
  const commit = (text: string) => {
    const number = text.trim() === '' ? Number.NaN : Number(text);
    if (Number.isFinite(number) && number !== value) onChange(number);
  };
  return (
    <SettingField label={label} className={className}>
      <InputNumber
        key={value}
        className="w-full!"
        defaultValue={value}
        min={min}
        step={step}
        disabled={disabled}
        onBlur={event => commit(event.target.value)}
        onPressEnter={event => commit(event.currentTarget.value)}
      />
    </SettingField>
  );
}
