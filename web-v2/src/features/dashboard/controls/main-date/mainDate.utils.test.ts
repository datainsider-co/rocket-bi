import { describe, expect, it } from 'vitest';
import { DateMode } from '@/core/query/dateRanges';
import {
  appliedMainDate,
  calendarBounds,
  calendarReducer,
  initialCalendar,
  MAIN_DATE_SETUP_MODES,
  parseDateTime,
  rangeLabel,
  type CalendarState
} from './mainDate.utils';

// Tuesday 27 October 2026, mid afternoon.
const now = new Date(2026, 9, 27, 15, 30);

describe('MAIN_DATE_SETUP_MODES', () => {
  it("lists v1's modes, without Custom, All Time last", () => {
    expect(MAIN_DATE_SETUP_MODES.map(option => option.label)).toEqual([
      'This Day',
      'This Week',
      'This Month',
      'This Quarter',
      'This Year',
      'Last Day',
      'Last Week',
      'Last Month',
      'Last Quarter',
      'Last Year',
      'Last 7 Days',
      'Last 30 Days',
      'All Time'
    ]);
    expect(MAIN_DATE_SETUP_MODES.some(option => option.value === DateMode.Custom)).toBe(false);
  });
});

describe('parseDateTime', () => {
  it('reads the date part as a local day', () => {
    expect(parseDateTime('2026-10-01 00:00:00')).toEqual(new Date(2026, 9, 1));
    expect(parseDateTime('2026-10-31 23:59:59')).toEqual(new Date(2026, 9, 31));
  });

  it.each(['', 'yesterday', '2026-13-01 00:00:00', '2026-02-30 00:00:00'])('rejects %j', value => {
    expect(parseDateTime(value)).toBeUndefined();
  });
});

describe('rangeLabel', () => {
  it('shows both days as DD/MM/YYYY', () => {
    expect(rangeLabel(['2026-10-01 00:00:00', '2026-10-27 23:59:59'])).toBe('01/10/2026 - 27/10/2026');
  });

  it('says All Time without a range', () => {
    expect(rangeLabel([])).toBe('All Time');
    expect(rangeLabel(['2026-10-01 00:00:00'])).toBe('All Time');
    expect(rangeLabel(['bad', 'worse'])).toBe('All Time');
  });
});

describe('calendarBounds', () => {
  it('uses today for a missing range', () => {
    expect(calendarBounds(null, now)).toEqual({ start: now, end: now });
    const range = { start: new Date(2026, 0, 1), end: new Date(2026, 0, 5) };
    expect(calendarBounds(range, now)).toEqual(range);
  });
});

