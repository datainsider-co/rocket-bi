import { describe, expect, it } from 'vitest';
import { isWholeResult, rawQueryRequest, resultColumns, toRun } from './queryResult.utils';

const minQty = { displayName: 'min_qty', valueType: 'number', value: '2' };

describe('toRun', () => {
  it('keeps the parameters the SQL names, with their values', () => {
    const stale = { displayName: 'gone', valueType: 'text', value: 'x' };
    expect(toRun(3, 'select {{min_qty}}, {{name}}', [stale, minQty])).toEqual({
      id: 3,
      sql: 'select {{min_qty}}, {{name}}',
      parameters: [minQty, { displayName: 'name', valueType: 'text', value: '' }]
    });
  });
});

describe('rawQueryRequest', () => {
  it('asks for a page, with the parameters formatted', () => {
    const request = rawQueryRequest(toRun(1, 'select id from t where qty > {{min_qty}};', [minQty]), 3, 50);
    expect(request).toMatchObject({ from: 100, size: 50, parameters: { min_qty: '2' } });
    expect(request['query_setting']).toMatchObject({ class_name: 'raw_query_setting', sql: 'select id from t where qty > {{min_qty}}', parameters: { min_qty: '2' } });
  });

  it('asks for every row of SQL with a limit, which the server does not page', () => {
    const run = toRun(1, 'select id from t LIMIT 3', []);
    expect(isWholeResult(run)).toBe(true);
    expect(rawQueryRequest(run, 2, 20)).toMatchObject({ from: -1, size: -1 });
  });
});

describe('resultColumns', () => {
  it('titles each column with its label', () => {
    const header = { isGroupBy: false, isTextLeft: false, formatterKey: '', children: [] };
    expect(resultColumns([{ ...header, key: '0', label: 'id' }, { ...header, key: '1', label: 'name' }])).toEqual([
      { key: '0', title: 'id' },
      { key: '1', title: 'name' }
    ]);
    expect(resultColumns([])).toEqual([]);
  });
});
