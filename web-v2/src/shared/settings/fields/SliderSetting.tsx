import { InputNumber, Slider } from 'antd';
import { SettingField } from './SettingField';

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

/**
 * A number on a range (v1 `SliderSetting`): typed in its box, applied on Enter or when the box loses focus, or dragged
 * on the track, applied when the handle is released.
 */
export function SliderSetting({ label, value, min, max, disabled, onChange }: SliderSettingProps) {
  const commit = (text: string) => {
    const number = text.trim() === '' ? Number.NaN : Number(text);
    if (!Number.isFinite(number)) return;
    const clamped = Math.min(Math.max(number, min), max);
    if (clamped !== value) onChange(clamped);
  };
  return (
    <SettingField label={label}>
      {/* Keyed by the value, so a revert shows in the box and moves the handle. */}
      <div className="slider-setting" key={value}>
        <InputNumber
          aria-label={`${label} value`}
          controls={false}
          defaultValue={value}
          min={min}
          max={max}
          disabled={disabled}
          onBlur={event => commit(event.target.value)}
          onPressEnter={event => commit(event.currentTarget.value)}
        />
        <Slider defaultValue={value} min={min} max={max} disabled={disabled} onChangeComplete={next => onChange(next)} />
      </div>
    </SettingField>
  );
}
