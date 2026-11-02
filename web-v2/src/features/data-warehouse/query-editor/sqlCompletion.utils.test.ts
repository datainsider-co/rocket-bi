import { describe, expect, it } from 'vitest';
import type { DatabaseSchema } from '@/core/schema/SchemaService';
import { completionContext, databaseToLoad, sqlCompletions, type SqlSchema } from './sqlCompletion.utils';

const probe: DatabaseSchema = {
  name: 'dw0_probe',
  tables: [
    {
      dbName: 'dw0_probe',
      name: 'products',
      displayName: 'Products',
      columns: [
        { name: 'id', displayName: 'Id', type: 'int64' },
        { name: 'unit price', displayName: 'Unit Price', type: 'double' }
      ],
      calculatedColumns: [{ name: 'double_qty', displayName: 'Double Qty', type: 'int64' }],
      expressionColumns: [{ name: 'total', displayName: 'Total', type: 'double' }]
    },
    { dbName: 'dw0_probe', name: 'big qty', columns: [{ name: 'id', displayName: 'Id', type: 'int64' }] }
  ]
};
const other: DatabaseSchema = { name: 'sales', tables: [{ dbName: 'sales', name: 'products', columns: [{ name: 'sku', displayName: 'SKU', type: 'string' }] }] };
const schema: SqlSchema = {
  databases: [
    { name: 'dw0_probe', displayName: 'dw0_probe' },
    { name: 'sales', displayName: 'sales' },
    { name: 'empty', displayName: 'empty' }
  ],
  schemas: [probe],
  functions: [{ name: 'SUM', title: 'SUM(x)' }]
};

const labels = (specs: { label: string }[]) => specs.map(spec => spec.label);

describe('completionContext', () => {
  it.each([
    ['select * from ', { kind: 'any' }],
    ['select su', { kind: 'any' }],
    ['select * from dw0_probe.', { kind: 'member', path: ['dw0_probe'] }],
    ['select * from dw0_probe.pro', { kind: 'member', path: ['dw0_probe'] }],
    ['select dw0_probe.products.', { kind: 'member', path: ['dw0_probe', 'products'] }],
    ['select `big qty`.i', { kind: 'member', path: ['big qty'] }],
    ['where x > 1.', { kind: 'member', path: ['1'] }]
  ])('%j', (text, expected) => {
    expect(completionContext(text)).toEqual(expected);
  });
});

describe('databaseToLoad', () => {
  it('loads a database named before the dot that is not loaded yet', () => {
    expect(databaseToLoad({ kind: 'member', path: ['sales'] }, schema.databases, schema.schemas)).toBe('sales');
  });

  it.each([
    ['anywhere', { kind: 'any' } as const],
    ['a loaded database', { kind: 'member', path: ['dw0_probe'] } as const],
    ['a name that is no database', { kind: 'member', path: ['products'] } as const]
  ])('loads nothing for %s', (_name, context) => {
    expect(databaseToLoad(context, schema.databases, schema.schemas)).toBeUndefined();
  });
});

describe('sqlCompletions', () => {
  it('suggests functions, databases, loaded tables and their columns once each', () => {
    const specs = sqlCompletions({ kind: 'any' }, { ...schema, schemas: [probe, other] });
    expect(labels(specs)).toEqual(['SUM', 'dw0_probe', 'sales', 'empty', 'dw0_probe.products', 'dw0_probe.big qty', 'sales.products', 'id', 'unit price', 'double_qty', 'sku']);
    expect(specs.find(spec => spec.label === 'dw0_probe.big qty')).toMatchObject({ insertText: 'dw0_probe.`big qty`', kind: 'table' });
    expect(specs.find(spec => spec.label === 'unit price')).toMatchObject({ insertText: '`unit price`', kind: 'field', detail: 'dw0_probe.products' });
  });

  it('suggests the tables of a database after `db.`', () => {
    const specs = sqlCompletions({ kind: 'member', path: ['dw0_probe'] }, schema);
    expect(labels(specs)).toEqual(['products', 'big qty']);
    expect(specs[1]).toMatchObject({ insertText: '`big qty`', detail: 'Table of dw0_probe' });
  });

  it('suggests nothing after a database that is not loaded or has no tables', () => {
    expect(sqlCompletions({ kind: 'member', path: ['empty'] }, schema)).toEqual([]);
  });

  it('suggests the columns of `db.table.`, without measures', () => {
    expect(labels(sqlCompletions({ kind: 'member', path: ['dw0_probe', 'products'] }, schema))).toEqual(['id', 'unit price', 'double_qty']);
  });

  it('suggests the columns of every loaded table named before the dot', () => {
    expect(labels(sqlCompletions({ kind: 'member', path: ['products'] }, { ...schema, schemas: [probe, other] }))).toEqual(['id', 'unit price', 'double_qty', 'sku']);
  });

  it.each([
    ['an unknown name', ['1']],
    ['an unknown table of a database', ['dw0_probe', 'nope']],
    ['three names', ['dw0_probe', 'products', 'id']]
  ])('suggests nothing after %s', (_name, path) => {
    expect(sqlCompletions({ kind: 'member', path }, schema)).toEqual([]);
  });
});
