import { describe, expect, it, vi } from 'vitest';
import type { SchemaEditService } from '@/core/schema/SchemaEditService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { updateViewQuery } from './updateViewQuery';

const view: TableSchema = {
  dbName: 'sample_v2',
  name: 'cb8_tmp_view',
  tableType: 'view',
  columns: [{ name: 'Units_Sold', displayName: 'Units_Sold', type: 'int32' }],
  expressionColumns: [{ name: 'avg_rev', displayName: 'Avg Rev', type: 'double', expression: 'avg(Total_Revenue)', description: 'Measurement Field' }],
  calculatedColumns: [{ name: 'double_units', displayName: 'Double Units', type: 'int64', expression: 'Units_Sold * 2' }]
};
const overridden: TableSchema = { ...view, expressionColumns: undefined, calculatedColumns: undefined };

function fakeEdit(overrides: Partial<SchemaEditService> = {}): SchemaEditService {
  return {
    detectExpressionType: vi.fn<SchemaEditService['detectExpressionType']>(async (_table, kind) => (kind === 'measure' ? 'double' : 'int64')),
    createColumn: vi.fn<SchemaEditService['createColumn']>(async (_table, kind, column) => ({ ...overridden, [kind === 'measure' ? 'expressionColumns' : 'calculatedColumns']: [column] })),
    updateColumn: vi.fn<SchemaEditService['updateColumn']>(),
    deleteColumn: vi.fn<SchemaEditService['deleteColumn']>(),
    updateTableQuery: vi.fn<SchemaEditService['updateTableQuery']>(async () => overridden),
    dropTable: vi.fn<SchemaEditService['dropTable']>(),
    ...overrides
  };
}

describe('updateViewQuery', () => {
  it('overrides the view, then creates its measures and calculated columns again', async () => {
    const edit = fakeEdit();

    const result = await updateViewQuery(edit, view, '  select Units_Sold, Total_Revenue from sample_v2.sales ');

    expect(edit.updateTableQuery).toHaveBeenCalledWith(view, 'select Units_Sold, Total_Revenue from sample_v2.sales');
    expect(edit.detectExpressionType).toHaveBeenNthCalledWith(1, view, 'measure', 'avg(Total_Revenue)');
    expect(edit.createColumn).toHaveBeenNthCalledWith(1, view, 'measure', { name: 'avg_rev', displayName: 'Avg Rev', type: 'double', expression: 'avg(Total_Revenue)', description: 'Measurement Field' });
    expect(edit.createColumn).toHaveBeenNthCalledWith(2, view, 'calculated', { name: 'double_units', displayName: 'Double Units', type: 'int64', expression: 'Units_Sold * 2', description: undefined });
    expect(result.lost).toEqual([]);
    expect(result.table.calculatedColumns).toHaveLength(1);
  });

  it('reports the columns whose formula no longer runs', async () => {
    const edit = fakeEdit({
      detectExpressionType: vi.fn<SchemaEditService['detectExpressionType']>(async (_table, kind) => {
        if (kind === 'measure') throw new Error("Unknown column 'Total_Revenue'");
        return 'int64';
      })
    });

    const result = await updateViewQuery(edit, view, 'select Units_Sold from sample_v2.sales');

    expect(result.lost).toEqual(['Avg Rev']);
    expect(edit.createColumn).toHaveBeenCalledTimes(1);
  });

  it('fails without touching the columns when the query is refused', async () => {
    const edit = fakeEdit({ updateTableQuery: vi.fn<SchemaEditService['updateTableQuery']>(async () => Promise.reject(new Error("Unknown column 'nope'"))) });

    await expect(updateViewQuery(edit, view, 'select nope')).rejects.toThrow("Unknown column 'nope'");
    expect(edit.createColumn).not.toHaveBeenCalled();
  });

  it('only overrides a view without measures or calculated columns', async () => {
    const edit = fakeEdit();
    await expect(updateViewQuery(edit, overridden, 'select 1')).resolves.toEqual({ table: overridden, lost: [] });
    expect(edit.detectExpressionType).not.toHaveBeenCalled();
  });
});
