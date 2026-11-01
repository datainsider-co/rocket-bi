import { useCallback, useMemo, useState } from 'react';
import { applyNodeChanges, type Edge, type NodeChange } from '@xyflow/react';
import type { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import {
  isDirty,
  toEditorState,
  toGlobalRelationshipInfo,
  toNodePositions,
  toRelationshipInfo,
  withoutTableConnections,
  type Connections,
  type NodePositions,
  type Point,
  type RelationshipTable
} from './relationship.utils';
import type { RelationshipData } from './relationshipData';
import {
  nodePositionsOf,
  restoreNodes,
  toBaseNode,
  toBaseNodes,
  toEdges,
  toNewConnection,
  toTableNodes,
  withoutConnection,
  type ConnectionParams,
  type TableBaseNode,
  type TableNode
} from './relationshipGraph.utils';

export interface RelationshipEditorOptions {
  /** Joins can change and be saved. Without it tables can still be moved and expanded. */
  readonly editable: boolean;
  /**
   * Tables can be added and removed, and Save sends the tables on the canvas (the global relationships). Without it
   * the tables are the loaded views and Save sends those back (a dashboard's, M7c).
   */
  readonly allowTableEdit: boolean;
}

interface Snapshot {
  readonly tables: readonly RelationshipTable[];
  readonly connections: Connections;
  readonly positions: NodePositions;
}

function toggled(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(set);
  if (!next.delete(id)) next.add(id);
  return next;
}

/**
 * Editor state over the loaded relationships: which tables are drawn and where, which columns join, which tables are
 * expanded. Loaded data seeds the state once; the container is keyed so a reload starts over. A save makes the
 * current state the one Discard goes back to (`markSaved`).
 */
export function useRelationshipEditor({ info, columns }: RelationshipData, { editable, allowTableEdit }: RelationshipEditorOptions) {
  const [initial, setInitial] = useState<Snapshot>(() => {
    const state = toEditorState(info, columns);
    return { ...state, positions: toNodePositions(state.tables, info.tablePositions) };
  });
  const [baseNodes, setBaseNodes] = useState<TableBaseNode[]>(() => toBaseNodes(initial.tables, initial.positions));
  const [connections, setConnections] = useState<Connections>(initial.connections);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const toggleExpand = useCallback((tableId: string) => setExpanded(current => toggled(current, tableId)), []);
  const onNodesChange = useCallback(
    (changes: NodeChange<TableNode>[]) =>
      // Only position, dimension and selection changes come in; none carries node data.
      setBaseNodes(current => applyNodeChanges(changes as NodeChange<TableBaseNode>[], current)),
    []
  );
  const removeTable = useCallback((tableId: string) => {
    setBaseNodes(current => current.filter(node => node.id !== tableId));
    setConnections(current => withoutTableConnections(current, tableId));
  }, []);
  const onRemove = allowTableEdit ? removeTable : undefined;

  const tables = useMemo(() => baseNodes.map(node => node.data.table), [baseNodes]);
  const nodes = useMemo(() => toTableNodes(baseNodes, connections, expanded, toggleExpand, onRemove), [baseNodes, connections, expanded, toggleExpand, onRemove]);
  const edges = useMemo(() => toEdges(connections), [connections]);
  const positions: NodePositions = useMemo(() => nodePositionsOf(baseNodes), [baseNodes]);

  const hasTable = useCallback((tableId: string) => baseNodes.some(node => node.id === tableId), [baseNodes]);
  /** Draws `table` at `position` unless it is already on the canvas. */
  const addTable = useCallback(
    (table: RelationshipTable, position: Point) =>
      setBaseNodes(current => (allowTableEdit && !current.some(node => node.id === table.id) ? [...current, toBaseNode(table, position)] : current)),
    [allowTableEdit]
  );

  const isValidConnection = useCallback((params: ConnectionParams | Edge) => editable && toNewConnection(params, connections) !== undefined, [editable, connections]);
  const connect = useCallback(
    (params: ConnectionParams) => {
      if (!editable) return;
      setConnections(current => {
        const connection = toNewConnection(params, current);
        return connection ? { ...current, [connection.key]: connection } : current;
      });
    },
    [editable]
  );
  const removeConnection = useCallback(
    (key: string) => {
      if (editable) setConnections(current => withoutConnection(current, key));
    },
    [editable]
  );
  const discard = useCallback(() => {
    setConnections(initial.connections);
    setBaseNodes(current => restoreNodes(current, initial.tables, initial.positions));
  }, [initial]);
  const markSaved = useCallback(() => setInitial({ tables, connections, positions }), [tables, connections, positions]);

  const toSaveInfo = useCallback(
    (): RelationshipInfo => (allowTableEdit ? toGlobalRelationshipInfo(tables, connections, positions) : toRelationshipInfo(info, tables, connections, positions)),
    [allowTableEdit, info, tables, connections, positions]
  );

  return {
    nodes,
    edges,
    isEmpty: baseNodes.length === 0,
    dirty: isDirty(initial, { connections, positions }),
    onNodesChange,
    isValidConnection,
    connect,
    removeConnection,
    hasTable,
    addTable,
    discard,
    markSaved,
    toSaveInfo
  };
}

export type RelationshipEditorState = ReturnType<typeof useRelationshipEditor>;
