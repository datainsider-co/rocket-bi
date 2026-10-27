import type { DateRange } from '@/core/query/dateRanges';
import { addMonths, compareDays, isDayBetween, isSameDay, monthInBounds, monthTitle, monthWeeks, WEEKDAYS, type Month } from './monthCalendar.utils';

interface MonthCalendarViewProps {
  /** Names the calendar for assistive technology (Start Date, End Date). */
  label: string;
  month: Month;
  /** The range picked so far, `null` for all time. */
  range: DateRange | null;
  /** The day this calendar marks (the range's start or end): solid, while the other end is outlined. */
  side: 'start' | 'end';
  /** Days outside are disabled, and so are the arrows that only lead to them. */
  bounds: { min?: Date; max?: Date; today: Date };
  onPick: (day: Date) => void;
  onMonth: (month: Month) => void;
}

const isoDay = (day: Date) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

/** One month of v1's `v-calendar` in `DiCalendar`: arrows and title, weekdays, the range highlighted. */
export function MonthCalendarView({ label, month, range, side, bounds, onPick, onMonth }: MonthCalendarViewProps) {
  const { min, max, today } = bounds;
  const previous = addMonths(month, -1);
  const next = addMonths(month, 1);
  const dayClass = (day: Date) => {
    const classes = ['main-date-calendar__day'];
    if (range && isDayBetween(day, range.start, range.end)) classes.push('main-date-calendar__day--in-range');
    if (range && isSameDay(day, side === 'start' ? range.start : range.end)) classes.push('main-date-calendar__day--picked');
    else if (range && isSameDay(day, side === 'start' ? range.end : range.start)) classes.push('main-date-calendar__day--other-end');
    // v1 marked today on the start calendar only once a range was shown.
    if (isSameDay(day, today) && (range || side === 'end')) classes.push('main-date-calendar__day--today');
    return classes.join(' ');
  };
  const outside = (day: Date) => (min !== undefined && compareDays(day, min) < 0) || (max !== undefined && compareDays(day, max) > 0);

  return (
    <fieldset className="main-date-calendar" aria-label={label}>
      <div className="main-date-calendar__header">
        <button
          type="button"
          className="main-date-calendar__arrow"
          aria-label={`${label}: previous month`}
          disabled={!monthInBounds(previous, min, max)}
          onClick={() => onMonth(previous)}
        >
          <i className="fa fa-chevron-left" aria-hidden />
        </button>
        <span className="main-date-calendar__title">{monthTitle(month)}</span>
        <button
          type="button"
          className="main-date-calendar__arrow"
          aria-label={`${label}: next month`}
          disabled={!monthInBounds(next, min, max)}
          onClick={() => onMonth(next)}
        >
          <i className="fa fa-chevron-right" aria-hidden />
        </button>
      </div>
      <div className="main-date-calendar__grid">
        {WEEKDAYS.map((weekday, index) => (
          <span key={index} className="main-date-calendar__weekday" aria-hidden>
            {weekday}
          </span>
        ))}
        {monthWeeks(month).flatMap((week, row) =>
          week.map((day, column) =>
            day ? (
              <button
                key={isoDay(day)}
                type="button"
                className={dayClass(day)}
                aria-label={`${label} ${isoDay(day)}`}
                aria-pressed={range ? isSameDay(day, side === 'start' ? range.start : range.end) : false}
                disabled={outside(day)}
                onClick={() => onPick(day)}
              >
                <span>{day.getDate()}</span>
              </button>
            ) : (
              <span key={`${row}-${column}`} />
            )
          )
        )}
      </div>
    </fieldset>
  );
}
