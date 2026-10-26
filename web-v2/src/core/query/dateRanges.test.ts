import { describe, expect, it } from 'vitest';
import { DateMode, dateRangeOf, formatDateTime, isDateMode, rangeValues } from './dateRanges';

// Wednesday 2026-08-19.
const now = new Date(2026, 7, 19, 15, 30);

function formatted(mode: DateMode): string[] | null {
  const range = dateRangeOf(mode, now);
  return range && [formatDateTime(range.start), formatDateTime(range.end, true)];
}

describe('dateRangeOf', () => {
  it.each([
    [DateMode.ThisDay, '2026-08-19', '2026-08-19'],
    [DateMode.ThisWeek, '2026-08-16', '2026-08-19'],
    [DateMode.ThisMonth, '2026-08-01', '2026-08-19'],
    [DateMode.ThisQuarter, '2026-07-01', '2026-08-19'],
    [DateMode.ThisYear, '2026-01-01', '2026-08-19'],
    [DateMode.LastDay, '2026-08-18', '2026-08-18'],
    [DateMode.LastWeek, '2026-08-09', '2026-08-15'],
    [DateMode.LastMonth, '2026-07-01', '2026-07-31'],
    [DateMode.LastQuarter, '2026-04-01', '2026-06-30'],
    [DateMode.LastYear, '2025-01-01', '2025-12-31'],
    [DateMode.Last7Days, '2026-08-12', '2026-08-18'],
    [DateMode.Last30Days, '2026-07-20', '2026-08-18']
  ])('%s', (mode, start, end) => {
    expect(formatted(mode)).toEqual([`${start} 00:00:00`, `${end} 23:59:59`]);
  });

  it('crosses the year for the last quarter of January', () => {
    const range = dateRangeOf(DateMode.LastQuarter, new Date(2026, 0, 10));
    expect(range && formatDateTime(range.start)).toBe('2025-10-01 00:00:00');
    expect(range && formatDateTime(range.end)).toBe('2025-12-31 00:00:00');
  });

  it('has no range for all time and custom', () => {
    expect(dateRangeOf(DateMode.AllTime, now)).toBeNull();
    expect(dateRangeOf(DateMode.Custom, now)).toBeNull();
  });
});

describe('rangeValues', () => {
  it('computes relative modes and keeps custom dates', () => {
    expect(rangeValues(DateMode.LastYear, [], now)).toEqual(['2025-01-01 00:00:00', '2025-12-31 23:59:59']);
    expect(rangeValues(DateMode.Custom, ['a', 'b'], now)).toEqual(['a', 'b']);
  });

  it('is empty for all time and incomplete custom dates', () => {
    expect(rangeValues(DateMode.AllTime, ['a', 'b'], now)).toEqual([]);
    expect(rangeValues(DateMode.Custom, ['a'], now)).toEqual([]);
  });
});

describe('isDateMode', () => {
  it('accepts stored modes only', () => {
    expect(isDateMode('last_7_days')).toBe(true);
    expect(isDateMode('previous_period')).toBe(false);
    expect(isDateMode(undefined)).toBe(false);
  });
});
