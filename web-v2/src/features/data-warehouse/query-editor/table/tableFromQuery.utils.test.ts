import { describe, expect, it } from 'vitest';
import { tableFromQuerySchema, tableQueryOf, toTableFromQuery, type TableFromQueryForm } from './tableFromQuery.utils';

describe('tableQueryOf', () => {
  it('puts the values in and drops a closing `;`', () => {
    expect(tableQueryOf("select * from t where name = {{name}};", [{ displayName: 'name', valueType: 'text', value: "O'Brien" }])).toBe(
      "select * from t where name = 'O''Brien'"
    );
  });
});

describe('tableFromQuerySchema', () => {
  const form: TableFromQueryForm = { dbName: 'dw0_probe', name: 'Big Qty', tableType: 'view' };
  const errors = (value: TableFromQueryForm) => {
    const result = tableFromQuerySchema(db => (db === 'dw0_probe' ? ['products', 'big_qty'] : [])).safeParse(value);
    return result.success ? {} : Object.fromEntries(result.error.issues.map(issue => [issue.path[0], issue.message]));
  };

  it('accepts a new name in a database', () => {
    expect(errors({ ...form, name: 'Small Qty' })).toEqual({});
    expect(errors({ ...form, dbName: 'other' })).toEqual({});
  });

  it('needs a database and a name the database does not have', () => {
    expect(errors({ ...form, dbName: '', name: '' })).toEqual({ dbName: 'Database is required', name: 'Table name is required' });
    expect(errors(form)).toEqual({ name: 'Table big_qty already exists' });
  });
});

describe('toTableFromQuery', () => {
  it('names the table as the server stores it', () => {
    expect(toTableFromQuery({ dbName: 'dw0_probe', name: ' Đơn hàng ', tableType: 'materialized' }, 'select 1')).toEqual({
      dbName: 'dw0_probe',
      name: 'don_hang',
      displayName: 'Đơn hàng',
      query: 'select 1',
      tableType: 'materialized'
    });
  });
});
