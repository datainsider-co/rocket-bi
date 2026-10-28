import { describe, expect, it } from 'vitest';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { scheduleTimeFromJson, scheduleTimeToJson } from './ScheduleTime';

const START = 1893456000000;

describe('scheduleTimeFromJson', () => {
  it.each([
    [{ class_name: 'none_schedule' }, { kind: 'none' }],
    [{ class_name: 'schedule_once', start_time: START }, { kind: 'once', startTime: START }],
    [
      { class_name: 'schedule_minutely', recur_every: 5, start_time: START },
      { kind: 'minutely', recurEvery: 5, startTime: START }
    ],
    [
      { class_name: 'schedule_hourly', recur_every: 2, start_time: START },
      { kind: 'hourly', recurEvery: 2, startTime: START }
    ],
    [
      { class_name: 'schedule_daily', recur_every: 1, start_time: START },
      { kind: 'daily', recurEvery: 1, startTime: START }
    ]
  ])('reads %j', (json, expected) => {
    expect(scheduleTimeFromJson(json)).toEqual(expected);
  });

  it('reads a weekly schedule and drops days the server would reject', () => {
    expect(
      scheduleTimeFromJson({
        class_name: 'schedule_weekly',
        recur_every: 1,
        at_hour: 7,
        at_minute: 30,
        at_second: 0,
        include_days: ['MONDAY', 'Friday', 3, 'FRIDAY'],
        start_time: START
      })
    ).toEqual({
      kind: 'weekly',
      recurEvery: 1,
      atHour: 7,
      atMinute: 30,
      atSecond: 0,
      includeDays: ['MONDAY', 'FRIDAY'],
      startTime: START
    });
  });

  it('reads a monthly schedule and keeps only numeric days', () => {
    expect(
      scheduleTimeFromJson({
        class_name: 'schedule_monthly',
        recur_on_days: [1, '15', 28],
        recur_every_month: 2,
        at_hour: 2,
        start_time: START
      })
    ).toEqual({
      kind: 'monthly',
      recurOnDays: [1, 28],
      recurEveryMonth: 2,
      atHour: 2,
      atMinute: 0,
      atSecond: 0,
      startTime: START
    });
  });

  it.each([undefined, null, {}, { class_name: 'schedule_yearly' }, 'schedule_once'])('reads %j as none', json => {
    expect(scheduleTimeFromJson(json)).toEqual({ kind: 'none' });
  });
});

describe('scheduleTimeToJson', () => {
  it.each([
    { class_name: 'none_schedule' },
    { class_name: 'schedule_once', start_time: START },
    { class_name: 'schedule_minutely', recur_every: 5, start_time: START },
    { class_name: 'schedule_hourly', recur_every: 2, start_time: START },
    { class_name: 'schedule_daily', recur_every: 1, start_time: START }
  ])('writes %j back unchanged', json => {
    expect(scheduleTimeToJson(scheduleTimeFromJson(json))).toEqual(json);
  });

  it.each([
    ['weekly', fixture.jobUpdateWeekly.request.job.schedule_time],
    ['monthly', fixture.jobUpdateMonthly.request.job.schedule_time]
  ])('writes the %s schedule the server accepted back unchanged', (_, json) => {
    expect(scheduleTimeToJson(scheduleTimeFromJson(json))).toStrictEqual(json);
  });

  it('copies the day lists', () => {
    const includeDays = ['MONDAY'] as const;
    const json = scheduleTimeToJson({
      kind: 'weekly',
      recurEvery: 1,
      atHour: 0,
      atMinute: 0,
      atSecond: 0,
      includeDays,
      startTime: START
    });

    expect(json['include_days']).not.toBe(includeDays);
  });
});
