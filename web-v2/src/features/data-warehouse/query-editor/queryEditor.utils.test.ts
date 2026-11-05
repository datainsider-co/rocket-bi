import { describe, expect, it } from 'vitest';
import { toRun } from '@/shared/query-result/queryResult.utils';
import {
  analysisPath,
  columnReference,
  EditorMode,
  editorSourceOf,
  exportRequest,
  selectAllQuery,
  sqlToRun,
  tableReference
} from './queryEditor.utils';

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

describe('analysisPath', () => {
  it('opens a saved analysis', () => {
    expect(analysisPath(5)).toBe('/data-warehouse/query-editor?adhoc=5');
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

describe('exportRequest', () => {
  it('asks for every row', () => {
    expect(exportRequest(toRun(1, 'select id from t', []))).toMatchObject({ from: -1, size: -1, parameters: {} });
  });
});
