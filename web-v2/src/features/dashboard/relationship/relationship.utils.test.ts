import { describe, expect, it } from 'vitest';
import { TableField, ViewField } from '@/core/relationship/Field';
import { SqlView, TableView } from '@/core/relationship/QueryView';
import { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import { RELATIONSHIP_JSON } from './relationship.fixtures';
import {
  ADHOC_DB_NAME,
  connectionKey,
  defaultTablePosition,
  isDirty,
  makeConnection,
  tableIdOf,
  tableNameOf,
  tablePositionKey,
  toEditorState,
  toNodePositions,
  toRelationshipInfo,
  toRelationships,
  toTablePositions,
  viewTableId,
  type RelationshipTable,
  type TableColumns
} from './relationship.utils';

const SALES = new TableView({ db_name: 'sample_v2', tbl_name: 'sales', alias_name: 'tbl_1' });
const ORDERS = new SqlView({ alias_name: 'orders', query: { query: 'select order_id from sample_v2.sales' } });
const SALES_ID = tableIdOf('sample_v2', 'sales');
const ORDERS_ID = tableIdOf(ADHOC_DB_NAME, 'orders');
const REGIONS_ID = tableIdOf(ADHOC_DB_NAME, 'regions');

const col = (name: string, type = 'string') => ({ name, type });

const COLUMNS: TableColumns = {
  [SALES_ID]: [col('country'), col('order_id', 'int64'), col('region')],
  [ORDERS_ID]: [col('order_id', 'int64'), col('order_date', 'datetime')],
  [REGIONS_ID]: [col('region'), col('country')]
};

function table(view: TableView | SqlView, columns = COLUMNS[viewTableId(view)] ?? []): RelationshipTable {
  return { id: viewTableId(view), ...tableNameOf(view), view, columns };
}

describe('tableNameOf', () => {
  it('uses the database and table of a table view', () => {
    expect(tableNameOf(SALES)).toEqual({ dbName: 'sample_v2', tblName: 'sales' });
  });

  it('puts a SQL view under adhoc_analysis with its alias', () => {
    expect(tableNameOf(ORDERS)).toEqual({ dbName: 'adhoc_analysis', tblName: 'orders' });
  });
});

describe('tableIdOf', () => {
  it('tells apart names that join to the same text', () => {
    expect(tableIdOf('a.b', 'c')).not.toBe(tableIdOf('a', 'b.c'));
  });
});

describe('tablePositionKey', () => {
  it.each([
    ['sample_v2', 'sales', 'sampleV2Sales'],
    ['adhoc_analysis', 'orders', 'adhocAnalysisorders'],
    ['caas', 'user_profile', 'caasuserProfile'],
    ['', '', '']
  ])('%s + %s -> %s (lodash camelCase, as v1 stored it)', (db, tbl, key) => {
    expect(tablePositionKey(db, tbl)).toBe(key);
  });
});

describe('connectionKey', () => {
  it('is the same in both directions', () => {
    const a = { tableId: SALES_ID, column: 'order_id' };
    const b = { tableId: ORDERS_ID, column: 'order_id' };
    expect(connectionKey(a, b)).toBe(connectionKey(b, a));
  });

  it('differs per column', () => {
    const a = { tableId: SALES_ID, column: 'order_id' };
    expect(connectionKey(a, { tableId: ORDERS_ID, column: 'x' })).not.toBe(
      connectionKey(a, { tableId: ORDERS_ID, column: 'y' })
    );
  });
});

describe('defaultTablePosition', () => {
  it.each([
    [0, { left: 0, top: 0 }],
    [3, { left: 600, top: 0 }]
  ])('puts table %i along the top', (index, position) => {
    expect(defaultTablePosition(index)).toEqual(position);
  });
});

describe('toEditorState', () => {
  it('builds tables from the views and connections from the field pairs', () => {
    const { tables, connections } = toEditorState(new RelationshipInfo(RELATIONSHIP_JSON), COLUMNS);

    expect(tables.map(t => t.id)).toEqual([SALES_ID, ORDERS_ID, REGIONS_ID]);
    expect(tables[1]).toMatchObject({ dbName: 'adhoc_analysis', tblName: 'orders', columns: COLUMNS[ORDERS_ID] });
    expect(Object.values(connections)).toEqual([
      makeConnection({ tableId: SALES_ID, column: 'order_id' }, { tableId: ORDERS_ID, column: 'order_id' }),
      makeConnection({ tableId: SALES_ID, column: 'region' }, { tableId: REGIONS_ID, column: 'region' }),
      makeConnection({ tableId: SALES_ID, column: 'country' }, { tableId: REGIONS_ID, column: 'country' })
    ]);
  });

  it('draws a view listed twice once', () => {
    const info = RelationshipInfo.of([SALES, new TableView(SALES.toJson())], [], {});
    expect(toEditorState(info, COLUMNS).tables).toHaveLength(1);
  });

  it('gives a table without a loaded schema no columns', () => {
    const info = RelationshipInfo.of([SALES], [], {});
    expect(toEditorState(info, {}).tables[0]?.columns).toEqual([]);
  });

  it('adds a joined column the schema no longer has, with the field type', () => {
    const info = new RelationshipInfo(RELATIONSHIP_JSON);
    const { tables } = toEditorState(info, { ...COLUMNS, [ORDERS_ID]: [] });
    expect(tables[1]?.columns).toEqual([col('order_id', 'int64')]);
  });

  it('skips relationships to views that are not listed, and joins within one table', () => {
    const json = structuredClone(RELATIONSHIP_JSON);
    json.views = [json.views[0]!];
    const self = { ...json.relationships[0]!, second_view: json.relationships[0]!.first_view };
    const info = new RelationshipInfo({ ...json, relationships: [...json.relationships, self] });
    expect(toEditorState(info, COLUMNS).connections).toEqual({});
  });

  it('does not change the columns it was given', () => {
    const columns = { ...COLUMNS, [ORDERS_ID]: [] };
    toEditorState(new RelationshipInfo(RELATIONSHIP_JSON), columns);
    expect(columns[ORDERS_ID]).toEqual([]);
  });

  it('handles no views', () => {
    expect(toEditorState(new RelationshipInfo(), {})).toEqual({ tables: [], connections: {} });
  });
});

describe('toNodePositions', () => {
  it('uses saved positions by v1 key and defaults by index', () => {
    const tables = [table(SALES), table(ORDERS)];
    expect(toNodePositions(tables, { adhocAnalysisorders: { left: 5, top: 6 } })).toEqual({
      [SALES_ID]: { x: 0, y: 0 },
      [ORDERS_ID]: { x: 5, y: 6 }
    });
  });

  it('places the second unsaved table one step to the right', () => {
    expect(toNodePositions([table(SALES), table(ORDERS)], {})[ORDERS_ID]).toEqual({ x: 200, y: 0 });
  });
});

describe('isDirty', () => {
  const connection = makeConnection({ tableId: 'a', column: 'x' }, { tableId: 'b', column: 'y' });
  const other = makeConnection({ tableId: 'a', column: 'z' }, { tableId: 'b', column: 'y' });
  const initial = { connections: { [connection.key]: connection }, positions: { a: { x: 0, y: 0 } } };

  it('is false when nothing changed', () => {
    expect(isDirty(initial, { ...initial })).toBe(false);
  });

  it('is true when a connection was added', () => {
    expect(isDirty(initial, { ...initial, connections: { ...initial.connections, [other.key]: other } })).toBe(true);
  });

  it('is true when a connection was swapped for another', () => {
    expect(isDirty(initial, { ...initial, connections: { [other.key]: other } })).toBe(true);
  });

  it('is true when a connection was removed', () => {
    expect(isDirty(initial, { ...initial, connections: {} })).toBe(true);
  });

  it('is true when a table moved', () => {
    expect(isDirty(initial, { ...initial, positions: { a: { x: 1, y: 0 } } })).toBe(true);
  });

  it('is false when a table moved back', () => {
    expect(isDirty(initial, { ...initial, positions: { a: { x: 0, y: 0 } } })).toBe(false);
  });
});

describe('toRelationships', () => {
  const tables = [table(SALES), table(ORDERS)];

  it('groups connections of one table pair into one relationship', () => {
    const first = makeConnection({ tableId: SALES_ID, column: 'order_id' }, { tableId: ORDERS_ID, column: 'order_id' });
    const second = makeConnection({ tableId: SALES_ID, column: 'country' }, { tableId: ORDERS_ID, column: 'order_date' });

    const [relationship, ...rest] = toRelationships(tables, { [first.key]: first, [second.key]: second });

    expect(rest).toEqual([]);
    expect(relationship?.firstView).toBe(SALES);
    expect(relationship?.secondView).toBe(ORDERS);
    expect(relationship?.toJson().field_pairs).toEqual([
      {
        first_field: new TableField({ db_name: 'sample_v2', tbl_name: 'sales', field_name: 'order_id', field_type: 'int64' }).toJson(),
        second_field: new ViewField({ view_name: 'orders', field_name: 'order_id', field_type: 'int64' }).toJson()
      },
      {
        first_field: new TableField({ db_name: 'sample_v2', tbl_name: 'sales', field_name: 'country', field_type: 'string' }).toJson(),
        second_field: new ViewField({ view_name: 'orders', field_name: 'order_date', field_type: 'datetime' }).toJson()
      }
    ]);
  });

  it('flips a later connection made the other way round', () => {
    const first = makeConnection({ tableId: SALES_ID, column: 'order_id' }, { tableId: ORDERS_ID, column: 'order_id' });
    const reversed = makeConnection({ tableId: ORDERS_ID, column: 'order_date' }, { tableId: SALES_ID, column: 'country' });

    const [relationship] = toRelationships(tables, { [first.key]: first, [reversed.key]: reversed });

    expect(relationship?.fieldPairs[1]?.firstField).toMatchObject({ tblName: 'sales', fieldName: 'country' });
    expect(relationship?.fieldPairs[1]?.secondField).toMatchObject({ viewName: 'orders', fieldName: 'order_date' });
  });

  it('makes one relationship per table pair', () => {
    const regions = new SqlView({ alias_name: 'regions', query: { query: 'q' } });
    const a = makeConnection({ tableId: SALES_ID, column: 'order_id' }, { tableId: ORDERS_ID, column: 'order_id' });
    const b = makeConnection({ tableId: REGIONS_ID, column: 'region' }, { tableId: SALES_ID, column: 'region' });

    const relationships = toRelationships([...tables, table(regions)], { [a.key]: a, [b.key]: b });

    expect(relationships).toHaveLength(2);
    expect(relationships[1]?.firstView).toBe(regions);
  });

  it('gives an unknown column an empty type', () => {
    const connection = makeConnection({ tableId: SALES_ID, column: 'gone' }, { tableId: ORDERS_ID, column: 'order_id' });
    const [relationship] = toRelationships(tables, { [connection.key]: connection });
    expect(relationship?.fieldPairs[0]?.firstField).toMatchObject({ fieldName: 'gone', fieldType: '' });
  });

  it('skips connections to tables it does not know', () => {
    const connection = makeConnection({ tableId: 'x', column: 'a' }, { tableId: ORDERS_ID, column: 'order_id' });
    expect(toRelationships(tables, { [connection.key]: connection })).toEqual([]);
  });

  it('returns nothing without connections', () => {
    expect(toRelationships(tables, {})).toEqual([]);
  });
});

describe('toTablePositions', () => {
  it('writes drawn tables under v1 keys and keeps other saved positions', () => {
    const saved = { someOtherTable: { left: 1, top: 2 }, sampleV2Sales: { left: 0, top: 0 } };

    expect(toTablePositions([table(SALES), table(ORDERS)], { [SALES_ID]: { x: 10, y: 20 } }, saved)).toEqual({
      someOtherTable: { left: 1, top: 2 },
      sampleV2Sales: { left: 10, top: 20 }
    });
  });

  it('does not change the saved positions it was given', () => {
    const saved = { sampleV2Sales: { left: 0, top: 0 } };
    toTablePositions([table(SALES)], { [SALES_ID]: { x: 10, y: 20 } }, saved);
    expect(saved.sampleV2Sales).toEqual({ left: 0, top: 0 });
  });
});

describe('toRelationshipInfo', () => {
  it('keeps the loaded views and writes relationships and positions', () => {
    const loaded = new RelationshipInfo(RELATIONSHIP_JSON);
    const { tables, connections } = toEditorState(loaded, COLUMNS);
    const positions = toNodePositions(tables, loaded.tablePositions);

    const info = toRelationshipInfo(loaded, tables, connections, positions);

    expect(info.views).toBe(loaded.views);
    expect(info.toJson()).toEqual(loaded.toJson());
  });
});
