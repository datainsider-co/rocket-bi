import { describe, expect, it } from 'vitest';
import type { TableSchema } from '@/core/schema/SchemaService';
import { formulaLanguage, functionCompletions, queryLanguage } from './completions.utils';

const sales: TableSchema = {
  dbName: 'sample_v2',
  name: 'sales',
  displayName: 'Sales',
  columns: [
    { name: 'total_profit', displayName: 'Total Profit', type: 'double' },
    { name: 'Order Date', displayName: 'Order Date', type: 'datetime' }
  ]
};
const orders: TableSchema = { dbName: 'sample_v2', name: 'order items', columns: [{ name: 'total_profit', displayName: 'total_profit', type: 'double' }] };
const sum = { name: 'SUM', title: 'SUM(expr)', description: 'Adds up' };

describe('functionCompletions', () => {
  it('suggests each function by name with its signature', () => {
    expect(functionCompletions([sum, { name: 'NOW' }])).toEqual([
      { label: 'SUM', insertText: 'SUM', kind: 'function', detail: 'SUM(expr)', documentation: 'Adds up' },
      { label: 'NOW', insertText: 'NOW', kind: 'function', detail: undefined, documentation: undefined }
    ]);
  });
});

describe('formulaLanguage', () => {
  it('writes a calculated column’s fields as [Display Name]', () => {
    const language = formulaLanguage('calculated', sales, [sum]);
    expect(language.completions.filter(spec => spec.kind === 'field').map(spec => spec.insertText)).toEqual(['[Total Profit]', '[Order Date]']);
    expect(language.highlight).toEqual({ functions: ['SUM'], fields: [] });
  });

  it('writes a measure’s fields by name, quoted when needed', () => {
    const language = formulaLanguage('measure', sales, [sum]);
    expect(language.completions.filter(spec => spec.kind === 'field')).toEqual([
      { label: 'total_profit', insertText: 'total_profit', kind: 'field', detail: 'sample_v2.Sales', documentation: 'Column Total Profit' },
      { label: 'Order Date', insertText: '`Order Date`', kind: 'field', detail: 'sample_v2.Sales', documentation: 'Column Order Date' }
    ]);
    expect(language.highlight.fields).toEqual(['total_profit', 'Order Date']);
  });
});

describe('queryLanguage', () => {
  it('suggests the tables with their database, and each column name once', () => {
    const language = queryLanguage('sample_v2', [sales, orders], [sum]);
    expect(language.completions.filter(spec => spec.kind === 'table').map(spec => spec.insertText)).toEqual(['sample_v2.sales', 'sample_v2.`order items`']);
    expect(language.completions.filter(spec => spec.kind === 'field').map(spec => spec.label)).toEqual(['total_profit', 'Order Date']);
    expect(language.highlight).toEqual({ functions: ['SUM'], fields: ['total_profit', 'Order Date'] });
  });

  it('has only the functions without tables', () => {
    expect(queryLanguage('db', [], []).completions).toEqual([]);
  });
});
