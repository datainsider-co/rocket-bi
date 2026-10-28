import { describe, expect, it } from 'vitest';
import { getPath, type JsonObject } from '@/core/json/json';
import {
  CompareMode,
  compareRangeOf,
  compareRequestOf,
  dateRangeCondition,
  dateRangeFilterRequests,
  isNestedField,
  numberComparisonOf,
  trendLineSettingOf,
  withDateRange
} from './comparison';
import { DateMode } from './dateRanges';

const field = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'order_date', field_type: 'datetime' };
const value = { name: 'total_profit', function: { class_name: 'sum', field: { field_name: 'total_profit' } } };
const filter = { class_name: 'in', field: { field_name: 'item_type' }, possible_values: ['Cosmetics'] };
const local = (year: number, month: number, date: number) => new Date(year, month - 1, date);
const iso = (year: number, month: number, date: number) => local(year, month, date).toISOString();

function kpi(options: JsonObject): JsonObject {
  return { class_name: 'number_chart_setting', value, filters: [filter], options: { class_name: 'number_chart_setting', options } };
}

const dataRange = (mode: string, extra: JsonObject = {}) => ({ enabled: true, mode, date_field: field, ...extra });
const customRange = { start: iso(2026, 1, 1), end: iso(2026, 1, 31) };

describe('numberComparisonOf', () => {
  it('reads nothing without a date range', () => {
    expect(numberComparisonOf(kpi({ data_range: { enabled: false }, comparison: { enabled: true } }))).toBeUndefined();
    expect(numberComparisonOf(kpi({ data_range: { enabled: true } }))).toBeUndefined();
    expect(numberComparisonOf({})).toBeUndefined();
  });

  it('reads the range, the comparison and the trend line', () => {
    const setting = kpi({
      data_range: dataRange('custom', { date_range: customRange }),
      comparison: { enabled: true, mode: 'same_period_last_year' },
      trend_line: { enabled: true, trend_by: 'Day of', display_as: 'area', color: '#fff', color_by_percentage: true }
    });
    expect(numberComparisonOf(setting)).toEqual({
      field,
      mode: DateMode.Custom,
      range: [local(2026, 1, 1), local(2026, 1, 31)],
      compare: { mode: CompareMode.SamePeriodLastYear, range: undefined },
      trend: { trendBy: 'Day of', displayAs: 'area', color: '#fff', colorByPercentage: true }
    });
  });

  it('fills what is missing like v1', () => {
    const comparison = numberComparisonOf(kpi({ data_range: { enabled: true, date_field: field, date_range: { start: 'x' } }, comparison: { enabled: true }, trend_line: { enabled: true } }));
    expect(comparison).toMatchObject({ mode: DateMode.Custom, range: undefined, compare: { mode: CompareMode.PreviousPeriod }, trend: { trendBy: 'Month of', displayAs: 'line', color: '#007126' } });
  });
});

describe('dateRangeCondition', () => {
  it.each([
    [DateMode.ThisYear, { class_name: 'current_year' }],
    [DateMode.LastWeek, { class_name: 'last_n_week', n_week: '1' }],
    [DateMode.Last30Days, { class_name: 'last_n_day', n_day: '30' }]
  ])('lets the server compute %s', (mode, condition) => {
    expect(dateRangeCondition({ field, mode })).toEqual({ ...condition, field });
  });

  it('filters a custom range by its dates', () => {
    expect(dateRangeCondition({ field, mode: DateMode.Custom, range: [local(2026, 1, 1), local(2026, 1, 31)] })).toEqual({
      class_name: 'between_and_including',
      field,
      min: '2026-01-01 00:00:00',
      max: '2026-01-31 23:59:59'
    });
  });

  it('has none for all time or a custom range without dates', () => {
    expect(dateRangeCondition({ field, mode: DateMode.AllTime })).toBeUndefined();
    expect(dateRangeCondition({ field, mode: DateMode.Custom })).toBeUndefined();
  });
});

describe('compareRangeOf', () => {
  const range = [local(2026, 1, 10), local(2026, 1, 19)] as const;

  it('takes the same number of days before the range', () => {
    expect(compareRangeOf(CompareMode.PreviousPeriod, range)).toEqual([local(2025, 12, 31), local(2026, 1, 9)]);
  });

  it.each([
    [CompareMode.SamePeriodLastMonth, [local(2025, 12, 10), local(2025, 12, 19)]],
    [CompareMode.SamePeriodLastQuarter, [local(2025, 10, 10), local(2025, 10, 19)]],
    [CompareMode.SamePeriodLastYear, [local(2025, 1, 10), local(2025, 1, 19)]]
  ])('moves %s back', (mode, expected) => {
    expect(compareRangeOf(mode, range)).toEqual(expected);
  });

  it('has none for a custom comparison', () => {
    expect(compareRangeOf(CompareMode.Custom, range)).toBeUndefined();
  });
});

