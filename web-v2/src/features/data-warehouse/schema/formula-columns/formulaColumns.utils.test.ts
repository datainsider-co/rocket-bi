import { describe, expect, it } from 'vitest';
import type { TableSchema } from '@/core/schema/SchemaService';
import { findFormulaColumn, formulaTabTextsOf, kindOfRole, SCHEMA_TABLE_ACTIONS, treeColumnActionsOf } from './formulaColumns.utils';

const table: TableSchema = {
  dbName: 'db',
  name: 't',
  columns: [{ name: 'n', displayName: 'N', type: 'int32' }],
  expressionColumns: [{ name: 'total_n', displayName: 'Total N', type: 'int64', expression: 'sum(n)' }],
  calculatedColumns: [{ name: 'n2', displayName: 'N2', type: 'int64', expression: 'n * 2' }]
};

describe('SCHEMA_TABLE_ACTIONS', () => {
  it("offers v1's table menu", () => {
    expect(SCHEMA_TABLE_ACTIONS.map(action => action.key)).toEqual(['addCalculated', 'addMeasure', 'delete']);
  });
});

describe('kindOfRole', () => {
  it.each([
    ['measure', 'measure'],
    ['calculated', 'calculated'],
    ['column', undefined]
  ] as const)('%s -> %s', (role, kind) => {
    expect(kindOfRole(role)).toBe(kind);
  });
});

describe('treeColumnActionsOf', () => {
  it('edits and deletes measures and calculated columns only', () => {
    expect(treeColumnActionsOf('measure').map(action => action.label)).toEqual(['Edit Measure', 'Delete Measure']);
    expect(treeColumnActionsOf('calculated').map(action => action.key)).toEqual(['edit', 'delete']);
    expect(treeColumnActionsOf('column')).toEqual([]);
  });
});

describe('findFormulaColumn', () => {
  it('looks in the columns of the kind', () => {
    expect(findFormulaColumn(table, 'measure', 'total_n')?.displayName).toBe('Total N');
    expect(findFormulaColumn(table, 'calculated', 'total_n')).toBeUndefined();
    expect(findFormulaColumn({ dbName: 'db', name: 't', columns: [] }, 'measure', 'x')).toBeUndefined();
  });
});

describe('formulaTabTextsOf', () => {
  it('words each kind', () => {
    expect(formulaTabTextsOf('measure').add).toBe('Add Measure');
    expect(formulaTabTextsOf('calculated').empty).toBe('This table has no calculated fields');
  });
});
