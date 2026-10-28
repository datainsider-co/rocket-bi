import { describe, expect, it } from 'vitest';
import type { TableSchema } from '@/core/schema/SchemaService';
import {
  canUpdateByQuery,
  columnActionsOf,
  columnsOfKind,
  deleteColumnMessage,
  expressionColumnOf,
  expressionColumnsOf,
  expressionOf,
  formulaDialogTextsOf,
  formulaFieldSchema,
  formulaFieldValuesOf,
  lostColumnsMessage,
  removedFieldsMessage,
  tableActionsOf,
  takenNamesOf
} from './fieldActions.utils';
import { FormulaError } from './formula.utils';

const measure = { name: 'avg_rev', displayName: 'Avg Rev', type: 'double', expression: 'sum(Total_Revenue) / count(*)', description: 'Measurement Field' };
const calculated = { name: 'double_units', displayName: 'Double Units', type: 'int64', expression: 'Units_Sold * 2' };
const view: TableSchema = {
  dbName: 'sample_v2',
  name: 'cb8_tmp_view',
  tableType: 'view',
  query: 'select Units_Sold, Total_Revenue from sample_v2.sales',
  columns: [
    { name: 'Units_Sold', displayName: 'Units Sold', type: 'int32' },
    { name: 'Total_Revenue', displayName: 'Total_Revenue', type: 'double' }
  ],
  expressionColumns: [measure],
  calculatedColumns: [calculated]
};

describe('canUpdateByQuery', () => {
  it.each([
    [{ dbName: 'db', tableType: 'view' }, true],
    [{ dbName: 'db', tableType: 'default' }, false],
    [{ dbName: 'db' }, false],
    // An ad hoc view has no database to save into.
    [{ dbName: '', tableType: 'view' }, false]
  ])('tells whether %j has a query to change', (table, expected) => {
    expect(canUpdateByQuery(table)).toBe(expected);
  });
});

describe('tableActionsOf', () => {
  it('offers the query only on a view, and no Delete Table (v1)', () => {
    expect(tableActionsOf(view).map(item => item.key)).toEqual(['addCalculated', 'addMeasure', 'updateQuery']);
    expect(tableActionsOf({ dbName: 'db', tableType: 'default' }).map(item => item.key)).toEqual(['addCalculated', 'addMeasure']);
  });
});

describe('columnActionsOf', () => {
  it('name the kind', () => {
    expect(columnActionsOf('measure').map(item => item.label)).toEqual(['Edit Measure', 'Delete Measure']);
    expect(columnActionsOf('calculated').map(item => item.label)).toEqual(['Edit Calculated Field', 'Delete Calculated Field']);
  });
});

describe('columnsOfKind', () => {
  it('reads the list of the kind, empty when missing', () => {
    expect(columnsOfKind(view, 'measure')).toEqual([measure]);
    expect(columnsOfKind(view, 'calculated')).toEqual([calculated]);
    expect(columnsOfKind({ ...view, calculatedColumns: undefined }, 'calculated')).toEqual([]);
  });
});

describe('takenNamesOf', () => {
  it('collects every name of the table in lower case', () => {
    expect([...takenNamesOf(view)]).toEqual(['units_sold', 'total_revenue', 'avg_rev', 'double_units']);
  });
});

describe('formulaFieldSchema', () => {
  const create = formulaFieldSchema(takenNamesOf(view));
  const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) => result.error?.issues.map(issue => issue.message) ?? [];

  it('needs a name and a formula', () => {
    expect(messages(create.safeParse({ displayName: ' ', formula: '' }))).toEqual(['Column name is required.', 'Formula field is required.']);
  });

  it('refuses a new name that gives no column name or one in use, whatever the case', () => {
    expect(messages(create.safeParse({ displayName: '利润', formula: '1' }))).toEqual(['Column name needs a latin letter or a digit.']);
    expect(messages(create.safeParse({ displayName: 'Units Sold', formula: '1' }))).toEqual(['A column with this name already exists in the table.']);
    expect(create.safeParse({ displayName: 'Triple Units', formula: '[Units Sold] * 3' }).success).toBe(true);
  });

  it('lets an edited column keep its name', () => {
    expect(formulaFieldSchema().safeParse({ displayName: 'Double Units', formula: '1' }).success).toBe(true);
  });

  it('trims the values', () => {
    expect(create.parse({ displayName: ' Triple ', formula: ' 1 ' })).toEqual({ displayName: 'Triple', formula: '1' });
  });
});

