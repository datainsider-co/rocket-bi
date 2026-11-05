import { describe, expect, it } from 'vitest';
import { checkPersist, persistFormOf, persistHint, resolvedName, targetNameOf } from './persist.utils';

const databases = ['sales_db', 'MixedCase'];
const tables = ['orders'];

describe('persistFormOf', () => {
  it('reads a saved destination, or starts empty on Update', () => {
    expect(persistFormOf({ dbName: 'a', tblName: 'b', type: 'Append' })).toEqual({ database: 'a', table: 'b', type: 'Append' });
    expect(persistFormOf(undefined)).toEqual({ database: '', table: '', type: 'Update' });
  });
});

describe('targetNameOf', () => {
  it.each([
    ['RegionCount2', 'regioncount2'],
    [' Sales by region ', 'sales_by_region'],
    ['a-b.c', 'a_b_c'],
    ['', '']
  ])('%s → %s', (text, name) => {
    expect(targetNameOf(text)).toBe(name);
  });
});

describe('resolvedName', () => {
  it('keeps an existing name as it is, makes a new one', () => {
    expect(resolvedName('MixedCase', databases)).toBe('MixedCase');
    expect(resolvedName('New DB', databases)).toBe('new_db');
  });
});

describe('checkPersist', () => {
  it('gives the destination', () => {
    expect(checkPersist({ database: 'sales_db', table: 'Region Count', type: 'Append' }, databases, tables)).toEqual({
      ok: true,
      persist: { dbName: 'sales_db', tblName: 'region_count', type: 'Append' }
    });
  });

  it('asks for both names', () => {
    expect(checkPersist({ database: ' ', table: '', type: 'Update' }, databases, tables)).toEqual({
      ok: false,
      databaseError: 'Please select or input a database name.',
      tableError: 'Please select or input a table name.'
    });
  });

  it('refuses a name starting with a digit', () => {
    expect(checkPersist({ database: '1db', table: '2t', type: 'Update' }, databases, tables)).toEqual({
      ok: false,
      databaseError: "Database name can't start with a digit",
      tableError: "Table name can't start with a digit"
    });
  });
});

describe('persistHint', () => {
  it('says what a run creates', () => {
    expect(persistHint({ database: 'New', table: 'T', type: 'Update' }, databases, [])).toBe('The database and table will be created on the first run');
    expect(persistHint({ database: 'sales_db', table: 'New', type: 'Append' }, databases, tables)).toBe('The table will be created on the first run');
  });

  it("warns that Update overwrites an existing table, as v1", () => {
    expect(persistHint({ database: 'sales_db', table: 'orders', type: 'Update' }, databases, tables)).toBe('This action will overwrite the data and schema of the table: orders');
  });

  it('says nothing on Append to an existing table, or without a table', () => {
    expect(persistHint({ database: 'sales_db', table: 'orders', type: 'Append' }, databases, tables)).toBeUndefined();
    expect(persistHint({ database: 'sales_db', table: '', type: 'Update' }, databases, tables)).toBeUndefined();
  });
});
