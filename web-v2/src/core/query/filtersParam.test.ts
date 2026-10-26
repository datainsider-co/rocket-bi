import { describe, expect, it } from 'vitest';
import { filterFromParam, filterToParam, parseFiltersParam, toFiltersParam } from './filtersParam';
import { FilterCondition, type InternalFilter } from './internalFilter';

/** What v1's drill through put in the URL (`JSON.stringify` of an `InternalFilter`). */
const v1Filter = {
  className: 'dynamic_filter',
  id: 1234,
  name: 'Region',
  currentValues: ['Asia'],
  currentOptionSelected: 'in',
  isEnable: true,
  isNested: false,
  filterModeSelected: 'selection',
  field: { className: 'table_field', dbName: 'sample_v2', tblName: 'sales', fieldName: 'region', fieldType: 'string' },
  currentInputType: 'multi_select',
  description: '',
  isHidden: false,
  controlId: null
};

const region: InternalFilter = {
  id: -1,
  name: 'Region',
  field: { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'region', field_type: 'string' },
  condition: FilterCondition.In,
  values: ['Asia'],
  enabled: true,
  nested: false
};

describe('filterFromParam', () => {
  it("reads v1's filter, its field snake_case", () => {
    expect(filterFromParam(v1Filter, -1)).toEqual(region);
  });

  it('reads view fields', () => {
    const field = { className: 'view_field', viewName: 'v', fieldName: 'a', fieldType: 'int32' };
    expect(filterFromParam({ ...v1Filter, field }, -1)?.field).toEqual({ class_name: 'view_field', view_name: 'v', field_name: 'a', field_type: 'int32' });
  });

  it('falls back to the default condition and keeps the filter on', () => {
    const { isEnable: _on, ...rest } = v1Filter;
    const number = { ...rest, currentOptionSelected: 'bogus', field: { ...v1Filter.field, fieldType: 'int32' }, currentValues: [5] };
    expect(filterFromParam(number, -2)).toMatchObject({ condition: FilterCondition.Equal, values: ['5'], enabled: true });
  });

  it.each([
    ['not an object', 'x'],
    ['no field', { ...v1Filter, field: undefined }],
    ['an expression field', { ...v1Filter, field: { className: 'expression_field' } }]
  ])('is undefined for %s', (_case, value) => {
    expect(filterFromParam(value, -1)).toBeUndefined();
  });
});

describe('filterToParam', () => {
  it("writes v1's shape", () => {
    const { description: _d, isHidden: _h, id: _id, ...expected } = v1Filter;
    expect(filterToParam(region)).toEqual({ ...expected, id: -1 });
  });

  it('opens non list conditions in the range editor', () => {
    const number = { ...region, condition: FilterCondition.Between, field: { ...region.field, field_type: 'int32' } };
    expect(filterToParam(number)).toMatchObject({ filterModeSelected: 'range', currentInputType: 'number_range' });
  });

  it('reads back what it wrote', () => {
    const view = { ...region, field: { class_name: 'view_field', view_name: 'v', field_name: 'a', field_type: 'string' }, enabled: false, nested: true };
    expect(filterFromParam(filterToParam(view), -1)).toEqual(view);
  });
});

describe('parseFiltersParam', () => {
  it('numbers the filters it can read', () => {
    const param = JSON.stringify([v1Filter, { bogus: true }, { ...v1Filter, name: 'Second' }]);
    expect(parseFiltersParam(param).map(({ id, name }) => [id, name])).toEqual([
      [-1, 'Region'],
      [-3, 'Second']
    ]);
  });

  it.each([null, '', '{not json', '{"a":1}'])('has none for %s', param => {
    expect(parseFiltersParam(param)).toEqual([]);
  });

  it('reads toFiltersParam', () => {
    expect(parseFiltersParam(toFiltersParam([region]))).toEqual([region]);
  });
});
