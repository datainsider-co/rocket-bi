import { describe, expect, it } from 'vitest';
import { DateMode } from '@/core/query/dateRanges';
import { fromMainDate, kpiDateRangeLabel, kpiDateRangeOf, toMainDate } from './kpiDateRange.utils';

const local = (year: number, month: number, date: number) => new Date(year, month - 1, date);
const now = local(2026, 10, 28);
const field = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'order_date', field_type: 'datetime' };
const kpi = (dataRange: object) => ({ class_name: 'number_chart_setting', options: { options: { data_range: dataRange } } });

describe('kpiDateRangeOf', () => {
  it('reads the mode and the dates of the range', () => {
    const range = { start: local(2026, 1, 1).toISOString(), end: local(2026, 1, 31).toISOString() };
    expect(kpiDateRangeOf(kpi({ enabled: true, mode: 'custom', date_field: field, date_range: range }))).toEqual({
      mode: DateMode.Custom,
      range: [local(2026, 1, 1), local(2026, 1, 31)]
    });
    expect(kpiDateRangeOf(kpi({ enabled: true, mode: 'this_year', date_field: field }))).toEqual({ mode: DateMode.ThisYear });
  });

  it('reads nothing without a date range', () => {
    expect(kpiDateRangeOf(kpi({ enabled: false, mode: 'this_year', date_field: field }))).toBeUndefined();
    expect(kpiDateRangeOf({})).toBeUndefined();
  });
});

describe('kpiDateRangeLabel', () => {
  it.each([
    [DateMode.ThisMonth, 'Oct 1, 2026 - Oct 28, 2026'],
    [DateMode.LastYear, 'Jan 1, 2025 - Dec 31, 2025'],
    [DateMode.Last7Days, 'Oct 21, 2026 - Oct 27, 2026'],
    [DateMode.AllTime, 'All Time']
  ])('shows %s as of today', (mode, label) => {
    expect(kpiDateRangeLabel({ mode }, now)).toBe(label);
  });

  it("shows a custom range's dates, All Time without them", () => {
    expect(kpiDateRangeLabel({ mode: DateMode.Custom, range: [local(2026, 2, 3), local(2026, 3, 4)] }, now)).toBe('Feb 3, 2026 - Mar 4, 2026');
    expect(kpiDateRangeLabel({ mode: DateMode.Custom }, now)).toBe('All Time');
  });
});

describe('toMainDate / fromMainDate', () => {
  it('round trips a custom range through its day strings', () => {
    const choice = { mode: DateMode.Custom, range: [local(2026, 2, 3), local(2026, 3, 4)] as const };
    const mainDate = toMainDate(choice);
    expect(mainDate).toEqual({ mode: DateMode.Custom, dates: ['2026-02-03 00:00:00', '2026-03-04 23:59:59'] });
    expect(fromMainDate(mainDate)).toEqual(choice);
  });

  it('keeps a relative mode without dates', () => {
    expect(toMainDate({ mode: DateMode.LastWeek, range: [now, now] })).toEqual({ mode: DateMode.LastWeek, dates: [] });
    expect(fromMainDate({ mode: DateMode.LastWeek, dates: ['2026-01-01 00:00:00', '2026-01-02 23:59:59'] })).toEqual({ mode: DateMode.LastWeek });
  });

  it('takes a custom range without its dates as all time', () => {
    expect(toMainDate({ mode: DateMode.Custom })).toEqual({ mode: DateMode.Custom, dates: [] });
    expect(fromMainDate({ mode: DateMode.Custom, dates: [] })).toEqual({ mode: DateMode.AllTime });
  });
});
