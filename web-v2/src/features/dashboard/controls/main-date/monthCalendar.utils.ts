/** A month of the calendar grid; `month` counts from 0 like `Date`. */
export interface Month {
  year: number;
  month: number;
}

/** Sunday first, as v1's `v-calendar` showed them. */
export const WEEKDAYS: readonly string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function monthOf(date: Date): Month {
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function addMonths({ year, month }: Month, count: number): Month {
  return monthOf(new Date(year, month + count, 1));
}

/** `October 2026`. */
export function monthTitle({ year, month }: Month): string {
  return `${MONTH_NAMES[month] ?? ''} ${year}`;
}

/** The month's days by week, Sunday first; days of the months around it are `null` (v1 left them blank). */
export function monthWeeks({ year, month }: Month): (Date | null)[][] {
  const lead = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, index) => new Date(year, month, index + 1))];
  const weeks: (Date | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7) {
    const week = cells.slice(start, start + 7);
    weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  }
  return weeks;
}

const dayNumber = (date: Date) => date.getFullYear() * 10_000 + date.getMonth() * 100 + date.getDate();

/** Negative when `a` is an earlier day than `b`, 0 on the same day; the time of day is ignored. */
export function compareDays(a: Date, b: Date): number {
  return dayNumber(a) - dayNumber(b);
}

export function isSameDay(a: Date, b: Date): boolean {
  return compareDays(a, b) === 0;
}

export function isDayBetween(day: Date, start: Date, end: Date): boolean {
  return compareDays(day, start) >= 0 && compareDays(day, end) <= 0;
}

/** Whether some day of the month lies within the bounds; a missing bound is open. */
export function monthInBounds({ year, month }: Month, min?: Date, max?: Date): boolean {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return (!min || compareDays(last, min) >= 0) && (!max || compareDays(first, max) <= 0);
}
