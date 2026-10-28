import { describe, expect, it } from 'vitest';
import { getPath } from '@/core/json/json';
import { DateMode } from '@/core/query/dateRanges';
import { drillFunction } from '@/core/query/drilldown';
import { databaseSchemaFromJson } from '@/core/schema/SchemaService';
import fixture from '@/core/schema/database.fixture.json';
import { DRILL_DATE_LEVELS, INITIAL_VIEW, chartViewReducer, drillFields, exportFileName, viewedSetting, type ChartView } from './chartView.utils';

const field = (name: string, type = 'string') => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: name, field_type: type });
const stored = {
  class_name: 'series_chart_setting',
  x_axis: { name: 'Year', function: { class_name: 'group', field: field('order_date', 'datetime'), scalar_function: { class_name: 'to_year' } } },
  columns: [],
  filters: []
};
const toRegion = { value: '2015', name: 'region', to: drillFunction(field('region')) };

describe('chart view', () => {
  it('shows the stored setting at first', () => {
    expect(viewedSetting(stored, INITIAL_VIEW)).toBe(stored);
  });

  it('drills from what is on screen and forgets the date function', () => {
    const zoomed = chartViewReducer(INITIAL_VIEW, { type: 'zoom', level: 'to_month' });
    expect(viewedSetting(stored, zoomed)['x_axis']).toMatchObject({ function: { scalar_function: { class_name: 'to_month' } } });

    const drilled = chartViewReducer(zoomed, { type: 'drill', stored, step: toRegion });
    expect(drilled.zoom).toBeUndefined();
    expect(viewedSetting(stored, drilled)['x_axis']).toEqual({ name: 'region', function: toRegion.to });
    // The clicked value is a month now.
    expect(JSON.stringify(viewedSetting(stored, drilled)['filters'])).toContain('to_month');
  });

  it('goes back to a step, or to the stored setting', () => {
    const twice = [toRegion, { ...toRegion, value: 'Asia', name: 'country' }].reduce<ChartView>(
      (view, step) => chartViewReducer(view, { type: 'drill', stored, step }),
      INITIAL_VIEW
    );
    expect(twice.drills).toHaveLength(2);
    expect(chartViewReducer(twice, { type: 'back', index: 1 }).drills).toHaveLength(1);
    expect(viewedSetting(stored, chartViewReducer(twice, { type: 'reset' }))).toBe(stored);
  });

  it('ignores a drill the chart cannot do', () => {
    const table = { class_name: 'table_chart_setting' };
    expect(chartViewReducer(INITIAL_VIEW, { type: 'drill', stored: table, step: toRegion })).toBe(INITIAL_VIEW);
  });

  it('sorts on top of the rest', () => {
    const table = { class_name: 'table_chart_setting', columns: [{ name: 'region', function: { field: field('region') } }] };
    const sorted = chartViewReducer(INITIAL_VIEW, { type: 'sort', sort: { column: 'region', direction: 'ASC' } });
    expect(viewedSetting(table, sorted)['sorts']).toEqual([{ class_name: 'order_by', function: table.columns[0]!.function, order: 'ASC' }]);
    expect(viewedSetting(table, chartViewReducer(sorted, { type: 'sort' }))).toBe(table);
  });

  it('keeps the filter toggle through Reset drill down', () => {
    const off = chartViewReducer(INITIAL_VIEW, { type: 'filters', on: false });
    expect(off.filtersOn).toBe(false);
    expect(chartViewReducer(off, { type: 'reset' }).filtersOn).toBe(false);
    expect(viewedSetting(stored, off)).toBe(stored);
  });

  it('queries a number chart with the date range picked on the card, through Reset drill down', () => {
    const kpi = {
      class_name: 'number_chart_setting',
      options: { options: { data_range: { enabled: true, mode: 'this_year', date_field: field('order_date', 'datetime') } } }
    };
    const picked = chartViewReducer(INITIAL_VIEW, { type: 'dateRange', choice: { mode: DateMode.LastMonth } });
    expect(getPath(viewedSetting(kpi, picked), ['options', 'options', 'data_range', 'mode'])).toBe('last_month');
    expect(chartViewReducer(picked, { type: 'reset' }).dateRange).toEqual({ mode: DateMode.LastMonth });
    expect(viewedSetting(stored, picked)).toBe(stored);
  });
});

describe('drillFields', () => {
  const schema = databaseSchemaFromJson(fixture);

  it('offers the text and date columns not used yet', () => {
    const fields = drillFields(schema, stored, stored.x_axis);
    expect(fields.map(item => item.label)).toEqual(['region', 'country', 'item_type', 'sales_channel', 'order_priority', 'ship_date']);
    expect(fields.at(-1)).toMatchObject({ isDate: true, field: field('ship_date', 'datetime') });
  });

  it('has none without the schema or the table', () => {
    expect(drillFields(undefined, stored, stored.x_axis)).toEqual([]);
    expect(drillFields(schema, stored, undefined)).toEqual([]);
  });

  it('drills dates by date parts, not epochs', () => {
    expect(DRILL_DATE_LEVELS.map(item => item.level)).not.toContain('datetime_to_millis');
    expect(DRILL_DATE_LEVELS[0]).toEqual({ level: 'to_year', label: 'Year' });
  });
});

describe('exportFileName', () => {
  it.each([
    ['Revenue by country', 'revenue_by_country'],
    ['Doanh thu theo tháng Đà Nẵng', 'doanh_thu_theo_thang_da_nang'],
    ['', 'untitled'],
    ['!!!', 'untitled']
  ])('%s', (name, expected) => {
    expect(exportFileName(name)).toBe(expected);
  });
});
