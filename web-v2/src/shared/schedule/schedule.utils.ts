import { z } from 'zod';
import { DayOfWeek, type ScheduleTime } from '@/core/schedule/ScheduleTime';

/**
 * The form behind `ScheduleFields` (v1 `SchedulerSettingV2`) and its conversion to and from the server's `ScheduleTime`.
 *
 * The form is in the user's local time. The server keeps `start_time` as epoch millis, and the time of day of weekly
 * and monthly schedules as UTC `at_hour` / `at_minute` / `at_second`. When that conversion crosses midnight, the days
 * move with it (a Monday 06:00 run in UTC+7 is a Sunday 23:00 run in UTC); v1 didn't move them.
 *
 * Time zone math takes `offsetAt` (minutes east of UTC at an instant) so it is pure; `browserOffsetAt` is the real one.
 */

export const ScheduleMode = {
  Recurring: 'recurring',
  Once: 'once'
} as const;

export type ScheduleMode = (typeof ScheduleMode)[keyof typeof ScheduleMode];

export const Frequency = {
  Minutely: 'minutely',
  Hourly: 'hourly',
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly'
} as const;

export type Frequency = (typeof Frequency)[keyof typeof Frequency];

/** v1 `FrequencyOptions`, in its order. */
export const FREQUENCY_OPTIONS: readonly { value: Frequency; label: string }[] = [
  { value: Frequency.Minutely, label: 'Minutely' },
  { value: Frequency.Hourly, label: 'Hourly' },
  { value: Frequency.Daily, label: 'Daily' },
  { value: Frequency.Weekly, label: 'Weekly' },
  { value: Frequency.Monthly, label: 'Monthly' }
];

/** Monday first, like v1 `DaysOfWeekOptions`. */
export const DAY_OPTIONS: readonly { value: DayOfWeek; label: string }[] = [
  { value: DayOfWeek.Monday, label: 'Mon' },
  { value: DayOfWeek.Tuesday, label: 'Tue' },
  { value: DayOfWeek.Wednesday, label: 'Wed' },
  { value: DayOfWeek.Thursday, label: 'Thu' },
  { value: DayOfWeek.Friday, label: 'Fri' },
  { value: DayOfWeek.Saturday, label: 'Sat' },
  { value: DayOfWeek.Sunday, label: 'Sun' }
];

const WEEK: readonly DayOfWeek[] = DAY_OPTIONS.map(option => option.value);

/** Minutes east of UTC at `epochMillis`; differs across daylight saving changes. */
export type OffsetAt = (epochMillis: number) => number;

export const browserOffsetAt: OffsetAt = epochMillis => -new Date(epochMillis).getTimezoneOffset();

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2}):(\d{2})$/;
const SECONDS_PER_DAY = 86_400;
const MAX_DAY_OF_MONTH = 31;

export const scheduleFormSchema = z
  .object({
    mode: z.enum([ScheduleMode.Recurring, ScheduleMode.Once]),
    frequency: z.enum([Frequency.Minutely, Frequency.Hourly, Frequency.Daily, Frequency.Weekly, Frequency.Monthly]),
    /** Minutes, hours, days or weeks, by `frequency`. */
    recurEvery: z.number(),
    /** Monthly: the day of the month. */
    recurOnDay: z.number(),
    recurEveryMonth: z.number(),
    /** Weekly, in local time. */
    days: z.array(z.enum(WEEK as [DayOfWeek, ...DayOfWeek[]])),
    /** `YYYY-MM-DD`, local: the day of a run-once schedule. */
    date: z.string(),
    /** `HH:mm:ss`, local: when a run-once, daily, weekly or monthly schedule runs. */
    time: z.string()
  })
  .superRefine((values, ctx) => {
    const fail = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });

    if (values.mode === ScheduleMode.Once) {
      if (!DATE_PATTERN.test(values.date)) fail('date', 'Date is required!');
      if (!TIME_PATTERN.test(values.time)) fail('time', 'Time is required!');
      return;
    }
    if (values.frequency === Frequency.Monthly) {
      if (!isWholeBetween(values.recurOnDay, 1, MAX_DAY_OF_MONTH)) fail('recurOnDay', 'Day must be from 1 to 31');
      if (!isWholeBetween(values.recurEveryMonth, 1, Number.MAX_SAFE_INTEGER)) fail('recurEveryMonth', 'Must be at least 1');
    } else if (!isWholeBetween(values.recurEvery, 1, Number.MAX_SAFE_INTEGER)) {
      fail('recurEvery', 'Must be at least 1');
    }
    if (values.frequency === Frequency.Weekly && values.days.length === 0) fail('days', 'Pick at least one day');
    if (hasTimeOfDay(values) && !TIME_PATTERN.test(values.time)) fail('time', 'Time is required!');
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

