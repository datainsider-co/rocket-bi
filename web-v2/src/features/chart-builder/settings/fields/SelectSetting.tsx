import { Select } from 'antd';
import type { SettingOption } from '../settingOptions';
import { SettingField } from './SettingField';

interface SelectSettingProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly SettingOption<T>[];
  disabled?: boolean;
  className?: string;
  onChange: (value: T) => void;
}

/** One of a fixed list of values (v1 `DropdownSetting`). */
export function SelectSetting<T extends string | number>({ label, value, options, disabled, className, onChange }: SelectSettingProps<T>) {
  return (
    <SettingField label={label} className={className}>
      <Select<T> value={value} options={options as SettingOption<T>[]} disabled={disabled} popupMatchSelectWidth={false} onChange={onChange} />
    </SettingField>
  );
}
