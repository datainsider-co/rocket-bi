import { describe, expect, it } from 'vitest';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import type { TableSchema } from '@/core/schema/SchemaService';
import stored from '@/core/chart-builder/builder.fixture.json';
import {
  columnNameOfNode,
  controlIconOf,
  controlLookOf,
  expressionKindOf,
  fieldLookOf,
  fieldRefsOf,
  initialExpanded,
  opened,
  mainDatabaseOf,
  MAX_SEARCH_TABLES,
  searchControls,
  searchTableNodes,
  tableNodesOf,
  tablesIn,
  toggled,
  viewQueryOf,
  type FieldNode,
  type TableNode
} from './fieldTree.utils';

const sales: TableSchema = {
  dbName: 'sample_v2',
  name: 'sales',
  displayName: 'Sales',
  columns: [
    { name: 'region', displayName: 'region', type: 'string' },
    { name: 'country', displayName: 'country', type: 'string' },
    { name: 'items', displayName: 'items', type: 'nested', nestedColumns: [{ name: 'qty', displayName: 'qty', type: 'int32' }] }
  ],
  expressionColumns: [{ name: 'revenue', displayName: 'Revenue', type: 'double', expression: 'sum(price)' }],
  calculatedColumns: [{ name: 'margin', displayName: 'Margin', type: 'double', expression: 'price - cost' }]
};

const orders: TableSchema = { dbName: 'sample_v2', name: 'orders', columns: [{ name: 'id', displayName: 'id', type: 'int64' }] };

const adhoc: TableSchema = { dbName: '', name: 'tbl_1', tableType: 'view', query: 'select 1 as id', columns: [{ name: 'id', displayName: 'id', type: 'int64' }] };

const fieldAt = (node: TableNode | undefined, index: number): FieldNode => {
  const item = node?.items[index];
  if (item?.kind !== 'field') throw new Error(`no field at ${index}`);
  return item;
};

describe('tableNodesOf', () => {
  const [ordersNode, salesNode] = tableNodesOf([sales, orders]);

  it('sorts tables and columns by title, measures and calculated columns last', () => {
    expect(ordersNode?.title).toBe('orders');
    expect(salesNode?.title).toBe('Sales');
    expect(salesNode?.items.map(item => item.title)).toEqual(['country', 'items', 'region', 'Revenue', 'Margin']);
  });

  it("drops a column as a table_field named by the table's title", () => {
    expect(fieldAt(salesNode, 0).dropped).toEqual({
      field: { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'country', field_type: 'string' },
      columnName: 'country',
      tableName: 'Sales',
      isNested: false
    });
  });

  it("drops a nested column's column by its quoted path, as nested", () => {
    const nested = salesNode?.items[1];
    if (nested?.kind !== 'nested') throw new Error('no nested column');
    expect(nested.fields[0]?.dropped).toMatchObject({ field: { field_name: '`items.qty`', field_type: 'int32' }, isNested: true });
  });

  it('drops measures and calculated columns with their expression', () => {
    expect(fieldAt(salesNode, 3)).toMatchObject({ role: 'measure', dropped: { field: { class_name: 'expression_field', field_name: 'revenue', expression: 'sum(price)' } } });
    expect(fieldAt(salesNode, 4)).toMatchObject({ role: 'calculated', dropped: { field: { class_name: 'calculated_field', expression: 'price - cost' } } });
  });

  it('drops an ad hoc column as a view_field', () => {
    expect(fieldAt(tableNodesOf([adhoc])[0], 0).dropped.field).toEqual({ class_name: 'view_field', view_name: 'tbl_1', field_name: 'id', field_type: 'int64' });
  });
});

describe('searchTableNodes', () => {
  const nodes = tableNodesOf([sales, orders]);

  it('keeps a matching table whole, the matching columns of the others', () => {
    expect(searchTableNodes(nodes, ' SAL ').map(node => [node.key, node.items.length])).toEqual([['sales', 5]]);
    expect(searchTableNodes(nodes, 'regi').map(node => [node.key, node.items.map(item => item.title)])).toEqual([['sales', ['region']]]);
    expect(searchTableNodes(nodes, 'nothing')).toEqual([]);
  });

  it('gives the nodes back for an empty keyword and caps the tables found', () => {
    expect(searchTableNodes(nodes, '  ')).toBe(nodes);
    const many = tableNodesOf(Array.from({ length: 30 }, (_, index) => ({ ...orders, name: `t${index}` })));
    expect(searchTableNodes(many, 't')).toHaveLength(MAX_SEARCH_TABLES);
  });
});

