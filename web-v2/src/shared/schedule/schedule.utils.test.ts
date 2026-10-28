import { describe, expect, it } from 'vitest';
import { DayOfWeek, type ScheduleTime } from '@/core/schedule/ScheduleTime';
import {
  defaultScheduleFormValues,
  formValuesToSchedule,
  Frequency,
  fromLocalParts,
  hasTimeOfDay,
  recurUnit,
  scheduleFormSchema,
  ScheduleMode,
  scheduleToFormValues,
  shiftDayOfMonth,
  shiftDays,
  shiftTime,
  toLocalParts,
  type ScheduleFormValues
} from './schedule.utils';

/** Ho Chi Minh City, UTC+7, no daylight saving. */
const SAIGON = () => 420;
const NEW_YORK_WINTER = () => -300;
/** 2026-10-29 10:15:30 in UTC+7, a Thursday. */
const NOW = Date.UTC(2026, 9, 29, 3, 15, 30);

function values(overrides: Partial<ScheduleFormValues> = {}): ScheduleFormValues {
  return { ...defaultScheduleFormValues(NOW, SAIGON), mode: ScheduleMode.Recurring, ...overrides };
}

function errorsOf(form: ScheduleFormValues): Record<string, string> {
  const result = scheduleFormSchema.safeParse(form);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map(issue => [issue.path.join('.'), issue.message]));
}

describe('toLocalParts', () => {
  it('reads an instant in the offset, crossing midnight', () => {
    expect(toLocalParts(Date.UTC(2026, 9, 29, 17, 30, 5), SAIGON)).toEqual({
      date: '2026-10-30',
      time: '00:30:05',
      dayOfMonth: 30
    });
  });

  it('works west of UTC', () => {
    expect(toLocalParts(Date.UTC(2026, 0, 1, 2, 0, 0), NEW_YORK_WINTER)).toEqual({
      date: '2025-12-31',
      time: '21:00:00',
      dayOfMonth: 31
    });
  });
});

describe('fromLocalParts', () => {
  it('is the inverse of toLocalParts', () => {
    expect(fromLocalParts('2026-10-30', '00:30:05', SAIGON)).toBe(Date.UTC(2026, 9, 29, 17, 30, 5));
    expect(fromLocalParts('2025-12-31', '21:00:00', NEW_YORK_WINTER)).toBe(Date.UTC(2026, 0, 1, 2, 0, 0));
  });
});

describe('shiftTime', () => {
  it.each([
    [6 * 3600, -420, 23 * 3600, -1],
    [23 * 3600, 120, 3600, 1],
    [3600, 0, 3600, 0],
    [0, -1, 86_340, -1]
  ])('moves %i s by %i min to %i s, %i days', (seconds, offset, expected, dayShift) => {
    expect(shiftTime(seconds, offset)).toEqual({ seconds: expected, dayShift });
  });
});

describe('shiftDays', () => {
  it('moves days back across Monday', () => {
    expect(shiftDays([DayOfWeek.Monday, DayOfWeek.Sunday], -1)).toEqual([DayOfWeek.Saturday, DayOfWeek.Sunday]);
  });

  it('moves days forward across Sunday', () => {
    expect(shiftDays([DayOfWeek.Sunday], 1)).toEqual([DayOfWeek.Monday]);
  });

  it('keeps week order, drops repeats and leaves the input alone', () => {
    const days = [DayOfWeek.Friday, DayOfWeek.Monday, DayOfWeek.Monday];
    expect(shiftDays(days, 0)).toEqual([DayOfWeek.Monday, DayOfWeek.Friday]);
    expect(days).toEqual([DayOfWeek.Friday, DayOfWeek.Monday, DayOfWeek.Monday]);
  });

  it('is empty for no days', () => {
    expect(shiftDays([], 1)).toEqual([]);
  });
});

describe('shiftDayOfMonth', () => {
  it.each([
    [1, -1, 31],
    [31, 1, 1],
    [15, 0, 15],
    [15, 1, 16]
  ])('moves day %i by %i to %i', (day, shift, expected) => {
    expect(shiftDayOfMonth(day, shift)).toBe(expected);
  });
});

