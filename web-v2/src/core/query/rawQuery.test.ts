import { describe, expect, it } from 'vitest';
import fixture from '@/core/schema/warehouse.fixture.json';
import { toQueryRequestJson } from './QueryRequest';
import { hasLimit, parameterNames, parameterValues, rawQuerySetting, syncParameters } from './rawQuery';

const minQty = { displayName: 'min_qty', valueType: 'number', value: '2' };

describe('parameterNames', () => {
  it('finds each name once, in order, with or without spaces', () => {
    expect(parameterNames('select * from t where a = {{ b }} and c > {{a}} or d = {{b}}')).toEqual(['b', 'a']);
  });

  it('ignores placeholders the server would not replace', () => {
    expect(parameterNames('select {{ two words }}, {{a-b}}, {{}}')).toEqual([]);
  });
});

describe('syncParameters', () => {
  it('keeps known parameters, adds new ones as text and drops the rest', () => {
    const stale = { displayName: 'gone', valueType: 'date', value: '2026-01-01' };
    expect(syncParameters('where qty > {{min_qty}} and name = {{name}}', [stale, minQty])).toEqual([
      minQty,
      { displayName: 'name', valueType: 'text', value: '' }
    ]);
  });
});

describe('parameterValues', () => {
  it('formats each value for the SQL', () => {
    expect(parameterValues([minQty, { displayName: 'name', valueType: 'text', value: "O'Brien tea" }])).toEqual(
      { min_qty: '2', name: "'O''Brien tea'" }
    );
  });
});

describe('hasLimit', () => {
  it.each([
    ['SELECT id FROM t LIMIT 3', true],
    ['select id from t\nlimit 3', true],
    ["select 'no limit 5' from t", true],
    ['select id from t', false],
    ['select limited from t', false]
  ])('%s', (sql, expected) => {
    expect(hasLimit(sql)).toBe(expected);
  });
});

describe('rawQuerySetting', () => {
  it('builds the request DW0 ran', () => {
    const sql = fixture.rawQueryParamNumber.request.query_setting.sql;
    const parameters = [minQty];

    const request = toQueryRequestJson({ setting: rawQuerySetting(sql, parameters), parameters: parameterValues(parameters) });

    const { query_setting, from, size, parameters: sent } = fixture.rawQueryParamNumber.request;
    expect(request).toMatchObject({ from, size, parameters: sent });
    expect(request['query_setting']).toMatchObject({ class_name: query_setting.class_name, sql, parameters: sent, sql_views: [] });
  });
});
