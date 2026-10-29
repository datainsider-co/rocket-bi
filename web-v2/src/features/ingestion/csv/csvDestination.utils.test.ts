import { describe, expect, it } from 'vitest';
import type { CsvColumn } from '@/core/ingestion/CsvImport';
import type { TableSchema } from '@/core/schema/SchemaService';
import {
  csvDestinationSchema,
  destinationErrors,
  destinationHint,
  resolveDestination,
  type CsvDestination
} from './csvDestination.utils';

const orders: TableSchema = {
  dbName: 'sales',
  name: 'Don_hang',
  displayName: 'Đơn hàng',
  columns: [{ name: 'id', displayName: 'id', type: 'int64' }]
};

const fileColumns: CsvColumn[] = [{ name: 'id', type: 'int64', json: {} }];

describe('csvDestinationSchema', () => {
  it('accepts a database and a table', () => {
    expect(csvDestinationSchema.safeParse({ databaseName: 'a', tableName: 'b' }).success).toBe(true);
  });

  it('requires both', () => {
    const result = csvDestinationSchema.safeParse({ databaseName: ' ', tableName: '' });
    expect(result.error?.issues.map(issue => [issue.path[0], issue.message])).toEqual([
      ['databaseName', 'Database is required!'],
      ['tableName', 'Table is required!']
    ]);
  });
});

describe('resolveDestination', () => {
  it('finds a listed database and table', () => {
    expect(resolveDestination({ databaseName: 'sales', tableName: 'Don_hang' }, ['sales'], [orders])).toEqual({
      dbName: 'sales',
      isNewDatabase: false,
      table: { kind: 'existing', name: 'Don_hang', columns: orders.columns }
    });
  });

  it('finds a table typed by its display name', () => {
    expect(resolveDestination({ databaseName: 'sales', tableName: ' Đơn hàng ' }, ['sales'], [orders]).table.kind).toBe('existing');
  });

  it('makes a new table of a name not listed', () => {
    expect(resolveDestination({ databaseName: 'sales', tableName: 'Khách hàng' }, ['sales'], [orders]).table).toEqual({
      kind: 'new',
      name: 'Khach_hang',
      displayName: 'Khách hàng'
    });
  });

  it('stores a new database the way the server stores names', () => {
    expect(resolveDestination({ databaseName: 'Bán hàng 2024', tableName: 'Don_hang' }, ['sales'], [orders])).toEqual({
      dbName: 'Ban_hang_2024',
      isNewDatabase: true,
      table: { kind: 'new', name: 'Don_hang', displayName: 'Don_hang' }
    });
  });

  it('finds a listed database typed with spaces', () => {
    expect(resolveDestination({ databaseName: 'sales data', tableName: 't' }, ['sales_data'], []).dbName).toBe('sales_data');
  });
});

describe('destinationErrors', () => {
  const newTable = (name: string): CsvDestination['table'] => ({ kind: 'new', name, displayName: name });

  it('accepts new names', () => {
    expect(destinationErrors({ dbName: 'db', isNewDatabase: true, table: newTable('t') }, fileColumns)).toEqual({});
  });

  it('rejects new names that start with a digit', () => {
    expect(destinationErrors({ dbName: '2024', isNewDatabase: true, table: newTable('1t') }, fileColumns)).toEqual({
      databaseName: "Database name can't start with a digit",
      tableName: "Table name can't start with a digit"
    });
  });

  it('rejects a new name with no letter or digit', () => {
    expect(destinationErrors({ dbName: 'db', isNewDatabase: false, table: newTable('_') }, fileColumns)).toEqual({
      tableName: 'Table name needs a letter or a digit'
    });
  });

  it('does not check the name of a listed database', () => {
    expect(destinationErrors({ dbName: '2024', isNewDatabase: false, table: newTable('t') }, fileColumns)).toEqual({});
  });

  it('accepts an existing table with the columns of the file', () => {
    const table = { kind: 'existing', name: 'Don_hang', columns: orders.columns } as const;
    expect(destinationErrors({ dbName: 'sales', isNewDatabase: false, table }, fileColumns)).toEqual({});
  });

  it('rejects an existing table with other columns', () => {
    const table = { kind: 'existing', name: 'Don_hang', columns: orders.columns } as const;
    const errors = destinationErrors({ dbName: 'sales', isNewDatabase: false, table }, [{ name: 'id', type: 'string', json: {} }]);
    expect(errors.tableName).toMatch(/^Column 1 is id \(Int64\)/);
  });
});

describe('destinationHint', () => {
  const existing: CsvDestination = {
    dbName: 'sales',
    isNewDatabase: false,
    table: { kind: 'existing', name: 'Don_hang', columns: [] }
  };

  it('names a new database', () => {
    expect(destinationHint({ ...existing, dbName: 'x_y', isNewDatabase: true }, 'databaseName')).toBe('New database: x_y');
  });

  it('says nothing about a listed database', () => {
    expect(destinationHint(existing, 'databaseName')).toBeUndefined();
  });

  it('names a new table', () => {
    expect(destinationHint({ ...existing, table: { kind: 'new', name: 'a_b', displayName: 'a b' } }, 'tableName')).toBe('New table: a_b');
  });

  it('says rows go into an existing table', () => {
    expect(destinationHint(existing, 'tableName')).toBe('The rows are added to this table.');
  });
});