describe('compareRequestOf', () => {
  it('has none without a comparison', () => {
    expect(compareRequestOf(kpi({ data_range: dataRange('last_30_days') }))).toBeUndefined();
  });

  it('compares a relative range with the same one moved back by its length', () => {
    expect(compareRequestOf(kpi({ data_range: dataRange('last_30_days'), comparison: { enabled: true, mode: 'previous_period' } }))).toEqual({
      mode: 'RawValues',
      first_condition: { class_name: 'last_n_day', n_day: '30', field },
      second_condition: { class_name: 'last_n_day', n_day: '30', field, interval_function: { class_name: 'past_n_day', n_day: 30 } }
    });
  });

  it.each([
    ['this_week', 'previous_period', { class_name: 'past_n_week', n_week: 1 }],
    ['this_month', 'same_period_last_year', { class_name: 'past_n_year', n_year: 1 }],
    ['last_quarter', 'previous_period', { class_name: 'past_n_quarter', n_quarter: 1 }],
    ['this_day', 'same_period_last_month', { class_name: 'past_n_month', n_month: 1 }]
  ])('moves %s back for %s', (mode, compareMode, interval) => {
    const request = compareRequestOf(kpi({ data_range: dataRange(mode), comparison: { enabled: true, mode: compareMode } }));
    expect(request?.['second_condition']).toMatchObject({ interval_function: interval });
  });

  it('compares a custom range with the computed period', () => {
    const request = compareRequestOf(kpi({ data_range: dataRange('custom', { date_range: customRange }), comparison: { enabled: true, mode: 'same_period_last_month' } }));
    expect(request?.['second_condition']).toEqual({ class_name: 'between_and_including', field, min: '2025-12-01 00:00:00', max: '2025-12-31 23:59:59' });
  });

  it("compares with a custom comparison's own range", () => {
    const request = compareRequestOf(
      kpi({ data_range: dataRange('this_year'), comparison: { enabled: true, mode: 'custom', date_range: { start: iso(2024, 3, 1), end: iso(2024, 3, 2) } } })
    );
    expect(request?.['second_condition']).toMatchObject({ min: '2024-03-01 00:00:00', max: '2024-03-02 23:59:59' });
  });

  it('compares all time with nothing', () => {
    expect(compareRequestOf(kpi({ data_range: dataRange('all_time'), comparison: { enabled: true, mode: 'previous_period' } }))).toEqual({ mode: 'RawValues' });
  });
});

describe('dateRangeFilterRequests', () => {
  it('filters by the range without a comparison', () => {
    expect(dateRangeFilterRequests(kpi({ data_range: dataRange('this_month') }))).toEqual([
      { filter_id: -1, condition: { class_name: 'current_month', field }, is_apply_relatively: true, is_active: true }
    ]);
  });

  it('leaves the range to the comparison', () => {
    expect(dateRangeFilterRequests(kpi({ data_range: dataRange('this_month'), comparison: { enabled: true } }))).toEqual([]);
  });

  it('filters nothing for all time or without a range', () => {
    expect(dateRangeFilterRequests(kpi({ data_range: dataRange('all_time') }))).toEqual([]);
    expect(dateRangeFilterRequests(kpi({}))).toEqual([]);
  });
});

describe('trendLineSettingOf', () => {
  it("queries the value over time in the range, keeping the chart's filters", () => {
    const setting = trendLineSettingOf(kpi({ data_range: dataRange('this_year'), trend_line: { enabled: true, trend_by: 'Day of' } }));
    const xFunction = { class_name: 'group', field, scalar_function: { class_name: 'to_day_num' } };
    expect(setting).toEqual({
      class_name: 'series_chart_setting',
      x_axis: { name: 'order_date', function: xFunction },
      y_axis: [value],
      filters: [{ class_name: 'and', conditions: [filter, { class_name: 'current_year', field }] }],
      sorts: [{ class_name: 'order_by', function: xFunction, order: 'ASC' }],
      options: {}
    });
  });

  it('keeps every OR group of the chart in the range', () => {
    const other = { ...filter, possible_values: ['Cereal'] };
    const range = { class_name: 'current_year', field };
    const setting = trendLineSettingOf({ ...kpi({ data_range: dataRange('this_year'), trend_line: { enabled: true } }), filters: [filter, other] });
    expect(setting?.['filters']).toEqual([
      { class_name: 'and', conditions: [filter, range] },
      { class_name: 'and', conditions: [other, range] }
    ]);
  });

  it('filters by the range alone without chart filters, and by the chart filters alone for all time', () => {
    const trendOn = { enabled: true };
    expect(trendLineSettingOf({ ...kpi({ data_range: dataRange('this_year'), trend_line: trendOn }), filters: [] })?.['filters']).toEqual([{ class_name: 'current_year', field }]);
    expect(trendLineSettingOf(kpi({ data_range: dataRange('all_time'), trend_line: trendOn }))?.['filters']).toEqual([filter]);
  });

  it('has none without a trend line or a value', () => {
    expect(trendLineSettingOf(kpi({ data_range: dataRange('this_year') }))).toBeUndefined();
    expect(trendLineSettingOf({ ...kpi({ data_range: dataRange('this_year'), trend_line: { enabled: true } }), value: undefined })).toBeUndefined();
  });
});