describe('hasTimeOfDay', () => {
  it.each([
    [ScheduleMode.Once, Frequency.Minutely, true],
    [ScheduleMode.Recurring, Frequency.Minutely, false],
    [ScheduleMode.Recurring, Frequency.Hourly, false],
    [ScheduleMode.Recurring, Frequency.Daily, true],
    [ScheduleMode.Recurring, Frequency.Weekly, true],
    [ScheduleMode.Recurring, Frequency.Monthly, true]
  ])('%s %s → %s', (mode, frequency, expected) => {
    expect(hasTimeOfDay({ mode, frequency })).toBe(expected);
  });
});

describe('recurUnit', () => {
  it.each([
    [Frequency.Minutely, 'minutes'],
    [Frequency.Hourly, 'hours'],
    [Frequency.Daily, 'days'],
    [Frequency.Weekly, 'weeks'],
    [Frequency.Monthly, 'months']
  ])('%s → %s', (frequency, unit) => {
    expect(recurUnit(frequency)).toBe(unit);
  });
});

describe('defaultScheduleFormValues', () => {
  it('runs once, now, in local time', () => {
    expect(defaultScheduleFormValues(NOW, SAIGON)).toEqual({
      mode: 'once',
      frequency: 'daily',
      recurEvery: 1,
      recurOnDay: 29,
      recurEveryMonth: 1,
      days: [],
      date: '2026-10-29',
      time: '10:15:30'
    });
  });
});

describe('scheduleFormSchema', () => {
  it('accepts the defaults', () => {
    expect(errorsOf(defaultScheduleFormValues(NOW, SAIGON))).toEqual({});
  });

  it('needs a date and a time to run once', () => {
    expect(errorsOf(values({ mode: ScheduleMode.Once, date: '', time: '9:00' }))).toEqual({
      date: 'Date is required!',
      time: 'Time is required!'
    });
  });

  it.each([0, -1, 1.5])('rejects recurring every %d', recurEvery => {
    expect(errorsOf(values({ frequency: Frequency.Hourly, recurEvery }))).toEqual({ recurEvery: 'Must be at least 1' });
  });

  it('needs a day for weekly', () => {
    expect(errorsOf(values({ frequency: Frequency.Weekly, days: [] }))).toEqual({ days: 'Pick at least one day' });
  });

  it('checks the day and months of monthly, not recurEvery', () => {
    expect(errorsOf(values({ frequency: Frequency.Monthly, recurEvery: 0, recurOnDay: 32, recurEveryMonth: 0 }))).toEqual({
      recurOnDay: 'Day must be from 1 to 31',
      recurEveryMonth: 'Must be at least 1'
    });
  });

  it('needs a time for daily, not for minutely', () => {
    expect(errorsOf(values({ frequency: Frequency.Daily, time: '' }))).toEqual({ time: 'Time is required!' });
    expect(errorsOf(values({ frequency: Frequency.Minutely, time: '' }))).toEqual({});
  });
});

describe('scheduleToFormValues', () => {
  const recurring = values();

  it('reads run once in local time', () => {
    const form = scheduleToFormValues({ kind: 'once', startTime: Date.UTC(2026, 9, 29, 17, 30, 5) }, NOW, SAIGON);
    expect(form).toEqual({ ...recurring, mode: 'once', date: '2026-10-30', time: '00:30:05' });
  });

  it('opens none as daily from now', () => {
    expect(scheduleToFormValues({ kind: 'none' }, NOW, SAIGON)).toEqual(recurring);
  });

  it.each(['minutely', 'hourly'] as const)('reads %s', kind => {
    expect(scheduleToFormValues({ kind, recurEvery: 5, startTime: 0 }, NOW, SAIGON)).toEqual({
      ...recurring,
      frequency: kind,
      recurEvery: 5
    });
  });

  it('reads the local time of daily', () => {
    const form = scheduleToFormValues({ kind: 'daily', recurEvery: 2, startTime: Date.UTC(2026, 0, 1, 1, 0, 0) }, NOW, SAIGON);
    expect(form).toEqual({ ...recurring, frequency: 'daily', recurEvery: 2, time: '08:00:00' });
  });

  it('moves weekly days forward when UTC is the day before', () => {
    const weekly: ScheduleTime = {
      kind: 'weekly',
      recurEvery: 1,
      includeDays: [DayOfWeek.Sunday],
      startTime: 0,
      atHour: 23,
      atMinute: 0,
      atSecond: 0
    };
    expect(scheduleToFormValues(weekly, NOW, SAIGON)).toEqual({
      ...recurring,
      frequency: 'weekly',
      days: [DayOfWeek.Monday],
      time: '06:00:00'
    });
  });

  it('reads monthly, moving the day', () => {
    const monthly: ScheduleTime = {
      kind: 'monthly',
      recurOnDays: [31],
      recurEveryMonth: 2,
      startTime: 0,
      atHour: 20,
      atMinute: 30,
      atSecond: 0
    };
    expect(scheduleToFormValues(monthly, NOW, SAIGON)).toEqual({
      ...recurring,
      frequency: 'monthly',
      recurOnDay: 1,
      recurEveryMonth: 2,
      time: '03:30:00'
    });
  });

  it('reads monthly without days as day 1', () => {
    const monthly: ScheduleTime = { kind: 'monthly', recurOnDays: [], recurEveryMonth: 1, startTime: 0, atHour: 0, atMinute: 0, atSecond: 0 };
    expect(scheduleToFormValues(monthly, NOW, SAIGON).recurOnDay).toBe(1);
  });
});

