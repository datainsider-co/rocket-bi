import { describe, expect, it } from 'vitest';
import { drillColumnOf, drilldownConditions, drilldownSetting, drillFunction, isDrilldownable, isDrilledField } from './drilldown';
import { applyTableSort } from './tableSort';
import { applyZoom, canZoom, zoomLevelOf } from './zoom';

const orderDate = { class_name: 'table_field', db_name: 'db', tbl_name: 'sales', field_name: 'order_date', field_type: 'datetime' };
const region = { class_name: 'table_field', db_name: 'db', tbl_name: 'sales', field_name: 'region', field_type: 'string' };
const byYear = {
  class_name: 'series_chart_setting',
  x_axis: { name: 'Year', function: { class_name: 'group', field: orderDate, scalar_function: { class_name: 'to_year', result_type: 'int32' } } },
  sorts: [{ class_name: 'order_by', function: { class_name: 'group', field: orderDate, scalar_function: { class_name: 'to_year' } } }],
  options: { options: { is_enable_zoom: true } }
};
const byRegion = {
  class_name: 'series_chart_setting',
  x_axis: { name: 'region', function: { class_name: 'group', field: region } },
  filters: [{ class_name: 'and', conditions: [{ class_name: 'dynamic_condition' }] }]
};

describe('zoom', () => {
  it('reads the level and needs zoom enabled', () => {
    expect(zoomLevelOf(byYear)).toBe('to_year');
    expect(canZoom(byYear)).toBe(true);
    expect(canZoom({ ...byYear, options: {} })).toBe(false);
    expect(zoomLevelOf(byRegion)).toBeUndefined();
    expect(zoomLevelOf({ class_name: 'table_chart_setting' })).toBeUndefined();
  });

  it('switches the date function of the column and its sorts', () => {
    const zoomed = applyZoom(byYear, 'to_month');
    expect(zoomed['x_axis']).toEqual({ ...byYear.x_axis, function: { ...byYear.x_axis.function, scalar_function: { class_name: 'to_month' } } });
    expect(zoomed['sorts']).toEqual([{ ...byYear.sorts[0], function: { ...byYear.sorts[0]!.function, scalar_function: { class_name: 'to_month' } } }]);
    expect(applyZoom(byRegion, 'to_month')).toBe(byRegion);
  });
});

describe('drilldown', () => {
  const step = { value: 'Asia', name: 'country', to: drillFunction({ ...region, field_name: 'country' }) };

  it('drills charts with a dimension', () => {
    expect(isDrilldownable(byRegion)).toBe(true);
    expect(drillColumnOf({ class_name: 'pie_chart_setting', legend: byRegion.x_axis })).toBe(byRegion.x_axis);
    expect(isDrilldownable({ class_name: 'number_chart_setting' })).toBe(false);
    expect(drilldownSetting({ class_name: 'number_chart_setting' }, step)).toBeUndefined();
  });

  it('replaces the dimension and filters on the value', () => {
    expect(drilldownSetting(byRegion, step)).toEqual({
      ...byRegion,
      x_axis: { name: 'country', function: { class_name: 'group', field: { ...region, field_name: 'country' } } },
      filters: [{ class_name: 'and', conditions: [{ class_name: 'dynamic_condition' }, { class_name: 'equal', field: region, value: 'Asia' }] }]
    });
  });

  it('builds date functions', () => {
    expect(drillFunction(orderDate, 'to_year')).toEqual({ class_name: 'group', field: orderDate, scalar_function: { class_name: 'to_year' } });
  });

  it('adds the value next to the stored filters', () => {
    const equal = { class_name: 'equal' };
    expect(drilldownConditions([], equal)).toEqual([{ class_name: 'and', conditions: [equal] }]);
    expect(drilldownConditions([{ class_name: 'or', conditions: [] }], equal)).toEqual([
      { class_name: 'and', conditions: [{ class_name: 'or', conditions: [{ class_name: 'or', conditions: [] }] }, equal] }
    ]);
  });

  it('knows the fields already used', () => {
    const drilled = drilldownSetting(byRegion, step)!;
    expect(isDrilledField(drilled, { ...region, field_type: 'String' })).toBe(true);
    expect(isDrilledField(drilled, { ...region, field_name: 'country' })).toBe(true);
    expect(isDrilledField(drilled, orderDate)).toBe(false);
  });
});

describe('applyTableSort', () => {
  const table = { columns: [{ name: 'region', function: { class_name: 'select', field: region } }], sorts: [{ order: 'ASC' }] };

  it('sorts by the column with that name only', () => {
    expect(applyTableSort(table, { column: 'region', direction: 'DESC' })['sorts']).toEqual([
      { class_name: 'order_by', function: table.columns[0]!.function, order: 'DESC' }
    ]);
  });

  it('keeps the stored sorts without a match or a sort', () => {
    expect(applyTableSort(table, { column: 'nope', direction: 'ASC' })).toBe(table);
    expect(applyTableSort(table, undefined)).toBe(table);
  });
});