describe('chart controls', () => {
  const control = (title: string, infoType: ChartControl['infoType'], chartType = 'pie'): ChartControl => ({ id: 1, title, chartType, infoType, data: {} });

  it('searches by title', () => {
    expect(searchControls([control('Region', 'Normal'), control('Date', 'Normal')], 'reg').map(item => item.title)).toEqual(['Region']);
  });

  it("shows a chart type's icon, the generic one for a function controller", () => {
    expect(controlIconOf(control('a', 'Normal', 'Donut'))).toBe('/chart-builder/charts/ic_donut.svg');
    expect(controlIconOf(control('a', 'FunctionController', 'tab_filter'))).toBe('/chart-builder/charts/chart_control.svg');
  });

  it('shows a control as the tree shows it', () => {
    expect(controlLookOf(control('Donut', 'Normal', 'Donut'))).toEqual({ title: 'Donut', icon: { kind: 'image', src: '/chart-builder/charts/ic_donut.svg' }, italic: false });
  });
});

describe('fieldLookOf', () => {
  const field = (className: string, type = 'Int32') => ({ class_name: className, field_name: 'f', field_type: type });

  it('shows a column by its type, measures and calculated columns in italics', () => {
    expect(fieldLookOf(field('table_field'), 'Units')).toEqual({ title: 'Units', icon: { kind: 'type', type: 'Int32' }, italic: false });
    expect(fieldLookOf(field('calculated_field'), 'Double')).toEqual({ title: 'Double', icon: { kind: 'type', type: 'Int32' }, italic: true });
    expect(fieldLookOf(field('expression_field'), 'Avg')).toEqual({ title: 'Avg', icon: { kind: 'measure' }, italic: true });
  });

  it('shows a chart control dropped as a field by the generic control icon', () => {
    expect(fieldLookOf(field('chart_control_field', ''), 'Tab')).toEqual({ title: 'Tab', icon: { kind: 'image', src: '/chart-builder/charts/chart_control.svg' }, italic: false });
  });
});

describe('fieldRefsOf / mainDatabaseOf / tablesIn', () => {
  it('finds the fields a stored setting uses', () => {
    const refs = fieldRefsOf(stored.widgets[0]?.setting);
    expect(refs.length).toBeGreaterThan(3);
    expect(mainDatabaseOf(refs)).toBe('sample_v2');
    expect(tablesIn(refs, 'sample_v2')).toEqual(['sales']);
  });

  it('picks the most used database, the first one on a tie, never an ad hoc one', () => {
    const ref = (dbName: string, tblName = 't') => ({ dbName, tblName });
    expect(mainDatabaseOf([ref('a'), ref('b'), ref('b')])).toBe('b');
    expect(mainDatabaseOf([ref('a'), ref('b')])).toBe('a');
    expect(mainDatabaseOf([ref(''), ref('')])).toBeUndefined();
    expect(mainDatabaseOf([])).toBeUndefined();
  });
});

describe('initialExpanded / toggled', () => {
  const nodes = tableNodesOf([sales, orders]);

  it('opens the tables in use, else the first one', () => {
    expect([...initialExpanded(nodes, ['sales', 'gone'])]).toEqual(['sales']);
    expect([...initialExpanded(nodes, [])]).toEqual(['orders']);
    expect(initialExpanded([], []).size).toBe(0);
  });

  it('toggles a table without changing the set it is given', () => {
    const expanded = new Set(['orders']);
    expect([...toggled(expanded, 'sales')]).toEqual(['orders', 'sales']);
    expect([...toggled(expanded, 'orders')]).toEqual([]);
    expect([...expanded]).toEqual(['orders']);
  });
});

describe('viewQueryOf', () => {
  it('reads the SQL of an ad hoc view only', () => {
    expect(viewQueryOf([sales, adhoc], 'tbl_1')).toBe('select 1 as id');
    expect(viewQueryOf([sales, { ...adhoc, dbName: 'db' }], 'tbl_1')).toBeUndefined();
    expect(viewQueryOf([sales], 'sales')).toBeUndefined();
  });
});

describe('expressionKindOf and columnNameOfNode', () => {
  it('give the kind and column of measures and calculated columns only', () => {
    const items = tableNodesOf([sales])[0]!.items.filter((item): item is FieldNode => item.kind === 'field');
    expect(items.map(item => [columnNameOfNode(item), expressionKindOf(item)])).toEqual([
      ['country', undefined],
      ['region', undefined],
      ['revenue', 'measure'],
      ['margin', 'calculated']
    ]);
  });
});

describe('opened', () => {
  it('opens a closed table and keeps an open one', () => {
    const expanded = new Set(['sales']);
    expect(opened(expanded, 'sales')).toBe(expanded);
    expect([...opened(expanded, 'orders')]).toEqual(['sales', 'orders']);
  });
});
