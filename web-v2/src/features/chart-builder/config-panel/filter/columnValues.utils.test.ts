import { describe, expect, it } from 'vitest';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { columnValuesSetting, nextValuesFrom, shownValues, sqlViewsOf, valuesPageOf, type ValuesPage } from './columnValues.utils';

const field = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'country', field_type: 'string' };
const viewField = { class_name: 'view_field', view_name: 'adhoc_1', field_name: 'country', field_type: 'string' };

describe('sqlViewsOf', () => {
  it("gives a view field's view with its SQL", () => {
    expect(sqlViewsOf(viewField, name => (name === 'adhoc_1' ? 'select 1' : undefined))).toEqual([
      { class_name: 'sql_view', alias_name: 'adhoc_1', query: { class_name: 'sql_query', query: 'select 1' } }
    ]);
  });

  it('gives nothing for a table field or an unknown view', () => {
    expect(sqlViewsOf(field, () => 'select 1')).toEqual([]);
    expect(sqlViewsOf(viewField, () => undefined)).toEqual([]);
    expect(sqlViewsOf(viewField)).toEqual([]);
  });
});

describe('columnValuesSetting', () => {
  it('selects the distinct values in order, the query the local backend answers', () => {
    const setting = columnValuesSetting(field, false, []);
    const func = { class_name: 'select_distinct', field };
    expect(setting).toEqual({
      class_name: 'table_chart_setting',
      columns: [{ name: 'country', function: func, is_horizontal_view: false, is_collapse: false, is_calc_group_total: true, is_calc_min_max: false, is_dynamic_function: false }],
      sorts: [{ class_name: 'order_by', function: func, order: 'ASC' }],
      filters: [],
      formatters: [],
      sql_views: [],
      options: {}
    });
  });

  it('reads the first element of a nested column and keeps the views', () => {
    const views = [{ class_name: 'sql_view' }];
    const setting = columnValuesSetting(field, true, views);
    expect(setting['sorts']).toEqual([{ class_name: 'order_by', function: { class_name: 'select_distinct', field, scalar_function: { class_name: 'get_array_element', index: 1 } }, order: 'ASC' }]);
    expect(setting['sql_views']).toBe(views);
  });
});

describe('valuesPageOf', () => {
  it('reads the json table the local backend answers, leaving out empty values', () => {
    const response = visualizationResponseFromJson({
      class_name: 'json_table_response',
      headers: [{ key: '0', label: 'country', is_group_by: false, is_text_left: true, formatter_key: '' }],
      records: [{ '0': 'Afghanistan' }, { '0': null }, { '0': '' }, { '0': 42 }],
      total: 117
    });
    expect(valuesPageOf(response)).toEqual({ values: ['Afghanistan', '42'], rows: 4, total: 117 });
  });

  it('reads a table of rows', () => {
    const response = visualizationResponseFromJson({ class_name: 'viz_table_response', headers: ['country'], records: [['Albania']], total: 1 });
    expect(valuesPageOf(response)).toEqual({ values: ['Albania'], rows: 1, total: 1 });
  });

  it('reads nothing from another response', () => {
    expect(valuesPageOf(visualizationResponseFromJson({ class_name: 'series_one_response', series: [], x_axis: [] }))).toEqual({ values: [], rows: 0, total: 0 });
  });
});

describe('nextValuesFrom', () => {
  const page = (rows: number, total: number): ValuesPage => ({ values: [], rows, total });

  it('starts the next page after the loaded rows', () => {
    expect(nextValuesFrom([page(80, 200), page(80, 200)])).toBe(160);
  });

  it('stops once every row is loaded or a page is empty', () => {
    expect(nextValuesFrom([page(80, 100), page(20, 100)])).toBeUndefined();
    expect(nextValuesFrom([page(80, 200), page(0, 200)])).toBeUndefined();
    expect(nextValuesFrom([])).toBeUndefined();
  });
});

describe('shownValues', () => {
  it('puts picked values not loaded yet first, each value once', () => {
    expect(shownValues(['a', 'b'], ['z', 'a', 'z'])).toEqual(['z', 'a', 'b']);
  });

  it('shows the loaded values alone when nothing is picked', () => {
    expect(shownValues(['a'], [])).toEqual(['a']);
  });
});
