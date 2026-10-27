import { describe, expect, it } from 'vitest';
import { tableNodesOf } from '../field-tree/fieldTree.utils';
import { fieldMenuItems, fieldOfKey, filterableField } from './fieldMenu.utils';

const tables = tableNodesOf([
  {
    dbName: 'sample_v2',
    name: 'sales',
    columns: [
      { name: 'region', displayName: 'Region', type: 'string' },
      { name: 'items', displayName: 'Items', type: 'nested', nestedColumns: [{ name: 'sku', displayName: 'SKU', type: 'string' }] }
    ],
    expressionColumns: [{ name: 'profit', displayName: 'Profit', type: 'double', expression: 'sum(x)' }]
  },
  { dbName: 'sample_v2', name: 'empty', columns: [] }
]);

describe('fieldMenuItems', () => {
  it('lists each table with its fields, nested columns one level deeper', () => {
    expect(fieldMenuItems(tables)).toEqual([
      {
        key: 'table:sales',
        label: 'sales',
        children: [
          { key: 'sales:nested:items', label: 'Items', children: [{ key: 'sales:column:`items.sku`', label: 'SKU' }] },
          { key: 'sales:column:region', label: 'Region' },
          { key: 'sales:measure:profit', label: 'Profit' }
        ]
      }
    ]);
  });

  it('leaves out the fields the zone does not take', () => {
    const [sales] = fieldMenuItems(tables, filterableField) as { children: { key: string }[] }[];
    expect(sales?.children.map(child => child.key)).toEqual(['sales:nested:items', 'sales:column:region']);
  });

  it('leaves out nested columns and tables left empty', () => {
    expect(fieldMenuItems(tables, () => false)).toEqual([]);
  });
});

describe('fieldOfKey', () => {
  it('finds a column, a nested column and a measure', () => {
    expect(fieldOfKey(tables, 'sales:column:region')).toMatchObject({ columnName: 'Region', tableName: 'sales' });
    expect(fieldOfKey(tables, 'sales:column:`items.sku`')).toMatchObject({ columnName: 'SKU', isNested: true });
    expect(fieldOfKey(tables, 'sales:measure:profit')?.field).toMatchObject({ class_name: 'expression_field' });
  });

  it('finds nothing for a table or an unknown key', () => {
    expect(fieldOfKey(tables, 'table:sales')).toBeUndefined();
    expect(fieldOfKey(tables, 'nope')).toBeUndefined();
  });
});
