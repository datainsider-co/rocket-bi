import { Slider } from 'antd';
import { SettingField } from './SettingField';

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

/** A number on a range, applied when the handle is released (v1 `SliderSetting`). */
export function SliderSetting({ label, value, min, max, disabled, onChange }: SliderSettingProps) {
  return (
    <SettingField label={label}>
      {/* Keyed by the value, so a revert moves the handle. */}
      <Slider key={value} defaultValue={value} min={min} max={max} disabled={disabled} onChangeComplete={next => onChange(next)} />
    </SettingField>
  );
}
