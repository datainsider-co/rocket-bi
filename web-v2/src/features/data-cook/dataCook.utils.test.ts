import { describe, expect, it } from 'vitest';
import {
  DATA_COOK_SECTIONS,
  DataCookSection,
  dataCookSectionFromPath,
  etlEditorPath,
  etlIdFromParam,
  getDataCookSection,
  isEtlEditorPath
} from './dataCook.utils';

describe('DATA_COOK_SECTIONS', () => {
  it("lists v1's sidebar in order", () => {
    expect(DATA_COOK_SECTIONS.map(section => [section.title, section.path])).toEqual([
      ['My ETL', '/data-warehouse/data-cook/my-etl'],
      ['Share With Me', '/data-warehouse/data-cook/shared'],
      ['ETL History', '/data-warehouse/data-cook/history'],
      ['Trash', '/data-warehouse/data-cook/trash']
    ]);
  });
});

describe('getDataCookSection', () => {
  it('finds a section by key', () => {
    expect(getDataCookSection(DataCookSection.Trash).icon).toBe('di-icon-delete');
  });

  it('throws on an unknown key', () => {
    expect(() => getDataCookSection('nope' as DataCookSection)).toThrow('Unknown Data Cook section');
  });
});

describe('dataCookSectionFromPath', () => {
  it.each([
    ['/data-warehouse/data-cook/my-etl', 'my-etl'],
    ['/data-warehouse/data-cook/shared', 'shared'],
    ['/data-warehouse/data-cook/history', 'history'],
    ['/data-warehouse/data-cook/trash', 'trash'],
    ['/data-warehouse/data-cook/my-etl/create', 'my-etl'],
    ['/data-warehouse/data-cook/my-etl/sales-etl-2', 'my-etl'],
    ['/data-warehouse/data-cook', 'my-etl'],
    ['/data-warehouse/data-cook/unknown', 'my-etl'],
    ['/data-warehouse/data-cookies/trash', 'my-etl'],
    ['/mydata', 'my-etl']
  ])('%s is in %s', (pathname, section) => {
    expect(dataCookSectionFromPath(pathname)).toBe(section);
  });
});

describe('etlEditorPath', () => {
  it('puts the slug and the id in the path, like v1', () => {
    expect(etlEditorPath(2, 'Untitled ETL')).toBe('/data-warehouse/data-cook/my-etl/untitled-etl-2');
  });
});

describe('etlIdFromParam', () => {
  it.each([
    ['untitled-etl-2', 2],
    ['12', 12],
    ['create', undefined],
    ['etl-x', undefined],
    [undefined, undefined]
  ])('reads %s as %s', (param, id) => {
    expect(etlIdFromParam(param)).toBe(id);
  });
});

describe('isEtlEditorPath', () => {
  it('is the editor of the ETL under any name', () => {
    expect(isEtlEditorPath('/data-warehouse/data-cook/my-etl/untitled-etl-12', 12)).toBe(true);
    expect(isEtlEditorPath('/data-warehouse/data-cook/my-etl/sales-12', 12)).toBe(true);
  });

  it.each([
    '/data-warehouse/data-cook/my-etl/sales-13',
    '/data-warehouse/data-cook/my-etl/create',
    '/data-warehouse/data-cook/my-etl',
    '/data-warehouse/data-cook/my-etl/sales-12/x',
    '/data-warehouse/data-cook/trash'
  ])('is not %s', pathname => {
    expect(isEtlEditorPath(pathname, 12)).toBe(false);
  });
});