/** A form that edits a schedule; `ScheduleFields` works on its `schedule`. */
export interface WithSchedule {
  schedule: ScheduleFormValues;
}

function isWholeBetween(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/** Whether the form asks for a time of day: not for Minutely and Hourly, which start now. */
export function hasTimeOfDay(values: Pick<ScheduleFormValues, 'mode' | 'frequency'>): boolean {
  return values.mode === ScheduleMode.Once || (values.frequency !== Frequency.Minutely && values.frequency !== Frequency.Hourly);
}

/** The unit after "Recurs every" (v1 `postLabel`); Monthly has its own wording. */
export function recurUnit(frequency: Frequency): string {
  switch (frequency) {
    case Frequency.Minutely:
      return 'minutes';
    case Frequency.Hourly:
      return 'hours';
    case Frequency.Daily:
      return 'days';
    case Frequency.Weekly:
      return 'weeks';
    case Frequency.Monthly:
      return 'months';
  }
}

const pad = (value: number) => String(value).padStart(2, '0');

interface LocalParts {
  readonly date: string;
  readonly time: string;
  /** 1 to 31. */
  readonly dayOfMonth: number;
}

export function toLocalParts(epochMillis: number, offsetAt: OffsetAt): LocalParts {
  const local = new Date(epochMillis + offsetAt(epochMillis) * 60_000);
  return {
    date: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`,
    dayOfMonth: local.getUTCDate()
  };
}

/** Epoch millis of a local `date` and `time` (both valid). */
export function fromLocalParts(date: string, time: string, offsetAt: OffsetAt): number {
  const [, year, month, day] = DATE_PATTERN.exec(date) ?? [];
  const naive = Date.UTC(Number(year), Number(month) - 1, Number(day)) + secondsOfDay(time) * 1000;
  return naive - offsetAt(naive) * 60_000;
}

function secondsOfDay(time: string): number {
  const [, hour, minute, second] = TIME_PATTERN.exec(time) ?? [];
  return Number(hour) * 3600 + Number(minute) * 60 + Number(second);
}

function timeOfSeconds(seconds: number): string {
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

/** Moves a time of day by `offsetMinutes`: the new time and how many days it moved (-1, 0 or 1). */
export function shiftTime(seconds: number, offsetMinutes: number): { seconds: number; dayShift: number } {
  const shifted = seconds + offsetMinutes * 60;
  const dayShift = Math.floor(shifted / SECONDS_PER_DAY);
  return { seconds: shifted - dayShift * SECONDS_PER_DAY, dayShift };
}

/** Weekdays moved by `dayShift`, kept in week order. */
export function shiftDays(days: readonly DayOfWeek[], dayShift: number): DayOfWeek[] {
  const indexes = new Set(days.map(day => (WEEK.indexOf(day) + dayShift + 7) % 7));
  return WEEK.filter((_, index) => indexes.has(index));
}

/**
 * A day of the month moved by `dayShift`, wrapping at 1 and 31. Only an approximation for months shorter than 31
 * days: the server has a single list of days for every month.
 */
export function shiftDayOfMonth(day: number, dayShift: number): number {
  return ((day - 1 + dayShift + MAX_DAY_OF_MONTH) % MAX_DAY_OF_MONTH) + 1;
}

/** A new job's schedule, like v1 `JdbcJob.default`: run once, now. */
export function defaultScheduleFormValues(now: number, offsetAt: OffsetAt): ScheduleFormValues {
  const { date, time, dayOfMonth } = toLocalParts(now, offsetAt);
  return {
    mode: ScheduleMode.Once,
    frequency: Frequency.Daily,
    recurEvery: 1,
    recurOnDay: dayOfMonth,
    recurEveryMonth: 1,
    days: [],
    date,
    time
  };
}

/** The form for a saved schedule. `none` (never runs, not offered by v1's form either) opens as daily from now. */
export function scheduleToFormValues(schedule: ScheduleTime, now: number, offsetAt: OffsetAt): ScheduleFormValues {
  const recurring = { ...defaultScheduleFormValues(now, offsetAt), mode: ScheduleMode.Recurring };
  switch (schedule.kind) {
    case 'none':
      return recurring;
    case 'once': {
      const { date, time } = toLocalParts(schedule.startTime, offsetAt);
      return { ...recurring, mode: ScheduleMode.Once, date, time };
    }
    case 'minutely':
    case 'hourly':
      return { ...recurring, frequency: schedule.kind, recurEvery: schedule.recurEvery };
    case 'daily':
      return { ...recurring, frequency: Frequency.Daily, recurEvery: schedule.recurEvery, time: toLocalParts(schedule.startTime, offsetAt).time };
    case 'weekly': {
      const { seconds, dayShift } = shiftTime(atSeconds(schedule), offsetAt(now));
      return {
        ...recurring,
        frequency: Frequency.Weekly,
        recurEvery: schedule.recurEvery,
        days: shiftDays(schedule.includeDays, dayShift),
        time: timeOfSeconds(seconds)
      };
    }
    case 'monthly': {
      const { seconds, dayShift } = shiftTime(atSeconds(schedule), offsetAt(now));
      return {
        ...recurring,
        frequency: Frequency.Monthly,
        recurOnDay: shiftDayOfMonth(schedule.recurOnDays[0] ?? 1, dayShift),
        recurEveryMonth: schedule.recurEveryMonth,
        time: timeOfSeconds(seconds)
      };
    }
  }
}

function atSeconds({ atHour, atMinute, atSecond }: { atHour: number; atMinute: number; atSecond: number }): number {
  return atHour * 3600 + atMinute * 60 + atSecond;
}

function toAtTime(seconds: number) {
  return { atHour: Math.floor(seconds / 3600), atMinute: Math.floor((seconds % 3600) / 60), atSecond: seconds % 60 };
}

/**
 * The schedule to save from valid form values. Recurring schedules start today: Minutely and Hourly now (the server's
 * default too), the others at the picked time.
 */
export function formValuesToSchedule(values: ScheduleFormValues, now: number, offsetAt: OffsetAt): ScheduleTime {
  if (values.mode === ScheduleMode.Once) {
    return { kind: 'once', startTime: fromLocalParts(values.date, values.time, offsetAt) };
  }
  const startTime = fromLocalParts(toLocalParts(now, offsetAt).date, values.time, offsetAt);
  const utc = shiftTime(secondsOfDay(values.time), -offsetAt(now));
  switch (values.frequency) {
    case Frequency.Minutely:
    case Frequency.Hourly:
      return { kind: values.frequency, recurEvery: values.recurEvery, startTime: now };
    case Frequency.Daily:
      return { kind: 'daily', recurEvery: values.recurEvery, startTime };
    case Frequency.Weekly:
      return {
        kind: 'weekly',
        recurEvery: values.recurEvery,
        includeDays: shiftDays(values.days, utc.dayShift),
        startTime,
        ...toAtTime(utc.seconds)
      };
    case Frequency.Monthly:
      return {
        kind: 'monthly',
        recurOnDays: [shiftDayOfMonth(values.recurOnDay, utc.dayShift)],
        recurEveryMonth: values.recurEveryMonth,
        startTime,
        ...toAtTime(utc.seconds)
      };
  }
}
