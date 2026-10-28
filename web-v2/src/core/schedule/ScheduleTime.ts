import { asArray, asNumber, asRecord, asString, type JsonObject } from '@/core/json/json';

/**
 * When a job runs: backend `ScheduleTime` (`common/client/domain/scheduler/ScheduleTime.scala`), discriminated by
 * `class_name`. Shared by ingestion jobs and Data cook.
 *
 * This is the server's format only (v1 calls it "V2"); v1's UI classes with `at_time` are not ported. The server ignores
 * `at_time` and sets `start_time` to the moment of saving, which is how v1's "Add Job" lost the picked time.
 * `at_hour`, `at_minute` and `at_second` are UTC; converting from the user's local time is the form's job.
 */

export const ScheduleClassName = {
  None: 'none_schedule',
  Once: 'schedule_once',
  Minutely: 'schedule_minutely',
  Hourly: 'schedule_hourly',
  Daily: 'schedule_daily',
  Weekly: 'schedule_weekly',
  Monthly: 'schedule_monthly'
} as const;

export type ScheduleClassName = (typeof ScheduleClassName)[keyof typeof ScheduleClassName];

/** `java.time.DayOfWeek` names; the server rejects any other spelling (`Monday` is a 400). */
export const DayOfWeek = {
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY',
  Sunday: 'SUNDAY'
} as const;

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

const DAYS: readonly string[] = Object.values(DayOfWeek);

/** At a time of day, UTC. */
interface AtTime {
  readonly atHour: number;
  readonly atMinute: number;
  readonly atSecond: number;
}

/** `startTime` (epoch millis) is when the schedule starts; for `once` it is the run itself. */
export type ScheduleTime =
  | { readonly kind: 'none' }
  | { readonly kind: 'once'; readonly startTime: number }
  | { readonly kind: 'minutely'; readonly recurEvery: number; readonly startTime: number }
  | { readonly kind: 'hourly'; readonly recurEvery: number; readonly startTime: number }
  | { readonly kind: 'daily'; readonly recurEvery: number; readonly startTime: number }
  | ({
      readonly kind: 'weekly';
      readonly recurEvery: number;
      readonly includeDays: readonly DayOfWeek[];
      readonly startTime: number;
    } & AtTime)
  | ({
      readonly kind: 'monthly';
      readonly recurOnDays: readonly number[];
      readonly recurEveryMonth: number;
      readonly startTime: number;
    } & AtTime);

function atTimeFromJson(json: JsonObject): AtTime {
  return { atHour: asNumber(json['at_hour']), atMinute: asNumber(json['at_minute']), atSecond: asNumber(json['at_second']) };
}

/** An unknown or missing `class_name` reads as `none`, like v1. */
export function scheduleTimeFromJson(value: unknown): ScheduleTime {
  const json = asRecord(value);
  const startTime = asNumber(json['start_time']);
  const recurEvery = asNumber(json['recur_every']);
  switch (asString(json['class_name'])) {
    case ScheduleClassName.Once:
      return { kind: 'once', startTime };
    case ScheduleClassName.Minutely:
      return { kind: 'minutely', recurEvery, startTime };
    case ScheduleClassName.Hourly:
      return { kind: 'hourly', recurEvery, startTime };
    case ScheduleClassName.Daily:
      return { kind: 'daily', recurEvery, startTime };
    case ScheduleClassName.Weekly:
      return {
        kind: 'weekly',
        recurEvery,
        includeDays: asArray(json['include_days']).filter((day): day is DayOfWeek => DAYS.includes(day as string)),
        startTime,
        ...atTimeFromJson(json)
      };
    case ScheduleClassName.Monthly:
      return {
        kind: 'monthly',
        recurOnDays: asArray(json['recur_on_days']).filter((day): day is number => typeof day === 'number'),
        recurEveryMonth: asNumber(json['recur_every_month']),
        startTime,
        ...atTimeFromJson(json)
      };
    default:
      return { kind: 'none' };
  }
}

function atTimeToJson({ atHour, atMinute, atSecond }: AtTime): JsonObject {
  return { at_hour: atHour, at_minute: atMinute, at_second: atSecond };
}

export function scheduleTimeToJson(schedule: ScheduleTime): JsonObject {
  switch (schedule.kind) {
    case 'none':
      return { class_name: ScheduleClassName.None };
    case 'once':
      return { class_name: ScheduleClassName.Once, start_time: schedule.startTime };
    case 'minutely':
      return { class_name: ScheduleClassName.Minutely, recur_every: schedule.recurEvery, start_time: schedule.startTime };
    case 'hourly':
      return { class_name: ScheduleClassName.Hourly, recur_every: schedule.recurEvery, start_time: schedule.startTime };
    case 'daily':
      return { class_name: ScheduleClassName.Daily, recur_every: schedule.recurEvery, start_time: schedule.startTime };
    case 'weekly':
      return {
        class_name: ScheduleClassName.Weekly,
        recur_every: schedule.recurEvery,
        ...atTimeToJson(schedule),
        include_days: [...schedule.includeDays],
        start_time: schedule.startTime
      };
    case 'monthly':
      return {
        class_name: ScheduleClassName.Monthly,
        recur_on_days: [...schedule.recurOnDays],
        recur_every_month: schedule.recurEveryMonth,
        ...atTimeToJson(schedule),
        start_time: schedule.startTime
      };
  }
}
