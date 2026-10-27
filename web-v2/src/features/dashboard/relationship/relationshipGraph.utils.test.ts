import { describe, expect, it, vi } from 'vitest';
import { TableView } from '@/core/relationship/QueryView';
import { makeConnection, type RelationshipTable } from './relationship.utils';
import {
  RELATIONSHIP_EDGE_TYPE,
  TABLE_DRAG_HANDLE_CLASS,
  TABLE_NODE_TYPE,
  nodePositionsOf,
  relatedColumns,
  toBaseNodes,
  toEdges,
  toNewConnection,
  toTableNodes,
  visibleColumns,
  withPositions,
  withoutConnection
} from './relationshipGraph.utils';

const col = (name: string) => ({ name, type: 'string' });
const tableA: RelationshipTable = {
  id: 'a',
  dbName: 'db',
  tblName: 'a',
  view: new TableView({ db_name: 'db', tbl_name: 'a' }),
  columns: [col('id'), col('name'), col('city')]
};
const tableB: RelationshipTable = { ...tableA, id: 'b', tblName: 'b' };
const aToB = makeConnection({ tableId: 'a', column: 'city' }, { tableId: 'b', column: 'id' });
const CONNECTIONS = { [aToB.key]: aToB };

describe('toBaseNodes', () => {
  it('makes a draggable-by-header table node per table', () => {
    expect(toBaseNodes([tableA], { a: { x: 1, y: 2 } })).toEqual([
      { id: 'a', type: TABLE_NODE_TYPE, position: { x: 1, y: 2 }, dragHandle: `.${TABLE_DRAG_HANDLE_CLASS}`, data: { table: tableA } }
    ]);
  });

  it('falls back to the origin', () => {
    expect(toBaseNodes([tableA], {})[0]?.position).toEqual({ x: 0, y: 0 });
  });
});

describe('nodePositionsOf', () => {
  it('reads positions by node id', () => {
    expect(nodePositionsOf(toBaseNodes([tableA, tableB], { a: { x: 1, y: 2 }, b: { x: 3, y: 4 } }))).toEqual({
      a: { x: 1, y: 2 },
      b: { x: 3, y: 4 }
    });
  });
});

describe('withPositions', () => {
  it('moves nodes back and keeps their other fields', () => {
    const nodes = toBaseNodes([tableA, tableB], {}).map(node => ({ ...node, measured: { width: 209, height: 100 } }));

    const result = withPositions(nodes, { a: { x: 7, y: 8 } });

    expect(result[0]).toMatchObject({ position: { x: 7, y: 8 }, measured: { width: 209, height: 100 } });
    expect(result[1]).toBe(nodes[1]);
    expect(nodes[0]?.position).toEqual({ x: 0, y: 0 });
  });
});

describe('relatedColumns', () => {
  it('collects joined columns of both ends', () => {
    const related = relatedColumns(CONNECTIONS);
    expect([...(related.get('a') ?? [])]).toEqual(['city']);
    expect([...(related.get('b') ?? [])]).toEqual(['id']);
  });

  it('is empty without connections', () => {
    expect(relatedColumns({}).size).toBe(0);
  });
});

describe('visibleColumns', () => {
  const columns = [col('user_id'), col('ID'), col('name'), col('city'), col('Width')];

  it('shows every column when expanded', () => {
    expect(visibleColumns(columns, new Set(), true)).toBe(columns);
  });

  it('shows key-like and joined columns when collapsed', () => {
    expect(visibleColumns(columns, new Set(['city']), false).map(c => c.name)).toEqual(['user_id', 'ID', 'city', 'Width']);
  });

  it('shows nothing for a collapsed table without such columns', () => {
    expect(visibleColumns([col('name')], new Set(), false)).toEqual([]);
  });
});

describe('toTableNodes', () => {
  it('adds the shown columns, joins and expansion to each node', () => {
    const base = toBaseNodes([tableA, tableB], {});
    const toggle = vi.fn<(tableId: string) => void>();

    const [a, b] = toTableNodes(base, CONNECTIONS, new Set(['b']), toggle);

    expect(a?.data).toMatchObject({ table: tableA, expanded: false, onToggleExpand: toggle });
    expect(a?.data.columns.map(c => c.name)).toEqual(['id', 'city']);
    expect([...(a?.data.related ?? [])]).toEqual(['city']);
    expect(b?.data.expanded).toBe(true);
    expect(b?.data.columns).toEqual(tableB.columns);
  });

  it('keeps what React Flow measured', () => {
    const base = toBaseNodes([tableA], {}).map(node => ({ ...node, measured: { width: 209, height: 90 } }));
    expect(toTableNodes(base, {}, new Set(), vi.fn<(tableId: string) => void>())[0]?.measured).toEqual({ width: 209, height: 90 });
  });
});

describe('toEdges', () => {
  it('makes an edge per connection between column handles', () => {
    expect(toEdges(CONNECTIONS)).toEqual([
      { id: aToB.key, type: RELATIONSHIP_EDGE_TYPE, source: 'a', sourceHandle: 'city', target: 'b', targetHandle: 'id' }
    ]);
  });
});

describe('toNewConnection', () => {
  it('joins two columns of different tables', () => {
    expect(toNewConnection({ source: 'a', sourceHandle: 'name', target: 'b', targetHandle: 'name' }, CONNECTIONS)).toEqual(
      makeConnection({ tableId: 'a', column: 'name' }, { tableId: 'b', column: 'name' })
    );
  });

  it('rejects columns of the same table', () => {
    expect(toNewConnection({ source: 'a', sourceHandle: 'id', target: 'a', targetHandle: 'name' }, {})).toBeUndefined();
  });

  it('rejects a join that exists, in either direction', () => {
    expect(toNewConnection({ source: 'b', sourceHandle: 'id', target: 'a', targetHandle: 'city' }, CONNECTIONS)).toBeUndefined();
  });

  it.each([
    { source: 'a', sourceHandle: null, target: 'b', targetHandle: 'id' },
    { source: 'a', sourceHandle: 'id', target: 'b', targetHandle: undefined }
  ])('rejects a drop without both columns: %j', params => {
    expect(toNewConnection(params, {})).toBeUndefined();
  });
});

describe('withoutConnection', () => {
  it('removes one connection without changing the input', () => {
    expect(withoutConnection(CONNECTIONS, aToB.key)).toEqual({});
    expect(CONNECTIONS[aToB.key]).toBe(aToB);
  });

  it('ignores an unknown key', () => {
    expect(withoutConnection(CONNECTIONS, 'x')).toEqual(CONNECTIONS);
  });
});
