import { describe, expect, it } from 'vitest';
import { tableDefinitionFromJson, tableDefinitionToJson } from '@/core/schema/TableDefinition';
import fixture from '@/core/schema/warehouse.fixture.json';
import {
  canEditSchema,
  changesType,
  columnValuesOf,
  createTableSchema,
  defaultValueFor,
  defaultValueKindOf,
  formatDefaultValue,
  hasTime,
  newColumnValues,
  schemaFormSchema,
  schemaFormValuesOf,
  tableNameError,
  takenColumnNames,
  toColumnDefinitions,
  toTableName,
  withType,
  type ColumnValues,
  type SchemaFormValues
} from './schemaEdit.utils';

const products = tableDefinitionFromJson(fixture.tableGet.response);
const values = schemaFormValuesOf(products.columns);
const row = (patch: Partial<ColumnValues>): ColumnValues => ({ ...newColumnValues(), ...patch });

describe('defaultValueKindOf', () => {
  it.each([
    ['bool', 'bool'],
    ['int32', 'number'],
    ['double', 'number'],
    ['string', 'text'],
    ['date', 'date'],
    ['datetime64', 'date'],
    ['array', 'none']
  ])('%s takes %s', (type, kind) => {
    expect(defaultValueKindOf(type)).toBe(kind);
  });
});

describe('defaultValueFor', () => {
  it.each([
    ['bool', true, true],
    ['bool', 'true', undefined],
    ['number', 5, 5],
    ['number', '5.5', 5.5],
    ['number', 'five', undefined],
    ['number', ' ', undefined],
    ['text', 5, '5'],
    ['text', undefined, undefined],
    ['date', 1793500000000, 1793500000000],
    ['date', '2026-11-01T00:00:00Z', 1793491200000],
    ['date', 'soon', undefined],
    ['none', 'x', 'x']
  ] as const)('%s takes %s as %s', (kind, value, expected) => {
    expect(defaultValueFor(kind, value)).toBe(expected);
  });
});

describe('formatDefaultValue', () => {
  const at = new Date(2026, 10, 1, 9, 26, 40).getTime();

  it('shows a date by its type', () => {
    expect(formatDefaultValue('datetime', at)).toBe('2026-11-01 09:26:40');
    expect(formatDefaultValue('date', at)).toBe('2026-11-01');
    expect(hasTime('datetime64')).toBe(true);
  });

  it('shows other values as they are, and -- for none', () => {
    expect(formatDefaultValue('int32', 0)).toBe('0');
    expect(formatDefaultValue('bool', false)).toBe('false');
    expect(formatDefaultValue('string', '')).toBe('--');
    expect(formatDefaultValue('string', undefined)).toBe('--');
  });
});

describe('schemaFormValuesOf', () => {
  it("holds the table's columns in order", () => {
    expect(values.columns.map(column => column.name)).toEqual(['id', 'name', 'price', 'created_at', 'active']);
    expect(values.columns[1]).toEqual({
      name: 'name',
      displayName: 'Tên sản phẩm',
      type: 'string',
      isNullable: true,
      description: 'product name',
      defaultValue: 'none',
      isNew: false
    });
  });

  it('starts a table without columns on one new string column', () => {
    expect(schemaFormValuesOf([])).toEqual({ columns: [newColumnValues()] });
    expect(newColumnValues()).toMatchObject({ type: 'string', isNullable: true, isNew: true });
  });
});

describe('withType', () => {
  it('keeps the default value for the same kind of type', () => {
    expect(withType(row({ type: 'int32', defaultValue: 5 }), 'int64')).toMatchObject({ type: 'int64', defaultValue: 5 });
  });

  it('drops the default value for another kind', () => {
    expect(withType(row({ type: 'string', defaultValue: 'x' }), 'int32')).toMatchObject({ type: 'int32', defaultValue: undefined });
  });

  it('leaves the column alone', () => {
    const column = row({ defaultValue: 'x' });
    withType(column, 'int32');
    expect(column.defaultValue).toBe('x');
  });
});

