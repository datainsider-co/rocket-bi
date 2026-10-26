/**
 * Date ranges of the main date filter and the date select filter (v1 `MainDateMode`, `DateUtils.getDateRange`,
 * `DateFilterUtils.calculatedDates`). Relative modes are computed against `now`, which callers pass in.
 */

/** v1 `MainDateMode` without the compare modes, which only the deprecated compare picker used. */
export const DateMode = {
  ThisDay: 'this_day',
  ThisWeek: 'this_week',
  ThisMonth: 'this_month',
  ThisQuarter: 'this_quarter',
  ThisYear: 'this_year',
  LastDay: 'last_day',
  LastWeek: 'last_week',
  LastMonth: 'last_month',
  LastQuarter: 'last_quarter',
  LastYear: 'last_year',
  Last7Days: 'last_7_days',
  Last30Days: 'last_30_days',
  AllTime: 'all_time',
  Custom: 'custom'
} as const;

export type DateMode = (typeof DateMode)[keyof typeof DateMode];

/** v1 `DATE_RANGE_MODE_OPTION_LIST`, in its order. */
export const DATE_MODE_OPTIONS: readonly { value: DateMode; label: string }[] = [
  { value: DateMode.ThisDay, label: 'Today' },
  { value: DateMode.ThisWeek, label: 'This Week' },
  { value: DateMode.ThisMonth, label: 'This Month' },
  { value: DateMode.ThisQuarter, label: 'This Quarter' },
  { value: DateMode.ThisYear, label: 'This Year' },
  { value: DateMode.LastDay, label: 'Last Day' },
  { value: DateMode.LastWeek, label: 'Last Week' },
  { value: DateMode.LastMonth, label: 'Last Month' },
  { value: DateMode.LastQuarter, label: 'Last Quarter' },
  { value: DateMode.LastYear, label: 'Last Year' },
  { value: DateMode.Last7Days, label: 'Last 7 Days' },
  { value: DateMode.Last30Days, label: 'Last 30 Days' },
  { value: DateMode.Custom, label: 'Custom' },
  { value: DateMode.AllTime, label: 'All Time' }
];

const MODES = new Set<string>(Object.values(DateMode));

export function isDateMode(value: unknown): value is DateMode {
  return typeof value === 'string' && MODES.has(value);
}

export interface DateRange {
  start: Date;
  end: Date;
}

function day(year: number, month: number, date: number): Date {
  return new Date(year, month, date);
}

function daysBefore(now: Date, days: number): Date {
  return day(now.getFullYear(), now.getMonth(), now.getDate() - days);
}

/** The range of a relative mode; `null` for all time and custom (v1 `DateUtils.getDateRange`, weeks start on Sunday). */
export function dateRangeOf(mode: DateMode, now: Date): DateRange | null {
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarterStart = month - (month % 3);
  switch (mode) {
    case DateMode.ThisDay:
      return { start: now, end: now };
    case DateMode.ThisWeek:
      return { start: daysBefore(now, now.getDay()), end: now };
    case DateMode.ThisMonth:
      return { start: day(year, month, 1), end: now };
    case DateMode.ThisQuarter:
      return { start: day(year, quarterStart, 1), end: now };
    case DateMode.ThisYear:
      return { start: day(year, 0, 1), end: now };
    case DateMode.LastDay:
      return { start: daysBefore(now, 1), end: daysBefore(now, 1) };
    case DateMode.LastWeek:
      return { start: daysBefore(now, now.getDay() + 7), end: daysBefore(now, now.getDay() + 1) };
    case DateMode.LastMonth:
      return { start: day(year, month - 1, 1), end: day(year, month, 0) };
    case DateMode.LastQuarter:
      return { start: day(year, quarterStart - 3, 1), end: day(year, quarterStart, 0) };
    case DateMode.LastYear:
      return { start: day(year - 1, 0, 1), end: day(year - 1, 11, 31) };
    case DateMode.Last7Days:
      return { start: daysBefore(now, 7), end: daysBefore(now, 1) };
    case DateMode.Last30Days:
      return { start: daysBefore(now, 30), end: daysBefore(now, 1) };
    case DateMode.AllTime:
    case DateMode.Custom:
      return null;
  }
}

const pad = (value: number) => String(value).padStart(2, '0');

/** `yyyy-MM-dd 00:00:00`, or `23:59:59` for the end of a range (v1 `DateTimeUtils.formatDateTime`). */
export function formatDateTime(date: Date, endOfDay = false): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${endOfDay ? '23:59:59' : '00:00:00'}`;
}

/** `[start, end]` as sent to the server, `[]` for all time (v1 `DateFilterUtils.calculatedDates`). */
export function rangeValues(mode: DateMode, customDates: readonly string[], now: Date): string[] {
  if (mode === DateMode.Custom) return customDates.length === 2 ? [...customDates] : [];
  const range = dateRangeOf(mode, now);
  return range ? [formatDateTime(range.start), formatDateTime(range.end, true)] : [];
}
