import { DateMode, dateRangeOf, formatDateTime, type DateRange } from '@/core/query/dateRanges';
import type { MainDateState } from '../controls.utils';
import { compareDays, monthOf, type Month } from './monthCalendar.utils';

/** v1 `DateTimeConstants.MAIN_DATE_FILTER_MODE_LIST`: the default ranges a main date filter is set up with. */
export const MAIN_DATE_SETUP_MODES: readonly { value: DateMode; label: string }[] = [
  { value: DateMode.ThisDay, label: 'This Day' },
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
  { value: DateMode.AllTime, label: 'All Time' }
];

/** A local date from `yyyy-MM-dd HH:mm:ss`, the format controls hold; `undefined` when it isn't one. */
export function parseDateTime(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 ? date : undefined;
}

function rangeOfValues(values: readonly string[]): DateRange | null {
  const [start, end] = values.map(parseDateTime);
  return values.length === 2 && start && end ? { start, end } : null;
}

const pad = (value: number) => String(value).padStart(2, '0');

const formatDay = (date: Date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

/** What the trigger shows (v1 `DiCalendar`'s input, `DD/MM/YYYY` range, placeholder All Time). */
export function rangeLabel(range: readonly string[]): string {
  const dates = rangeOfValues(range);
  return dates ? `${formatDay(dates.start)} - ${formatDay(dates.end)}` : 'All Time';
}

/** The picker while it is open: a mode and the range it shows, `null` for all time, and the month each calendar shows. */
export interface CalendarState {
  mode: DateMode;
  range: DateRange | null;
  startMonth: Month;
  endMonth: Month;
}

export type CalendarAction =
  /** Opens on the applied choice (v1 `showDatePicker` from `oldCalendarData`). */
  | { type: 'open'; mainDate: MainDateState; now: Date }
  | { type: 'preset'; mode: DateMode; now: Date }
  | { type: 'start'; day: Date; now: Date }
  | { type: 'end'; day: Date; now: Date }
  | { type: 'month'; side: 'start' | 'end'; month: Month };

function shown(mode: DateMode, range: DateRange | null, now: Date): CalendarState {
  return { mode, range, startMonth: monthOf(range?.start ?? now), endMonth: monthOf(range?.end ?? now) };
}

/** The range a preset stands for; Custom keeps the range shown, or takes the last 30 days (v1 `timePresetOptionsSelected`). */
function presetRange(mode: DateMode, current: DateRange | null, now: Date): DateRange | null {
  if (mode === DateMode.Custom) return current ?? dateRangeOf(DateMode.Last30Days, now);
  return dateRangeOf(mode, now);
}

/** Today stands in for a missing end of the range, as v1's calendars did. */
export function calendarBounds(range: DateRange | null, now: Date): DateRange {
  return { start: range?.start ?? now, end: range?.end ?? now };
}

/** v1 `DiCalendar`: picking a day makes the range Custom; a start after the end, or an end before the start, is ignored. */
export function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'open': {
      const { mode, dates } = action.mainDate;
      if (mode !== DateMode.Custom) return shown(mode, dateRangeOf(mode, action.now), action.now);
      const range = rangeOfValues(dates);
      return range ? shown(mode, range, action.now) : shown(DateMode.AllTime, null, action.now);
    }
    case 'preset':
      return shown(action.mode, presetRange(action.mode, state.range, action.now), action.now);
    case 'start': {
      const { end } = calendarBounds(state.range, action.now);
      if (compareDays(action.day, end) > 0) return state;
      return { ...state, mode: DateMode.Custom, range: { start: action.day, end } };
    }
    case 'end': {
      const { start } = calendarBounds(state.range, action.now);
      if (compareDays(action.day, start) < 0) return state;
      return { ...state, mode: DateMode.Custom, range: { start, end: action.day } };
    }
    case 'month':
      return action.side === 'start' ? { ...state, startMonth: action.month } : { ...state, endMonth: action.month };
  }
}

/** The closed picker before it first opens. */
export function initialCalendar(now: Date): CalendarState {
  return shown(DateMode.AllTime, null, now);
}

/** What Apply sets: a relative mode is computed again each time it is applied, a custom range keeps its two days. */
export function appliedMainDate({ mode, range }: CalendarState): MainDateState {
  if (mode === DateMode.Custom && range) return { mode, dates: [formatDateTime(range.start), formatDateTime(range.end, true)] };
  return { mode: mode === DateMode.Custom ? DateMode.AllTime : mode, dates: [] };
}