describe('calendarReducer', () => {
  const closed = initialCalendar(now);

  it('starts on all time, both calendars on this month', () => {
    expect(closed).toEqual({ mode: DateMode.AllTime, range: null, startMonth: { year: 2026, month: 9 }, endMonth: { year: 2026, month: 9 } });
  });

  it('opens on a relative mode with its range', () => {
    const open = calendarReducer(closed, { type: 'open', mainDate: { mode: DateMode.LastMonth, dates: [] }, now });
    expect(open.mode).toBe(DateMode.LastMonth);
    expect(open.range).toEqual({ start: new Date(2026, 8, 1), end: new Date(2026, 8, 30) });
    expect(open.startMonth).toEqual({ year: 2026, month: 8 });
  });

  it('opens on a custom range with its days', () => {
    const open = calendarReducer(closed, { type: 'open', mainDate: { mode: DateMode.Custom, dates: ['2026-01-05 00:00:00', '2026-03-10 23:59:59'] }, now });
    expect(open).toEqual({
      mode: DateMode.Custom,
      range: { start: new Date(2026, 0, 5), end: new Date(2026, 2, 10) },
      startMonth: { year: 2026, month: 0 },
      endMonth: { year: 2026, month: 2 }
    });
  });

  it('opens a custom mode without days as all time', () => {
    expect(calendarReducer(closed, { type: 'open', mainDate: { mode: DateMode.Custom, dates: [] }, now })).toEqual(closed);
  });

  it('shows the range of a picked preset, none for all time', () => {
    const week = calendarReducer(closed, { type: 'preset', mode: DateMode.Last7Days, now });
    expect(week.range).toEqual({ start: new Date(2026, 9, 20), end: new Date(2026, 9, 26) });
    expect(calendarReducer(week, { type: 'preset', mode: DateMode.AllTime, now }).range).toBeNull();
  });

  it('keeps the shown range when Custom is picked, else takes the last 30 days', () => {
    const week = calendarReducer(closed, { type: 'preset', mode: DateMode.Last7Days, now });
    expect(calendarReducer(week, { type: 'preset', mode: DateMode.Custom, now })).toMatchObject({ mode: DateMode.Custom, range: week.range });
    expect(calendarReducer(closed, { type: 'preset', mode: DateMode.Custom, now }).range).toEqual({ start: new Date(2026, 8, 27), end: new Date(2026, 9, 26) });
  });

  it('picks a start day up to the end, switching to Custom', () => {
    const week = calendarReducer(closed, { type: 'preset', mode: DateMode.Last7Days, now });
    const picked = calendarReducer(week, { type: 'start', day: new Date(2026, 9, 1), now });
    expect(picked).toMatchObject({ mode: DateMode.Custom, range: { start: new Date(2026, 9, 1), end: new Date(2026, 9, 26) } });
    expect(calendarReducer(week, { type: 'start', day: new Date(2026, 9, 26, 12), now }).range?.start).toEqual(new Date(2026, 9, 26, 12));
    expect(calendarReducer(week, { type: 'start', day: new Date(2026, 9, 27), now })).toBe(week);
  });

  it('picks an end day from the start, switching to Custom', () => {
    const week = calendarReducer(closed, { type: 'preset', mode: DateMode.Last7Days, now });
    expect(calendarReducer(week, { type: 'end', day: new Date(2026, 10, 2), now }).range).toEqual({ start: new Date(2026, 9, 20), end: new Date(2026, 10, 2) });
    expect(calendarReducer(week, { type: 'end', day: new Date(2026, 9, 19), now })).toBe(week);
  });

  it('bounds picks on all time by today', () => {
    expect(calendarReducer(closed, { type: 'start', day: new Date(2026, 9, 28), now })).toBe(closed);
    expect(calendarReducer(closed, { type: 'start', day: new Date(2026, 9, 2), now }).range).toEqual({ start: new Date(2026, 9, 2), end: now });
    expect(calendarReducer(closed, { type: 'end', day: new Date(2026, 9, 26), now })).toBe(closed);
    expect(calendarReducer(closed, { type: 'end', day: new Date(2026, 10, 3), now }).range).toEqual({ start: now, end: new Date(2026, 10, 3) });
  });

  it('moves one calendar to another month', () => {
    const moved = calendarReducer(closed, { type: 'month', side: 'start', month: { year: 2026, month: 8 } });
    expect(moved.startMonth).toEqual({ year: 2026, month: 8 });
    expect(moved.endMonth).toEqual(closed.endMonth);
    expect(calendarReducer(closed, { type: 'month', side: 'end', month: { year: 2026, month: 10 } }).endMonth).toEqual({ year: 2026, month: 10 });
  });
});

describe('appliedMainDate', () => {
  const state = (mode: DateMode, range: CalendarState['range']): CalendarState => ({ ...initialCalendar(now), mode, range });

  it('keeps the days of a custom range, the end at the end of its day', () => {
    expect(appliedMainDate(state(DateMode.Custom, { start: new Date(2026, 9, 1), end: new Date(2026, 9, 5) }))).toEqual({
      mode: DateMode.Custom,
      dates: ['2026-10-01 00:00:00', '2026-10-05 23:59:59']
    });
  });

  it('keeps only the mode of a relative range', () => {
    expect(appliedMainDate(state(DateMode.LastWeek, { start: new Date(2026, 9, 1), end: new Date(2026, 9, 5) }))).toEqual({ mode: DateMode.LastWeek, dates: [] });
    expect(appliedMainDate(state(DateMode.AllTime, null))).toEqual({ mode: DateMode.AllTime, dates: [] });
  });

  it('treats a custom mode without range as all time', () => {
    expect(appliedMainDate(state(DateMode.Custom, null))).toEqual({ mode: DateMode.AllTime, dates: [] });
  });
});
