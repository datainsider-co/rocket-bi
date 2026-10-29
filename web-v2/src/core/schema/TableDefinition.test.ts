import { describe, expect, it } from 'vitest';
import {
  columnDefinitionFromJson,
  columnDefinitionToJson,
  newColumn,
  newTable,
  tableDefinitionFromJson,
  tableDefinitionToJson,
  type ColumnDefinition
} from './TableDefinition';
import fixture from './warehouse.fixture.json';

const products = tableDefinitionFromJson(fixture.tableGet.response);

function column(name: string): ColumnDefinition {
  const found = products.columns.find(item => item.name === name);
  if (!found) throw new Error(`no column ${name}`);
  return found;
}

describe('tableDefinitionFromJson', () => {
  it('reads a table and its columns', () => {
    expect(products).toMatchObject({ dbName: 'dw0_probe', name: 'products', displayName: 'products', tableType: 'default', status: 'Normal', query: undefined });
    expect(column('name')).toMatchObject({
      displayName: 'Tên sản phẩm',
      type: 'string',
      description: 'product name',
      isNullable: true,
      defaultValue: 'none'
    });
    expect(column('id')).toMatchObject({ type: 'int64', isNullable: false, description: '', defaultValue: undefined });
  });

  it("reads a view's query", () => {
    const view = tableDefinitionFromJson(fixture.fromQueryView.response);
    expect(view).toMatchObject({ tableType: 'view', query: 'select id, name, qty from dw0_probe.products where qty > 1' });
  });

  it('falls back to the given database and the name', () => {
    expect(tableDefinitionFromJson({ name: 't' }, 'db')).toMatchObject({ dbName: 'db', displayName: 't', tableType: 'default', status: 'Normal' });
  });
});

describe('tableDefinitionToJson', () => {
  it('sends back an unchanged table as the server sent it', () => {
    expect(tableDefinitionToJson(products)).toStrictEqual(fixture.tableGet.response);
  });

  it('keeps what v2 does not model', () => {
    const json = { ...fixture.tableGet.response, primary_keys: ['id'], order_bys: ['id'] };
    expect(tableDefinitionToJson(tableDefinitionFromJson(json))).toMatchObject({ primary_keys: ['id'], order_bys: ['id'] });
  });

  it('writes the edits of the DW0 update', () => {
    const edited = {
      ...products,
      columns: [
        ...products.columns.map(item => {
          if (item.name === 'name') return { ...item, displayName: 'Name edited', description: 'edited desc' };
          if (item.name === 'price') return { ...item, type: 'string' };
          return item;
        }),
        { ...newColumn('qty', 'int32'), displayName: 'Qty', defaultValue: 0 }
      ]
    };
    const json = tableDefinitionToJson(edited);
    const columns = json['columns'] as unknown[];
    expect(columns).toEqual(fixture.tableUpdate.request.table_schema.columns.map(item => expect.objectContaining(item)));
  });
});

describe('columnDefinitionToJson', () => {
  const date = columnDefinitionFromJson({
    class_name: 'datetime',
    name: 'created_at',
    display_name: 'Created At',
    input_as_timestamp: false,
    input_formats: [],
    is_nullable: true,
    is_encrypted: false
  });

  it('keeps type-specific keys while the type stays', () => {
    expect(columnDefinitionToJson(date)).toMatchObject({ input_formats: [], input_as_timestamp: false });
  });

  it('drops type-specific keys when the type changes', () => {
    expect(columnDefinitionToJson({ ...date, type: 'string' })).toStrictEqual({
      class_name: 'string',
      name: 'created_at',
      display_name: 'Created At',
      is_nullable: true,
      is_encrypted: false
    });
  });

  it('leaves out a cleared description and default value', () => {
    const named = columnDefinitionFromJson(fixture.tableGet.response.columns[1]);
    const json = columnDefinitionToJson({ ...named, description: '', defaultValue: undefined });
    expect(json).not.toHaveProperty('description');
    expect(json).not.toHaveProperty('default_value');
  });

  it('writes a new column', () => {
    expect(columnDefinitionToJson(newColumn('note', 'string'))).toStrictEqual({
      class_name: 'string',
      name: 'note',
      display_name: 'note',
      is_nullable: true
    });
  });
});

describe('newTable', () => {
  it('writes the columns of a table to create', () => {
    const table = newTable('dw0_probe', 'products', 'Products', [newColumn('id', 'int64')]);
    expect(tableDefinitionToJson(table)).toStrictEqual({
      db_name: 'dw0_probe',
      name: 'products',
      display_name: 'Products',
      columns: [{ class_name: 'int64', name: 'id', display_name: 'id', is_nullable: true }]
    });
  });
});
