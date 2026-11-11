import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { StoredRange } from '@/core/query/comparison';
import { SettingField } from './SettingField';

interface DateRangeSettingProps {
  label: string;
  value: StoredRange | undefined;
  disabled?: boolean;
  onChange: (range: StoredRange) => void;
}

/** Two dates, a custom range (v1 `InputDateSetting`'s calendar). */
export function DateRangeSetting({ label, value, disabled, onChange }: DateRangeSettingProps) {
  return (
    <SettingField label={label}>
      <DatePicker.RangePicker
        value={value && [dayjs(value[0]), dayjs(value[1])]}
        disabled={disabled}
        allowClear={false}
        onChange={dates => {
          const [start, end] = dates ?? [];
          if (start && end) onChange([start.startOf('day').toDate(), end.startOf('day').toDate()]);
        }}
      />
    </SettingField>
  );
}
