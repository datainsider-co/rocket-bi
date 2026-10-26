import { describe, expect, it } from 'vitest';
import type { TableResponse } from '@/core/query/VisualizationResponse';
import { slicerBounds, slicerKind, slicerRangeOf, slicerToControl } from './slicerFilter.utils';

const column = (fieldType: string, scalar?: string) => ({
  values: [{ function: { class_name: 'min', field: { field_type: fieldType }, ...(scalar && { scalar_function: { class_name: scalar } }) } }]
});
const table = (records: unknown[][]): TableResponse => ({ kind: 'table', headers: ['label', 'value'], records, total: records.length });

describe('slicerKind', () => {
  it.each([
    ['a number column', column('double'), 'number'],
    ['a date column', column('DateTime', 'datetime_to_millis'), 'date'],
    ['a year of a date column', column('datetime', 'to_year'), 'date_part'],
    ['a month of year of a date column', column('date', 'to_month'), 'date_part'],
    ['a numbered month of a date column', column('date', 'to_month_num'), 'date'],
    ['no column, number by default', { values: [] }, 'number'],
    ['no column, set to dates', { values: [], options: { options: { dynamic_settings: { is_number: false } } } }, 'date']
  ])('%s', (_, setting, kind) => {
    expect(slicerKind(setting)).toBe(kind);
  });
});

describe('slicerBounds', () => {
  it('reads the queried min and max', () => {
    expect(slicerBounds(table([[9.33, 668.27]]), {}, 'number')).toEqual([9.33, 668.27]);
  });

  it('falls back to the configured ends, then zero', () => {
    expect(slicerBounds(table([]), { from: { value: 1 }, to: { value: 9 } }, 'number')).toEqual([1, 9]);
    expect(slicerBounds(table([]), {}, 'number')).toEqual([0, 0]);
    expect(slicerBounds(table([]), { from: { value: 5 } }, 'number')).toEqual([5, 5]);
  });
});

describe('slicerRangeOf', () => {
  const bounds = [0, 100] as const;

  it('reads numbers and dates from the control', () => {
    expect(slicerRangeOf({ min_value: ['10'], max_value: ['20'] }, bounds, 'number')).toEqual([10, 20]);
    const [from] = slicerRangeOf({ min_value: ['2020-01-02 00:00:00'], max_value: ['2020-02-01 23:59:59'] }, bounds, 'date');
    expect(new Date(from).getDate()).toBe(2);
  });

  it('uses the bounds for missing or bad values and orders the ends', () => {
    expect(slicerRangeOf(undefined, bounds, 'number')).toEqual([0, 100]);
    expect(slicerRangeOf({ min_value: ['x'] }, bounds, 'number')).toEqual([0, 100]);
    expect(slicerRangeOf({ min_value: ['80'], max_value: ['20'] }, bounds, 'number')).toEqual([20, 80]);
  });
});

describe('slicerToControl', () => {
  it('clears a range covering everything', () => {
    expect(slicerToControl([0, 100], [0, 100], 'number')).toEqual({});
  });

  it('sends numbers as they are and dates as whole days', () => {
    expect(slicerToControl([10, 100], [0, 100], 'number')).toEqual({ min_value: ['10'], max_value: ['100'] });
    const start = new Date(2020, 0, 2, 13).getTime();
    expect(slicerToControl([start, start], [0, Number.MAX_SAFE_INTEGER], 'date')).toEqual({
      min_value: ['2020-01-02 00:00:00'],
      max_value: ['2020-01-02 23:59:59']
    });
  });
});
