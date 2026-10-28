import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import type { VizOptions } from '@/core/query/vizOptions';
import type { TableNode } from '../../field-tree/fieldTree.utils';
import {
  compareModeChanges,
  compareModeOf,
  comparisonRevert,
  comparisonToggle,
  dataRangeToggle,
  dateFieldChoicesOf,
  dateFieldKeyOf,
  dateModeOf,
  dateRangeModeChanges,
  fieldKeyOf,
  rangeAt,
  storedRange
} from './comparisonTab.utils';

const local = (year: number, month: number, date: number) => new Date(year, month - 1, date);
const now = local(2026, 10, 28);
const orderDate = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'order_date', field_type: 'datetime' };
const shipDate = { ...orderDate, field_name: 'ship_date' };
const nestedDate = { ...orderDate, field_name: '`orders.created`' };

const field = (title: string, type: string, json: JsonObject, role: 'column' | 'measure' = 'column') => ({
  kind: 'field' as const,
  key: title,
  title,
  type,
  role,
  dropped: { field: json, columnName: title, tableName: 'Sales' }
});

const tables: TableNode[] = [
  {
    key: 'sales',
    title: 'Sales',
    items: [
      field('Order Date', 'datetime', orderDate),
      field('Region', 'string', { ...orderDate, field_name: 'region' }),
      field('Ship Date', 'date', shipDate),
      field('Date measure', 'datetime', orderDate, 'measure'),
      {
        kind: 'nested',
        key: 'n',
        title: 'Orders',
        fields: [field('Created', 'date', nestedDate), field('Name', 'string', { ...nestedDate, field_name: '`orders.name`' })]
      }
    ]
  }
];

const viz = (options: object) => options as VizOptions;
const iso = (year: number, month: number, date: number) => local(year, month, date).toISOString();

describe('fieldKeyOf', () => {
  it('keys stored and read fields alike', () => {
    expect(fieldKeyOf(orderDate)).toBe('sample_v2.sales.order_date');
    expect(fieldKeyOf({ dbName: 'sample_v2', tblName: 'sales', fieldName: 'order_date' })).toBe('sample_v2.sales.order_date');
    expect(fieldKeyOf(undefined)).toBe('');
  });
});

describe('dateFieldKeyOf', () => {
  it("keys the range's stored column", () => {
    expect(dateFieldKeyOf(viz({ dataRange: { dateField: { dbName: 'd', tblName: 't', fieldName: 'f' } } }))).toBe('d.t.f');
    expect(dateFieldKeyOf(viz({}))).toBe('');
  });
});

describe('dateFieldChoicesOf', () => {
  it("offers the tables' date columns, those inside nested columns under them", () => {
    expect(dateFieldChoicesOf(tables)).toEqual([
      { label: 'Sales.Order Date', value: 'sample_v2.sales.order_date', field: orderDate },
      { label: 'Sales.Ship Date', value: 'sample_v2.sales.ship_date', field: shipDate },
      { label: 'Sales.Orders.Created', value: 'sample_v2.sales.`orders.created`', field: nestedDate }
    ]);
  });

  it('offers nothing without tables', () => {
    expect(dateFieldChoicesOf([])).toEqual([]);
  });
});

describe('storedRange / rangeAt', () => {
  it('saves and reads ranges as ISO strings', () => {
    const range = [local(2026, 1, 1), local(2026, 1, 31)] as const;
    expect(rangeAt(viz({ dataRange: { dateRange: storedRange(range) } }), 'dataRange.dateRange')).toEqual(range);
    expect(rangeAt(viz({ dataRange: { dateRange: { start: 'x', end: 'y' } } }), 'dataRange.dateRange')).toBeUndefined();
    expect(rangeAt(viz({}), 'dataRange.dateRange')).toBeUndefined();
  });
});

describe('dateModeOf / compareModeOf', () => {
  it("reads the modes, v1's defaults otherwise", () => {
    expect(dateModeOf(viz({ dataRange: { mode: 'this_year' } }))).toBe('this_year');
    expect(dateModeOf(viz({}))).toBe('last_30_days');
    expect(compareModeOf(viz({ comparison: { mode: 'previous_period' } }))).toBe('previous_period');
    expect(compareModeOf(viz({ comparison: { mode: 'x' } }))).toBe('same_period_last_month');
  });
});

describe('dateRangeModeChanges', () => {
  it("saves a preset's range as of now, and the preset comparison's", () => {
    expect(dateRangeModeChanges(viz({}), 'last_month', now)).toEqual({
      'dataRange.mode': 'last_month',
      'dataRange.dateRange': { start: iso(2026, 9, 1), end: iso(2026, 9, 30) },
      'comparison.dateRange': { start: iso(2026, 8, 1), end: iso(2026, 8, 30) }
    });
  });

  it('keeps a custom comparison', () => {
    const changes = dateRangeModeChanges(viz({ comparison: { mode: 'custom' } }), 'custom', now, [local(2026, 1, 1), local(2026, 1, 2)]);
    expect(changes).toEqual({ 'dataRange.mode': 'custom', 'dataRange.dateRange': { start: iso(2026, 1, 1), end: iso(2026, 1, 2) } });
  });

  it('saves no range for all time', () => {
    expect(dateRangeModeChanges(viz({}), 'all_time', now)).toEqual({ 'dataRange.mode': 'all_time' });
  });
});

describe('dataRangeToggle', () => {
  const choices = dateFieldChoicesOf(tables);

  it('starts on the first date column, the last 30 days', () => {
    expect(dataRangeToggle(viz({}), true, choices, now)).toMatchObject({
      'dataRange.enabled': true,
      'dataRange.dateField': orderDate,
      'dataRange.mode': 'last_30_days',
      'dataRange.dateRange': { start: iso(2026, 9, 28), end: iso(2026, 10, 27) }
    });
  });

  it('keeps the stored column', () => {
    const stored = viz({ dataRange: { dateField: { dbName: 'sample_v2', tblName: 'sales', fieldName: 'ship_date' } } });
    expect(dataRangeToggle(stored, true, choices, now)['dataRange.dateField']).toEqual(shipDate);
  });

  it('only turns it off', () => {
    expect(dataRangeToggle(viz({}), false, choices, now)).toEqual({ 'dataRange.enabled': false });
  });
});

describe('comparisonToggle / compareModeChanges', () => {
  const ranged = viz({ dataRange: { dateRange: { start: iso(2026, 1, 1), end: iso(2026, 1, 31) } } });

  it('starts as the same period last month', () => {
    expect(comparisonToggle(ranged, true)).toEqual({
      'comparison.enabled': true,
      'comparison.mode': 'same_period_last_month',
      'comparison.compareStyle': 'default',
      'comparison.dateRange': { start: iso(2025, 12, 1), end: iso(2025, 12, 31) }
    });
    expect(comparisonToggle(ranged, false)).toEqual({ 'comparison.enabled': false });
  });

  it("saves a mode with its range, a custom one's dates", () => {
    expect(compareModeChanges(ranged, 'same_period_last_year')).toMatchObject({ 'comparison.dateRange': { start: iso(2025, 1, 1) } });
    expect(compareModeChanges(ranged, 'custom', [local(2024, 5, 1), local(2024, 5, 2)])).toEqual({
      'comparison.mode': 'custom',
      'comparison.dateRange': { start: iso(2024, 5, 1), end: iso(2024, 5, 2) }
    });
  });
});

describe('comparisonRevert', () => {
  it('turns everything off', () => {
    expect(comparisonRevert()).toEqual({ 'dataRange.enabled': false, 'comparison.enabled': false, 'trendLine.enabled': false });
  });
});