describe('formulaFieldValuesOf', () => {
  it('starts a new column empty', () => {
    expect(formulaFieldValuesOf('measure', view, undefined)).toEqual({ displayName: '', formula: '' });
  });

  it('writes a calculated column by display name, a measure as stored', () => {
    expect(formulaFieldValuesOf('calculated', view, calculated)).toEqual({ displayName: 'Double Units', formula: '[Units Sold] * 2' });
    expect(formulaFieldValuesOf('measure', view, measure)).toEqual({ displayName: 'Avg Rev', formula: 'sum(Total_Revenue) / count(*)' });
    expect(formulaFieldValuesOf('measure', view, { ...measure, expression: undefined }).formula).toBe('');
  });
});

describe('expressionOf', () => {
  it('turns a calculated column’s display names into names, and keeps a measure', () => {
    expect(expressionOf('calculated', view, ' [Units Sold] * 3 ')).toBe('Units_Sold * 3');
    expect(expressionOf('measure', view, ' sum([Units Sold]) ')).toBe('sum([Units Sold])');
    expect(() => expressionOf('calculated', view, '[Nope]')).toThrow(FormulaError);
  });
});

describe('expressionColumnOf', () => {
  it('names a new column after its display name, with v1’s description', () => {
    expect(expressionColumnOf('calculated', { displayName: ' Triple Units ', formula: '' }, 'Units_Sold * 3', 'int64', undefined)).toEqual({
      name: 'triple_units',
      displayName: 'Triple Units',
      type: 'int64',
      expression: 'Units_Sold * 3',
      description: 'Calculated field'
    });
    expect(expressionColumnOf('measure', { displayName: 'M', formula: '' }, 'sum(x)', 'double', undefined).description).toBe('Measurement Field');
  });

  it('keeps the edited column’s name and description', () => {
    expect(expressionColumnOf('measure', { displayName: 'Average Revenue', formula: '' }, 'avg(Total_Revenue)', 'double', measure)).toEqual({
      name: 'avg_rev',
      displayName: 'Average Revenue',
      type: 'double',
      expression: 'avg(Total_Revenue)',
      description: 'Measurement Field'
    });
  });
});

describe('confirmation messages', () => {
  it('name the column by display name', () => {
    expect(deleteColumnMessage('measure', measure)).toBe('Are you sure you want to delete measure "Avg Rev"?');
    expect(deleteColumnMessage('calculated', calculated)).toBe('Are you sure you want to delete calculated field "Double Units"?');
  });
});

describe('expressionColumnsOf', () => {
  it('lists the measures, then the calculated columns', () => {
    expect(expressionColumnsOf(view)).toEqual([
      { kind: 'measure', column: measure },
      { kind: 'calculated', column: calculated }
    ]);
    expect(expressionColumnsOf({ ...view, expressionColumns: undefined, calculatedColumns: undefined })).toEqual([]);
  });
});

describe('removedFieldsMessage and lostColumnsMessage', () => {
  it('count what was removed or lost', () => {
    expect(removedFieldsMessage(1, 'sales')).toBe('Removed 1 field of the chart that no longer exists in sales.');
    expect(removedFieldsMessage(3, 'sales')).toBe('Removed 3 fields of the chart that no longer exist in sales.');
    expect(lostColumnsMessage(['Avg Rev'])).toBe('Could not keep "Avg Rev": the new query lacks what its formula uses.');
    expect(lostColumnsMessage(['A', 'B'])).toBe('Could not keep "A", "B": the new query lacks what their formulas use.');
  });
});

describe('formulaDialogTextsOf', () => {
  it('names the kind and the mode', () => {
    expect(formulaDialogTextsOf('measure', false)).toMatchObject({ title: 'Create Measure', okText: 'Create' });
    expect(formulaDialogTextsOf('calculated', true)).toMatchObject({ title: 'Edit Calculated Field', okText: 'Update' });
    expect(formulaDialogTextsOf('calculated', true).placeholder).toContain('[');
  });
});
