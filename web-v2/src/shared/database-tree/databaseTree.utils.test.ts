import { describe, expect, it } from 'vitest';
import type { DatabaseSchema, TableSchema } from '@/core/schema/SchemaService';
import { createDatabaseSchema, databaseNameError, isDatabaseOpen, filterDatabases, tableKey, toDatabaseName, toggleKey, toTreeTables } from './databaseTree.utils';

function table(name: string, extra: Partial<TableSchema> = {}): TableSchema {
  return { dbName: 'shop', name, columns: [{ name: 'id', displayName: 'Id', type: 'int64' }], ...extra };
}

const shop: DatabaseSchema = {
  name: 'shop',
  tables: [
    table('orders', { displayName: 'Orders' }),
    table('products', {
      calculatedColumns: [{ name: 'double_qty', displayName: 'Double Qty', type: 'int64', expression: 'qty * 2' }],
      expressionColumns: [{ name: 'total', displayName: '', type: 'double', expression: 'sum(price)' }]
    }),
    table('audit')
  ]
};
const databases = [
  { name: 'hr', displayName: 'Human Resources' },
  { name: 'shop', displayName: 'shop' },
  { name: 'sys', displayName: 'sys' }
];
const schemas = new Map([['shop', shop]]);

describe('tableKey', () => {
  it('keeps names with separators apart', () => {
    expect(tableKey('a.b', 'c')).not.toBe(tableKey('a', 'b.c'));
    expect(tableKey('shop', 'orders')).toBe(tableKey('shop', 'orders'));
  });
});

describe('toTreeTables', () => {
  it('sorts tables by title and lists columns, calculated columns, then measures', () => {
    const tables = toTreeTables(shop);

    expect(tables.map(item => item.title)).toEqual(['audit', 'Orders', 'products']);
    expect(tables[2]?.columns).toEqual([
      { name: 'id', title: 'Id', type: 'int64', role: 'column' },
      { name: 'double_qty', title: 'Double Qty', type: 'int64', role: 'calculated' },
      { name: 'total', title: 'total', type: 'double', role: 'measure' }
    ]);
    expect(tables[0]).toMatchObject({ key: tableKey('shop', 'audit'), dbName: 'shop', name: 'audit' });
  });

  it('does not reorder the schema', () => {
    toTreeTables(shop);
    expect(shop.tables.map(item => item.name)).toEqual(['orders', 'products', 'audit']);
  });
});

describe('filterDatabases', () => {
  it('shows every database without a keyword, tables only when loaded', () => {
    const shown = filterDatabases(databases, schemas, '  ');

    expect(shown.map(item => item.name)).toEqual(['hr', 'shop', 'sys']);
    expect(shown[0]?.tables).toBeUndefined();
    expect(shown[1]?.tables).toHaveLength(3);
    expect(shown.every(item => !item.matchedByTable)).toBe(true);
  });

  it('keeps a database whose name or title matches, with all its tables', () => {
    expect(filterDatabases(databases, schemas, 'HUMAN')).toEqual([{ name: 'hr', title: 'Human Resources', tables: undefined, matchedByTable: false }]);
    expect(filterDatabases(databases, schemas, 'sho')[0]?.tables).toHaveLength(3);
  });

  it('keeps a loaded database with only the tables that match', () => {
    const [found, ...rest] = filterDatabases(databases, schemas, 'ord');

    expect(rest).toEqual([]);
    expect(found).toMatchObject({ name: 'shop', matchedByTable: true });
    expect(found?.tables?.map(item => item.name)).toEqual(['orders']);
  });

  it('shows nothing when nothing matches', () => {
    expect(filterDatabases(databases, schemas, 'zzz')).toEqual([]);
    expect(filterDatabases([], schemas, '')).toEqual([]);
  });
});

describe('toggleKey', () => {
  it('adds a missing key and removes a present one without changing the input', () => {
    const keys = new Set(['a']);

    expect(toggleKey(keys, 'b')).toEqual(new Set(['a', 'b']));
    expect(toggleKey(keys, 'a')).toEqual(new Set());
    expect(keys).toEqual(new Set(['a']));
  });
});

describe('toDatabaseName', () => {
  it.each([
    ['Sales', 'sales'],
    ['Đơn hàng 2026', 'don_hang_2026'],
    ['  my  data  ', 'my_data'],
    ['(x)', 'x'],
    ['***', '']
  ])('%j -> %j', (typed, name) => {
    expect(toDatabaseName(typed)).toBe(name);
  });
});

describe('databaseNameError', () => {
  it.each([
    ['', 'Database name is required'],
    ['   ', 'Database name is required'],
    ['***', 'Use letters or digits'],
    ['2026 sales', 'Database name cannot start with a number'],
    ['Shop', 'Database shop already exists'],
    ['New shop', undefined]
  ])('%j -> %j', (typed, error) => {
    expect(databaseNameError(typed, databases)).toBe(error);
  });
});

describe('createDatabaseSchema', () => {
  it('accepts a new name and refuses a taken one with its message', () => {
    const schema = createDatabaseSchema(databases);

    expect(schema.safeParse({ name: 'Marketing' }).success).toBe(true);
    expect(schema.safeParse({ name: 'shop' }).error?.issues[0]?.message).toBe('Database shop already exists');
  });
});

describe('isDatabaseOpen', () => {
  const database = { name: 'shop', title: 'shop', tables: undefined, matchedByTable: false };

  it('follows what the user opened', () => {
    expect(isDatabaseOpen(database, new Set(['shop']))).toBe(true);
    expect(isDatabaseOpen(database, new Set(['hr']))).toBe(false);
  });

  it('opens a database the search found tables in', () => {
    expect(isDatabaseOpen({ ...database, matchedByTable: true }, new Set())).toBe(true);
  });
});
