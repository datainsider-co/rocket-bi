import { DatePicker, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { DATE_MODE_OPTIONS, DateMode, formatDateTime } from '@/core/query/dateRanges';

interface DateRangeModePickerProps {
  mode: DateMode;
  /** The range the mode stands for now, `yyyy-MM-dd HH:mm:ss`; none for all time. */
  range: readonly string[];
  onChange: (mode: DateMode, dates: string[]) => void;
  className?: string;
}

/**
 * A preset (Today, Last 7 Days, ...) or a custom range (v1 `DiCalendar`, used by the main date filter and the date
 * select filter). Picking dates switches to Custom.
 */
export function DateRangeModePicker({ mode, range, onChange, className }: DateRangeModePickerProps) {
  const value: [Dayjs, Dayjs] | null = range.length === 2 ? [dayjs(range[0]), dayjs(range[1])] : null;

  const pickMode = (next: DateMode) => onChange(next, next === DateMode.Custom ? [...range] : []);
  const pickDates = (dates: [Dayjs | null, Dayjs | null] | null) => {
    const [start, end] = dates ?? [];
    if (start && end) onChange(DateMode.Custom, [formatDateTime(start.toDate()), formatDateTime(end.toDate(), true)]);
    else onChange(DateMode.AllTime, []);
  };

  return (
    <Space.Compact className={className}>
      <Select aria-label="Date range" className="w-36 shrink-0" value={mode} onChange={pickMode} options={[...DATE_MODE_OPTIONS]} popupMatchSelectWidth={false} />
      <DatePicker.RangePicker aria-label="Dates" className="min-w-0 flex-1" value={value} onChange={pickDates} placeholder={['All time', '']} format="DD/MM/YYYY" />
    </Space.Compact>
  );
}
