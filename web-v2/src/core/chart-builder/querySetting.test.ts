import { describe, expect, it } from 'vitest';
import { asArray, asRecord, type JsonObject } from '@/core/json/json';
import { builderDataFromJson, type BuilderData } from './BuilderData';
import { ChartType } from './chartType';
import { functionDataFromJson } from './FunctionData';
import { buildSetting, canBuildSetting } from './querySetting';
import sent from './builderRequests.fixture.json';

/** The widgets v1's builder sent (CB0), keyed by what they were made of. */
const widgets = sent as Record<string, JsonObject>;

const field = (name: string, type: string) => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: name, field_type: type });

const item = (overrides: JsonObject) =>
  functionDataFromJson({ id: 1, name: 'region', function_family: 'Group By', function_type: '', field: field('region', 'string'), sorting: 'Unsorted', is_nested: false, ...overrides });

const data = (chartType: string, configs: BuilderData['configs'], filters: BuilderData['filters'] = {}): BuilderData => ({ chartType, configs, filters });

describe('buildSetting', () => {
  it.each(Object.keys(widgets))('rebuilds the setting v1 sent for %s', key => {
    const widget = asRecord(widgets[key]);
    const setting = asRecord(widget['setting']);
    const built = buildSetting(builderDataFromJson(widget['extra_data']), { options: asRecord(setting['options']) });
    expect(built).toStrictEqual(setting);
  });

  it('is undefined until the required zones are filled', () => {
    const lineOnlyX = data(ChartType.Line, { x_axis: [item({})] });
    expect(canBuildSetting(lineOnlyX)).toBe(false);
    expect(buildSetting(lineOnlyX, { options: {} })).toBeUndefined();
  });

  it('builds the input filters without a field, like v1', () => {
    expect(buildSetting(data(ChartType.SlicerFilter, {}), { options: {} })).toMatchObject({ class_name: 'input_control_chart_setting', values: [] });
  });

  it('is undefined for a chart type v2 does not build', () => {
    expect(buildSetting(data('arearange', { columns: [item({})] }), { options: {} })).toBeUndefined();
  });

  it('builds the stacked charts as series with their breakdown, which is optional', () => {
    const x = item({});
    const y = item({ id: 2, name: 'n', field: field('units_sold', 'int32'), function_family: 'Aggregation', function_type: 'Sum' });
    const withoutBreakdown = buildSetting(data(ChartType.StackedColumn, { x_axis: [x], y_axis: [y] }), { options: {} });
    expect(withoutBreakdown).toMatchObject({ class_name: 'series_chart_setting' });
    expect(withoutBreakdown).not.toHaveProperty('breakdown');
    const breakdown = buildSetting(data(ChartType.CircularBar, { x_axis: [x], y_axis: [y], breakdown_optional: [item({ id: 3 })] }), { options: {} });
    expect(asRecord(breakdown?.['breakdown'])['name']).toBe('region');
    expect(canBuildSetting(data(ChartType.StackedBar, { x_axis: [x], breakdown_optional: [x] }))).toBe(false);
  });

  it('builds a pivot table from any one of its zones', () => {
    const rowsOnly = buildSetting(data(ChartType.PivotTable, { rows: [item({})] }), { options: {} });
    expect(rowsOnly).toMatchObject({ class_name: 'pivot_table_chart_setting', columns: [], values: [], formatters: [] });
    expect(asArray(rowsOnly?.['rows']).map(row => asRecord(row)['is_calc_group_total'])).toEqual([false]);
    expect(canBuildSetting(data(ChartType.PivotTable, { values: [item({})] }))).toBe(true);
    expect(canBuildSetting(data(ChartType.PivotTable, { sorting: [item({})] }))).toBe(false);
  });

  it('turns on min and max for every pivot value, whatever its type', () => {
    const built = buildSetting(data(ChartType.PivotTable, { values: [item({ function_family: 'Aggregation', function_type: 'Count all' })] }), { options: {} });
    expect(asArray(built?.['values']).map(value => asRecord(value)['is_calc_min_max'])).toEqual([true]);
  });

  it('adds the SQL of the ad hoc views the fields use, each once', () => {
    const viewField = { class_name: 'view_field', view_name: 'tbl_1', field_name: 'region', field_type: 'string' };
    const built = buildSetting(data(ChartType.TabFilter, { values: [item({ field: viewField }), item({ id: 2, field: viewField })] }), {
      options: {},
      sqlQueryOf: name => (name === 'tbl_1' ? 'select * from sales' : undefined)
    });
    expect(built?.['sql_views']).toEqual([{ class_name: 'sql_view', alias_name: 'tbl_1', query: { class_name: 'sql_query', query: 'select * from sales' } }]);
  });

  it('turns on min and max for number and aggregated table columns only', () => {
    const built = buildSetting(
      data(ChartType.Table, {
        columns: [item({}), item({ id: 2, name: 'n', field: field('units_sold', 'int32'), function_family: 'None' }), item({ id: 3, name: 'c', function_family: 'Aggregation', function_type: 'Count all' })]
      }),
      { options: {} }
    );
    expect(asArray(built?.['columns']).map(column => asRecord(column)['is_calc_min_max'])).toEqual([false, true, true]);
  });

  it('reads a date column as millis for the date select, keeping its own scalar function inside', () => {
    const built = buildSetting(data(ChartType.DateSelectFilter, { value: [item({ field: field('order_date', 'datetime'), function_family: 'Date histogram', function_type: 'Year' })] }), {
      options: {}
    });
    expect(asArray(built?.['values']).map(column => asRecord(column)['function'])).toEqual([
      { class_name: 'min', field: field('order_date', 'datetime'), scalar_function: { class_name: 'datetime_to_millis', inner_fn: { class_name: 'to_year' } } },
      { class_name: 'max', field: field('order_date', 'datetime'), scalar_function: { class_name: 'datetime_to_millis', inner_fn: { class_name: 'to_year' } } }
    ]);
  });
});