describe('formValuesToSchedule', () => {
  it('runs once at the local date and time', () => {
    expect(formValuesToSchedule(values({ mode: ScheduleMode.Once, date: '2026-10-30', time: '00:30:05' }), NOW, SAIGON)).toEqual({
      kind: 'once',
      startTime: Date.UTC(2026, 9, 29, 17, 30, 5)
    });
  });

  it.each(['minutely', 'hourly'] as const)('starts %s now', frequency => {
    expect(formValuesToSchedule(values({ frequency, recurEvery: 3 }), NOW, SAIGON)).toEqual({
      kind: frequency,
      recurEvery: 3,
      startTime: NOW
    });
  });

  it('starts daily today at the picked time', () => {
    expect(formValuesToSchedule(values({ frequency: Frequency.Daily, recurEvery: 1, time: '08:00:00' }), NOW, SAIGON)).toEqual({
      kind: 'daily',
      recurEvery: 1,
      startTime: Date.UTC(2026, 9, 29, 1, 0, 0)
    });
  });

  it('sends weekly in UTC, moving the days back across midnight', () => {
    const form = values({ frequency: Frequency.Weekly, recurEvery: 2, days: [DayOfWeek.Monday, DayOfWeek.Thursday], time: '06:00:00' });
    expect(formValuesToSchedule(form, NOW, SAIGON)).toEqual({
      kind: 'weekly',
      recurEvery: 2,
      includeDays: [DayOfWeek.Wednesday, DayOfWeek.Sunday],
      startTime: Date.UTC(2026, 9, 28, 23, 0, 0),
      atHour: 23,
      atMinute: 0,
      atSecond: 0
    });
  });

  it('keeps weekly days when UTC is the same day', () => {
    const form = values({ frequency: Frequency.Weekly, days: [DayOfWeek.Monday], time: '12:00:00' });
    expect(formValuesToSchedule(form, NOW, SAIGON)).toMatchObject({ includeDays: [DayOfWeek.Monday], atHour: 5 });
  });

  it('sends monthly in UTC, moving the day forward west of UTC', () => {
    const form = values({ frequency: Frequency.Monthly, recurOnDay: 31, recurEveryMonth: 1, time: '21:15:10' });
    expect(formValuesToSchedule(form, NOW, NEW_YORK_WINTER)).toMatchObject({
      kind: 'monthly',
      recurOnDays: [1],
      recurEveryMonth: 1,
      atHour: 2,
      atMinute: 15,
      atSecond: 10
    });
  });

  it('round-trips weekly and monthly', () => {
    const weekly = values({ frequency: Frequency.Weekly, days: [DayOfWeek.Monday, DayOfWeek.Sunday], time: '03:00:00' });
    expect(scheduleToFormValues(formValuesToSchedule(weekly, NOW, SAIGON), NOW, SAIGON)).toEqual(weekly);
    const monthly = values({ frequency: Frequency.Monthly, recurOnDay: 1, recurEveryMonth: 3, time: '05:00:00' });
    expect(scheduleToFormValues(formValuesToSchedule(monthly, NOW, SAIGON), NOW, SAIGON)).toEqual(monthly);
  });
});
