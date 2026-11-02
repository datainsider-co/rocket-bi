import { describe, expect, it } from 'vitest';
import {
  columnReference,
  EditorMode,
  editorSourceOf,
  exportRequest,
  isWholeResult,
  rawQueryRequest,
  resultColumns,
  selectAllQuery,
  sqlToRun,
  tableReference,
  toRun
} from './queryEditor.utils';

const minQty = { displayName: 'min_qty', valueType: 'number', value: '2' };

describe('editorSourceOf', () => {
  it.each([
    ['', { mode: EditorMode.Query, dbName: undefined, tableName: undefined }],
    ['database=dw0_probe&table=products', { mode: EditorMode.Query, dbName: 'dw0_probe', tableName: 'products' }],
    ['table=products', { mode: EditorMode.Query, dbName: undefined, tableName: undefined }],
    ['mode=update&database=dw0_probe&table=big_qty&adhoc=5', { mode: EditorMode.UpdateTable, dbName: 'dw0_probe', tableName: 'big_qty' }],
    ['adhoc=5', { mode: EditorMode.Analysis, dbName: undefined, tableName: undefined, analysisId: 5 }],
    ['adhoc=abc', { mode: EditorMode.Query, dbName: undefined, tableName: undefined }],
    ['adhoc=0', { mode: EditorMode.Query, dbName: undefined, tableName: undefined }]
  ])('%j', (search, expected) => {
    expect(editorSourceOf(new URLSearchParams(search))).toEqual(expected);
  });
});

describe('references', () => {
  it('names a table and a column, with backticks where needed', () => {
    expect(tableReference('dw0_probe', 'products')).toBe('dw0_probe.products');
    expect(tableReference('dw0_probe', 'big qty')).toBe('dw0_probe.`big qty`');
    expect(columnReference('products', 'unit price')).toBe('products.`unit price`');
    expect(selectAllQuery('dw0_probe', 'products')).toBe('select * from dw0_probe.products');
  });
});

describe('sqlToRun', () => {
  it('runs the selection, or everything when nothing is selected', () => {
    expect(sqlToRun('select 1;\nselect 2', 'select 2')).toBe('select 2');
    expect(sqlToRun('select 1', '')).toBe('select 1');
    expect(sqlToRun('select 1', ' \n')).toBe('select 1');
  });
});

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

describe('exportRequest', () => {
  it('asks for every row', () => {
    expect(exportRequest(toRun(1, 'select id from t', []))).toMatchObject({ from: -1, size: -1, parameters: {} });
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