describe('isNestedField', () => {
  it.each([
    [{ field_name: '`orders.created_at`', tbl_name: 'sales' }, true],
    [{ field_name: 'created_at', tbl_name: 'sales.orders' }, true],
    [{ field_name: 'order_date', tbl_name: 'sales' }, false],
    [{}, false]
  ])('tells whether %o is inside a nested column', (column, nested) => {
    expect(isNestedField(column)).toBe(nested);
  });
});

describe('a date column inside a nested column', () => {
  const nestedField = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: '`orders.created_at`', field_type: 'datetime' };
  const firstElement = { class_name: 'get_array_element', index: 1 };
  const nestedRange = (mode: string, extra: JsonObject = {}) => ({ ...dataRange(mode, extra), date_field: nestedField });

  it('reads the first element in the range and the compared period', () => {
    expect(compareRequestOf(kpi({ data_range: nestedRange('this_month'), comparison: { enabled: true, mode: 'previous_period' } }))).toEqual({
      mode: 'RawValues',
      first_condition: { class_name: 'current_month', field: nestedField, scalar_function: firstElement },
      second_condition: {
        class_name: 'current_month',
        field: nestedField,
        scalar_function: firstElement,
        interval_function: { class_name: 'past_n_month', n_month: 1 }
      }
    });
  });

  it('reads the first element in custom ranges', () => {
    const request = compareRequestOf(kpi({ data_range: nestedRange('custom', { date_range: customRange }), comparison: { enabled: true, mode: 'same_period_last_month' } }));
    expect(request?.['first_condition']).toMatchObject({ class_name: 'between_and_including', scalar_function: firstElement });
    expect(request?.['second_condition']).toMatchObject({ class_name: 'between_and_including', scalar_function: firstElement });
  });

  it('reads the first element in the date filter', () => {
    expect(dateRangeFilterRequests(kpi({ data_range: nestedRange('last_7_days') }))[0]?.condition).toEqual({
      class_name: 'last_n_day',
      n_day: '7',
      field: nestedField,
      scalar_function: firstElement
    });
  });

  it('reads the first element under the trend line date function and in its filter', () => {
    const setting = trendLineSettingOf(kpi({ data_range: nestedRange('this_year'), trend_line: { enabled: true, trend_by: 'Month of' } }));
    const xFunction = { class_name: 'group', field: nestedField, scalar_function: { class_name: 'to_month_num', inner_fn: firstElement } };
    expect(setting).toMatchObject({
      x_axis: { name: '`orders.created_at`', function: xFunction },
      filters: [{ class_name: 'and', conditions: [filter, { class_name: 'current_year', field: nestedField, scalar_function: firstElement }] }],
      sorts: [{ class_name: 'order_by', function: xFunction, order: 'ASC' }]
    });
  });
});

describe('withDateRange', () => {
  it('puts a relative mode in place of the stored one, keeping the stored dates', () => {
    const setting = kpi({ data_range: dataRange('custom', { date_range: customRange }), precision: 2 });
    const viewed = withDateRange(setting, { mode: DateMode.LastMonth });
    expect(getPath(viewed, ['options', 'options', 'data_range'])).toEqual(dataRange('last_month', { date_range: customRange }));
    expect(getPath(viewed, ['options', 'options', 'precision'])).toBe(2);
    expect(dateRangeFilterRequests(viewed)[0]?.condition).toEqual({ class_name: 'last_n_month', n_month: '1', field });
  });

  it('puts a custom range with its dates', () => {
    const viewed = withDateRange(kpi({ data_range: dataRange('this_year') }), { mode: DateMode.Custom, range: [local(2026, 2, 1), local(2026, 2, 28)] });
    expect(dateRangeFilterRequests(viewed)[0]?.condition).toMatchObject({ min: '2026-02-01 00:00:00', max: '2026-02-28 23:59:59' });
  });

  it('leaves a chart without a date range, and the stored setting, as they are', () => {
    const off = kpi({ data_range: { enabled: false } });
    expect(withDateRange(off, { mode: DateMode.ThisYear })).toBe(off);
    const setting = kpi({ data_range: dataRange('this_year') });
    withDateRange(setting, { mode: DateMode.AllTime });
    expect(getPath(setting, ['options', 'options', 'data_range', 'mode'])).toBe('this_year');
  });
});
