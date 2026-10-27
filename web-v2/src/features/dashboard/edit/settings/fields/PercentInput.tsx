import { InputNumber } from 'antd';

interface PercentInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

/** v1 `PercentageInput`: 0 to 100, shown with a percent sign, with up and down buttons. */
export function PercentInput({ label, value, onChange }: PercentInputProps) {
  return (
    <InputNumber<number>
      aria-label={label}
      className="setting-input w-full!"
      min={0}
      max={100}
      value={value}
      formatter={number => `${number ?? 0}%`}
      parser={text => Number((text ?? '').replace('%', '')) || 0}
      onChange={number => onChange(number ?? 0)}
    />
  );
}
