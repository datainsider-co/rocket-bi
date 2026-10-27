import { describe, expect, it } from 'vitest';
import { addMonths, compareDays, isDayBetween, isSameDay, monthInBounds, monthOf, monthTitle, monthWeeks, WEEKDAYS } from './monthCalendar.utils';

describe('monthOf and addMonths', () => {
  it('reads the month of a date', () => {
    expect(monthOf(new Date(2026, 9, 27, 15))).toEqual({ year: 2026, month: 9 });
  });

  it.each([
    [{ year: 2026, month: 9 }, 1, { year: 2026, month: 10 }],
    [{ year: 2026, month: 11 }, 1, { year: 2027, month: 0 }],
    [{ year: 2026, month: 0 }, -1, { year: 2025, month: 11 }],
    [{ year: 2026, month: 5 }, 0, { year: 2026, month: 5 }]
  ])('moves %o by %i months', (month, count, expected) => {
    expect(addMonths(month, count)).toEqual(expected);
  });
});

describe('monthTitle', () => {
  it('names the month and year', () => {
    expect(monthTitle({ year: 2026, month: 9 })).toBe('October 2026');
    expect(monthTitle({ year: 2027, month: 0 })).toBe('January 2027');
  });
});

describe('monthWeeks', () => {
  it('starts on Sunday with blanks before the first day', () => {
    // 1 October 2026 is a Thursday.
    const weeks = monthWeeks({ year: 2026, month: 9 });
    expect(weeks).toHaveLength(5);
    expect(weeks[0]!.slice(0, 4)).toEqual([null, null, null, null]);
    expect(weeks[0]![4]).toEqual(new Date(2026, 9, 1));
    expect(weeks.at(-1)!.map(day => day?.getDate() ?? null)).toEqual([25, 26, 27, 28, 29, 30, 31]);
    expect(WEEKDAYS).toHaveLength(7);
  });

  it('fills the last week with blanks', () => {
    // February 2026 starts on Sunday and has 28 days: four full weeks.
    expect(monthWeeks({ year: 2026, month: 1 })).toHaveLength(4);
    const june = monthWeeks({ year: 2026, month: 5 });
    expect(june.at(-1)!.map(day => day?.getDate() ?? null)).toEqual([28, 29, 30, null, null, null, null]);
    expect(june.every(week => week.length === 7)).toBe(true);
  });

  it('has six weeks for a month spread over them', () => {
    // 1 August 2026 is a Saturday; 31 days.
    expect(monthWeeks({ year: 2026, month: 7 })).toHaveLength(6);
  });
});

describe('day comparisons', () => {
  const morning = new Date(2026, 9, 27, 8);
  const evening = new Date(2026, 9, 27, 22);

  it('ignores the time of day', () => {
    expect(compareDays(morning, evening)).toBe(0);
    expect(isSameDay(morning, evening)).toBe(true);
    expect(compareDays(new Date(2026, 9, 26), morning)).toBeLessThan(0);
    expect(compareDays(new Date(2026, 10, 1), morning)).toBeGreaterThan(0);
    expect(isSameDay(new Date(2025, 9, 27), morning)).toBe(false);
  });

  it('includes both ends of a range', () => {
    const start = new Date(2026, 9, 1);
    expect(isDayBetween(start, start, evening)).toBe(true);
    expect(isDayBetween(morning, start, evening)).toBe(true);
    expect(isDayBetween(new Date(2026, 8, 30), start, evening)).toBe(false);
    expect(isDayBetween(new Date(2026, 9, 28), start, evening)).toBe(false);
  });
});

describe('monthInBounds', () => {
  const october = { year: 2026, month: 9 };

  it('is open without bounds', () => {
    expect(monthInBounds(october)).toBe(true);
  });

  it('needs a day on or after the minimum', () => {
    expect(monthInBounds(october, new Date(2026, 9, 31))).toBe(true);
    expect(monthInBounds(october, new Date(2026, 10, 1))).toBe(false);
  });

  it('needs a day on or before the maximum', () => {
    expect(monthInBounds(october, undefined, new Date(2026, 9, 1))).toBe(true);
    expect(monthInBounds(october, undefined, new Date(2026, 8, 30))).toBe(false);
  });
});
