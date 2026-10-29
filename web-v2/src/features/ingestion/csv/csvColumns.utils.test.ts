import { describe, expect, it } from 'vitest';
import type { CsvColumn } from '@/core/ingestion/CsvImport';
import {
  columnErrors,
  columnTypeLabel,
  nullCounts,
  renameColumn,
  setColumnType,
  tableMismatch,
  toIdentifier
} from './csvColumns.utils';

function column(name: string, type = 'string'): CsvColumn {
  return { name, type, json: { class_name: type, name, input_formats: ['yyyy'] } };
}

describe('columnTypeLabel', () => {
  it('names a type v1 offered', () => {
    expect(columnTypeLabel('datetime')).toBe('DateTime');
  });

  it('shows another type as is', () => {
    expect(columnTypeLabel('datetime64')).toBe('datetime64');
  });
});

describe('toIdentifier', () => {
  it.each([
    ['Đơn hàng 1', 'Don_hang_1'],
    ['Mã số', 'Ma_so'],
    ['  unit   price  ', 'unit_price'],
    ['a--b__c', 'a_b_c'],
    ['(x)', '_x_'],
    ['plain_name', 'plain_name'],
    ['', '']
  ])('turns %j into %j as the server does', (name, identifier) => {
    expect(toIdentifier(name)).toBe(identifier);
  });
});

describe('renameColumn and setColumnType', () => {
  const columns = [column('a'), column('b')];

  it('renames one column and keeps its server keys', () => {
    expect(renameColumn(columns, 1, 'c')).toEqual([columns[0], { ...columns[1], name: 'c' }]);
  });

  it('changes the type of one column', () => {
    expect(setColumnType(columns, 0, 'int64')[0]).toEqual({ ...columns[0], type: 'int64' });
  });

  it('does not change the input', () => {
    renameColumn(columns, 0, 'z');
    setColumnType(columns, 0, 'bool');
    expect(columns).toEqual([column('a'), column('b')]);
  });
});

describe('columnErrors', () => {
  it('accepts distinct names', () => {
    expect(columnErrors([column('a'), column('b')])).toEqual([undefined, undefined]);
  });

  it('requires a name', () => {
    expect(columnErrors([column(' '), column('b')])).toEqual(['Name is required', undefined]);
  });

  it('flags names that are the same once stored', () => {
    expect(columnErrors([column('unit price'), column('unit_price'), column('x')])).toEqual([
      'Duplicate name',
      'Duplicate name',
      undefined
    ]);
  });

  it('returns nothing for no columns', () => {
    expect(columnErrors([])).toEqual([]);
  });
});

describe('nullCounts', () => {
  it('counts null and missing values per column', () => {
    expect(nullCounts([[1, null, 'x'], [null, null], [2, 'a', 'b']], 3)).toEqual([1, 2, 1]);
  });

  it('counts zero without rows', () => {
    expect(nullCounts([], 2)).toEqual([0, 0]);
  });
});

describe('tableMismatch', () => {
  const table = [
    { name: 'Ma_so', displayName: 'Mã số', type: 'int64' },
    { name: 'name', displayName: 'name', type: 'string' }
  ];

  it('accepts the columns of the table, compared as stored', () => {
    expect(tableMismatch([column('Mã số', 'int64'), column('name')], table)).toBeUndefined();
  });

  it('rejects another number of columns', () => {
    expect(tableMismatch([column('Mã số', 'int64')], table)).toBe(
      'The table has 2 columns and the file 1. Pick another table or type a new name.'
    );
  });

  it('names the first column that differs by name', () => {
    expect(tableMismatch([column('Mã số', 'int64'), column('title')], table)).toMatch(
      /^Column 2 is name \(String\) in the table and title \(String\) in the file/
    );
  });

  it('names the first column that differs by type', () => {
    expect(tableMismatch([column('Mã số'), column('name')], table)).toMatch(/^Column 1 is Ma_so \(Int64\) in the table and Mã số \(String\)/);
  });
});
