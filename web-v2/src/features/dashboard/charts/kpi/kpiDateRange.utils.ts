import { numberComparisonOf, type DateRangeChoice } from '@/core/query/comparison';
import { DateMode, dateRangeOf, formatDateTime } from '@/core/query/dateRanges';
import type { JsonObject } from '@/core/json/json';
import type { MainDateState } from '../../controls/controls.utils';
import { parseDateTime } from '../../controls/main-date/mainDate.utils';

/** A number chart's date range on its card (v1 `DateRangeDropdown`), picked from the main date's popover. */

/** The range a number chart queries with, `undefined` without a date range. */
export function kpiDateRangeOf(setting: JsonObject): DateRangeChoice | undefined {
  const comparison = numberComparisonOf(setting);
  return comparison && { mode: comparison.mode, ...(comparison.range && { range: comparison.range }) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDay = (date: Date) => `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

/**
 * What the card shows (v1 `DateRangeDropdown`'s input, `MMM D, YYYY`): a relative mode's range as of `now`, a custom
 * range's dates, All Time without one.
 */
export function kpiDateRangeLabel({ mode, range }: DateRangeChoice, now: Date): string {
  const dates = mode === DateMode.Custom ? range && { start: range[0], end: range[1] } : dateRangeOf(mode, now);
  return dates ? `${formatDay(dates.start)} - ${formatDay(dates.end)}` : 'All Time';
}

/** The range as the main date popover takes it: a custom range's dates as `yyyy-MM-dd HH:mm:ss`. */
export function toMainDate({ mode, range }: DateRangeChoice): MainDateState {
  return { mode, dates: mode === DateMode.Custom && range ? [formatDateTime(range[0]), formatDateTime(range[1], true)] : [] };
}

/** What the popover applied, as the chart's range; a custom one without its dates is all time, as the popover has it. */
export function fromMainDate({ mode, dates }: MainDateState): DateRangeChoice {
  if (mode !== DateMode.Custom) return { mode };
  const [start, end] = dates.map(parseDateTime);
  return start && end ? { mode, range: [start, end] } : { mode: DateMode.AllTime };
}
