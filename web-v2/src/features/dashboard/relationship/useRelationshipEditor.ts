import { useCallback, useMemo, useState } from 'react';
import { applyNodeChanges, type Edge, type NodeChange } from '@xyflow/react';
import type { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import {
  isDirty,
  toEditorState,
  toNodePositions,
  toRelationshipInfo,
  type Connections,
  type NodePositions
} from './relationship.utils';
import {
  nodePositionsOf,
  toBaseNodes,
  toEdges,
  toNewConnection,
  toTableNodes,
  withPositions,
  withoutConnection,
  type ConnectionParams,
  type TableBaseNode,
  type TableNode
} from './relationshipGraph.utils';
import type { RelationshipData } from './relationshipQueries';

function toggled(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Editor state over the loaded relationships: where tables are, which columns join, which tables are expanded.
 * Loaded data seeds the state once; the container is keyed so a reload starts over. Without `editable`, tables can
 * still be moved and expanded but joins can't change (nothing is saved).
 */
export function useRelationshipEditor({ info, columns }: RelationshipData, editable: boolean) {
  const [initial] = useState(() => {
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

  const nodes = useMemo(
    () => toTableNodes(baseNodes, connections, expanded, toggleExpand),
    [baseNodes, connections, expanded, toggleExpand]
  );
  const edges = useMemo(() => toEdges(connections), [connections]);
  const positions: NodePositions = useMemo(() => nodePositionsOf(baseNodes), [baseNodes]);

  const isValidConnection = useCallback(
    (params: ConnectionParams | Edge) => editable && toNewConnection(params, connections) !== undefined,
    [editable, connections]
  );
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
    setBaseNodes(current => withPositions(current, initial.positions));
  }, [initial]);

  const toSaveInfo = useCallback(
    (): RelationshipInfo => toRelationshipInfo(info, initial.tables, connections, positions),
    [info, initial, connections, positions]
  );

  return {
    nodes,
    edges,
    dirty: isDirty(initial, { connections, positions }),
    onNodesChange,
    isValidConnection,
    connect,
    removeConnection,
    discard,
    toSaveInfo
  };
}

export type RelationshipEditorState = ReturnType<typeof useRelationshipEditor>;
