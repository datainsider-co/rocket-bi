import { describe, expect, it } from 'vitest';
import fixture from '@/core/schema/warehouse.fixture.json';
import {
  formatParamValue,
  parameterConfigOf,
  parameterFromJson,
  parameterWidgetIdsOf,
  queryParameters,
  storedParameters
} from './queryParameters';

const param = { display_name: 'min_units', value_type: 'number', value: '5000', list: null };
const viz = (options: object) => ({ options: { class_name: 'table_chart_setting', options } });

describe('formatParamValue', () => {
  it.each([
    ['text', 'Asia', "'Asia'"],
    ['date', '2020-01-01', "'2020-01-01'"],
    ['list', 'a', "'a'"],
    ['number', '12.5', '12.5'],
    ['number', 'abc', '0'],
    ['text', undefined, "''"],
    ['text', "O'Brien", "'O''Brien'"],
    ['text', 'US$ 5', "'US\\$ 5'"],
    ['text', 'a\\b', "'a\\\\b'"]
  ])('%s %s', (type, value, expected) => {
    expect(formatParamValue(type, value)).toBe(expected);
  });
});

describe('parameterFromJson', () => {
  it('reads a parameter and needs a name', () => {
    expect(parameterFromJson(param)).toEqual({ displayName: 'min_units', valueType: 'number', value: '5000' });
    expect(parameterFromJson({ display_name: 'x', value: null })).toEqual({ displayName: 'x', valueType: 'text', value: '' });
    expect(parameterFromJson({ value: 1 })).toBeUndefined();
    expect(parameterFromJson('x')).toBeUndefined();
  });
});

describe('viz option accessors', () => {
  it('reads the parameter config and the input ids', () => {
    expect(parameterConfigOf(viz({ parameter_config: param }))?.displayName).toBe('min_units');
    expect(parameterConfigOf(viz({}))).toBeUndefined();
    expect(parameterWidgetIdsOf(viz({ parameter_widget_ids: [23, 'x'] }))).toEqual([23]);
    expect(parameterWidgetIdsOf({})).toEqual([]);
  });
});

describe('storedParameters', () => {
  it('reads the viz options, formatted and named as in the SQL', () => {
    expect(storedParameters({ parameters: { a: "'x'" }, ...viz({ query_parameter: { minUnits: param, bad: {} } }) })).toEqual({ min_units: '5000' });
  });

  it("reads the query editor's list, not the keys v1 snake_cased", () => {
    const request = fixture.analysisQueryCamelParam.request.query_setting;
    const setting = { ...request, ...viz({ query_parameter: [{ display_name: 'minQty', value_type: 'text', value: '', list: null }] }) };
    expect(request.parameters).toEqual({ min_qty: "''" });
    expect(storedParameters(setting)).toEqual({ minQty: "''" });
  });

  it('falls back to the setting parameters', () => {
    expect(storedParameters({ parameters: { a: "'x'" }, ...viz({}) })).toEqual({ a: "'x'" });
    expect(storedParameters({})).toEqual({});
  });
});

describe('queryParameters', () => {
  it('puts the inputs on top of the stored values', () => {
    const parameter = { displayName: 'min_units', valueType: 'number', value: '5000' };
    const setting = { parameters: { min_units: '1', other: "'o'" } };
    expect(queryParameters(setting, [{ parameter, value: '20' }])).toEqual({ min_units: '20', other: "'o'" });
    expect(queryParameters(setting, [{ parameter }])).toEqual({ min_units: '5000', other: "'o'" });
  });
});