describe('schemaFormSchema', () => {
  const schema = schemaFormSchema(takenColumnNames(products));
  const issues = (form: SchemaFormValues) => {
    const result = schema.safeParse(form);
    return result.success ? [] : result.error.issues.map(issue => [issue.path.join('.'), issue.message]);
  };

  it("accepts the table's columns as they are", () => {
    expect(issues(values)).toEqual([]);
  });

  it('checks the name of new columns only', () => {
    const form = { columns: [...values.columns, row({ name: '' }), row({ name: '1st' }), row({ name: 'Price' }), row({ name: 'note' }), row({ name: 'NOTE' })] };
    expect(issues(form)).toEqual([
      ['columns.5.name', 'Column name is required'],
      ['columns.6.name', 'Use letters, digits and _, not starting with a digit'],
      ['columns.7.name', 'A column with this name already exists'],
      ['columns.9.name', 'A column with this name already exists']
    ]);
  });

  it('limits texts and needs a column', () => {
    expect(issues({ columns: [row({ name: 'a', description: 'x'.repeat(256) })] })).toEqual([['columns.0.description', 'Description must be at most 255 characters']]);
    expect(issues({ columns: [] })).toEqual([['columns', 'A table needs a column']]);
  });
});

describe('takenColumnNames', () => {
  it('holds every kind of column, lower case', () => {
    const json = { columns: [{ name: 'Qty' }], expression_columns: [{ name: 'total' }], calculated_columns: [{ name: 'twice' }] };
    expect(takenColumnNames({ json })).toEqual(new Set(['qty', 'total', 'twice']));
    expect(takenColumnNames({ json: {} })).toEqual(new Set());
  });
});

describe('toColumnDefinitions', () => {
  it('edits each column on the JSON it was read from', () => {
    const edited = { columns: values.columns.map((column, index) => (index === 1 ? { ...column, displayName: ' Name ', description: '', defaultValue: '' } : column)) };
    const columns = toColumnDefinitions(edited, products.columns);

    expect(columns[1]).toMatchObject({ name: 'name', displayName: 'Name', description: '', defaultValue: undefined, json: products.columns[1]!.json });
    expect(tableDefinitionToJson({ ...products, columns: toColumnDefinitions(values, products.columns) })).toStrictEqual(fixture.tableGet.response);
  });

  it('adds new columns, shown by their name without a display name', () => {
    const form = { columns: [...values.columns, row({ name: ' qty ', type: 'int32', defaultValue: 0 })] };
    expect(toColumnDefinitions(form, products.columns).at(-1)).toEqual({
      name: 'qty',
      displayName: 'qty',
      type: 'int32',
      description: '',
      isNullable: true,
      defaultValue: 0,
      json: {}
    });
  });
});

describe('changesType', () => {
  it('tells a changed type of an existing column', () => {
    const changed = { columns: values.columns.map((column, index) => (index === 0 ? withType(column, 'string') : column)) };
    expect(changesType(changed, products.columns)).toBe(true);
  });

  it('ignores new columns and other edits', () => {
    expect(changesType({ columns: [...values.columns, row({ name: 'x', type: 'int32' })] }, products.columns)).toBe(false);
    expect(changesType({ columns: [{ ...columnValuesOf(products.columns[0]!), isNullable: true }] }, products.columns)).toBe(false);
  });
});

describe('canEditSchema', () => {
  it('lets tables of data be edited, not views', () => {
    expect(canEditSchema(products)).toBe(true);
    expect(canEditSchema({ tableType: 'materialized' })).toBe(true);
    expect(canEditSchema({ tableType: 'view' })).toBe(false);
  });
});

describe('toTableName', () => {
  it.each([
    ['Đơn hàng 2026', 'don_hang_2026'],
    ['  Sales / Orders ', 'sales_orders'],
    ['***', '']
  ])('%s -> %s', (typed, name) => {
    expect(toTableName(typed)).toBe(name);
  });
});

describe('tableNameError', () => {
  it.each([
    ['', 'Table name is required'],
    ['x'.repeat(251), 'Max length is 250 characters'],
    ['a/b', 'Table name can\'t contain any of the following characters: \\ / ? * " < > : |'],
    ['---', 'Use letters or digits'],
    ['Products', 'Table products already exists']
  ])('%s: %s', (typed, message) => {
    expect(tableNameError(typed, ['products'])).toBe(message);
  });

  it('accepts a new name', () => {
    expect(tableNameError('Orders 2026', ['products'])).toBeUndefined();
  });
});

describe('createTableSchema', () => {
  it('checks the typed name', () => {
    expect(createTableSchema(['products']).safeParse({ name: 'products' }).success).toBe(false);
    expect(createTableSchema(['products']).safeParse({ name: 'orders' }).success).toBe(true);
  });
});
