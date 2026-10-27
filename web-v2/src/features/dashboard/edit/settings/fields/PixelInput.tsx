import { InputNumber, Space } from 'antd';

interface PixelInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** A v1 icon font class shown after the input. */
  icon?: string;
}

/** A size in pixels, zero or more (v1 `DiInputComponent` with a numeric value). */
export function PixelInput({ label, value, onChange, icon }: PixelInputProps) {
  const input = <InputNumber<number> aria-label={label} className="setting-input w-full!" min={0} controls={false} value={value} onChange={number => onChange(number ?? 0)} />;
  if (!icon) return input;
  return (
    <Space.Compact className="w-full">
      {input}
      <Space.Addon className="setting-input-addon">
        <i className={icon} aria-hidden />
      </Space.Addon>
    </Space.Compact>
  );
}
