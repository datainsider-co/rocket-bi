import type { Edge, Node } from '@xyflow/react';
import {
  makeConnection,
  type Connection,
  type Connections,
  type NodePositions,
  type RelationshipColumn,
  type RelationshipTable
} from './relationship.utils';

export const TABLE_NODE_TYPE = 'table';
export const RELATIONSHIP_EDGE_TYPE = 'relationship';
/** Class of the part of a table node that moves it; the column rows start connections instead (v1). */
export const TABLE_DRAG_HANDLE_CLASS = 'relationship-table__drag-handle';

/** Static part of a table node, set once when the editor loads. */
export interface TableNodeBase extends Record<string, unknown> {
  readonly table: RelationshipTable;
}

/** What a table node draws. */
export interface TableNodeData extends TableNodeBase {
  readonly columns: readonly RelationshipColumn[];
  readonly related: ReadonlySet<string>;
  readonly expanded: boolean;
  readonly onToggleExpand: (tableId: string) => void;
}

export type TableBaseNode = Node<TableNodeBase, typeof TABLE_NODE_TYPE>;
export type TableNode = Node<TableNodeData, typeof TABLE_NODE_TYPE>;
export type RelationshipEdge = Edge<Record<string, never>, typeof RELATIONSHIP_EDGE_TYPE>;

export function toBaseNodes(tables: readonly RelationshipTable[], positions: NodePositions): TableBaseNode[] {
  return tables.map(table => ({
    id: table.id,
    type: TABLE_NODE_TYPE,
    position: positions[table.id] ?? { x: 0, y: 0 },
    dragHandle: `.${TABLE_DRAG_HANDLE_CLASS}`,
    data: { table }
  }));
}

export function nodePositionsOf(nodes: readonly Node[]): NodePositions {
  return Object.fromEntries(nodes.map(node => [node.id, { x: node.position.x, y: node.position.y }]));
}

/** Moves each node back to its position in `positions`, keeping everything React Flow measured. */
export function withPositions<T extends Node>(nodes: readonly T[], positions: NodePositions): T[] {
  return nodes.map(node => {
    const position = positions[node.id];
    return position ? { ...node, position } : node;
  });
}

/** Joined column names by table id. */
export function relatedColumns(connections: Connections): ReadonlyMap<string, ReadonlySet<string>> {
  const result = new Map<string, Set<string>>();
  const add = (tableId: string, column: string) => {
    const columns = result.get(tableId) ?? new Set<string>();
    columns.add(column);
    result.set(tableId, columns);
  };
  for (const { source, target } of Object.values(connections)) {
    add(source.tableId, source.column);
    add(target.tableId, target.column);
  }
  return result;
}

/** v1 matched "id" on the snake_case name; lower case gives the same answer for real column names. */
function looksLikeKey(name: string): boolean {
  return name.toLowerCase().includes('id');
}

/** An expanded table shows every column; a collapsed one only key-like columns and joined ones (v1). */
export function visibleColumns(
  columns: readonly RelationshipColumn[],
  related: ReadonlySet<string>,
  expanded: boolean
): readonly RelationshipColumn[] {
  return expanded ? columns : columns.filter(column => looksLikeKey(column.name) || related.has(column.name));
}

const NO_COLUMNS: ReadonlySet<string> = new Set();

/** Adds what each table draws to the nodes React Flow holds, keeping their measured size and drag state. */
export function toTableNodes(
  nodes: readonly TableBaseNode[],
  connections: Connections,
  expanded: ReadonlySet<string>,
  onToggleExpand: (tableId: string) => void
): TableNode[] {
  const related = relatedColumns(connections);
  return nodes.map(node => {
    const isExpanded = expanded.has(node.id);
    const tableRelated = related.get(node.id) ?? NO_COLUMNS;
    return {
      ...node,
      data: {
        ...node.data,
        columns: visibleColumns(node.data.table.columns, tableRelated, isExpanded),
        related: tableRelated,
        expanded: isExpanded,
        onToggleExpand
      }
    };
  });
}

export function toEdges(connections: Connections): RelationshipEdge[] {
  return Object.values(connections).map(({ key, source, target }) => ({
    id: key,
    type: RELATIONSHIP_EDGE_TYPE,
    source: source.tableId,
    sourceHandle: source.column,
    target: target.tableId,
    targetHandle: target.column
  }));
}

/** What React Flow reports when the user drops a connection. */
export interface ConnectionParams {
  readonly source: string;
  readonly sourceHandle?: string | null | undefined;
  readonly target: string;
  readonly targetHandle?: string | null | undefined;
}

/** The connection a drop would make, or `undefined` when it is not allowed: same table, or already joined (v1). */
export function toNewConnection(params: ConnectionParams, connections: Connections): Connection | undefined {
  if (!params.sourceHandle || !params.targetHandle || params.source === params.target) return undefined;
  const connection = makeConnection(
    { tableId: params.source, column: params.sourceHandle },
    { tableId: params.target, column: params.targetHandle }
  );
  return connection.key in connections ? undefined : connection;
}

export function withoutConnection(connections: Connections, key: string): Connections {
  return Object.fromEntries(Object.entries(connections).filter(([existing]) => existing !== key));
}
