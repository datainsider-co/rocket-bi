import { DatePicker, Input, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { FilterInput } from '@/core/query/internalFilter';

/** How filters send dates; the server reads it on every SQL engine (main date filter too). */
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const toDay = (value: string | undefined): Dayjs | null => (value ? dayjs(value) : null);
const fromDay = (day: Dayjs | null | undefined): string => (day ? day.format(DATE_FORMAT) : '');

interface FilterValueInputProps {
  input: FilterInput;
  values: readonly string[];
  onChange: (values: string[]) => void;
}

/**
 * The values a condition takes (v1 `SelectionFilter`, `NumberFilter`, `DateHistogramFilter` inputs). A list is typed
 * in: v1 offered the column's values from the server, which needs the field's data source.
 */
export function FilterValueInput({ input, values, onChange }: FilterValueInputProps) {
  const [first = '', second = ''] = values;
  switch (input) {
    case FilterInput.None:
      return null;
    case FilterInput.MultiSelect:
      return (
        <Select
          mode="tags"
          aria-label="Values"
          className="w-full"
          value={[...values]}
          onChange={onChange}
          open={false}
          suffixIcon={null}
          tokenSeparators={[',']}
          placeholder="Type a value, then Enter"
        />
      );
    case FilterInput.NumberRange:
      return (
        <Space.Compact className="w-full">
          <Input aria-label="From" value={first} onChange={event => onChange([event.target.value, second])} placeholder="From" />
          <Input aria-label="To" value={second} onChange={event => onChange([first, event.target.value])} placeholder="To" />
        </Space.Compact>
      );
    case FilterInput.Date:
      return <DatePicker aria-label="Date" className="w-full" showTime value={toDay(first)} onChange={day => onChange([fromDay(day)])} />;
    case FilterInput.DateRange:
      return (
        <DatePicker.RangePicker
          aria-label="Dates"
          className="w-full"
          showTime
          value={[toDay(first), toDay(second)]}
          onChange={days => onChange([fromDay(days?.[0]), fromDay(days?.[1])])}
        />
      );
    default:
      return <Input aria-label="Value" value={first} onChange={event => onChange([event.target.value])} />;
  }
}
