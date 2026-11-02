import { useCallback, useMemo, useState } from 'react';
import { applyNodeChanges, type NodeChange, type OnNodeDrag } from '@xyflow/react';
import type { EtlDraft } from '../draft/etlDraft.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';
import { keepMeasured, toEtlEdges, toEtlNodes, type EtlEdge, type EtlNode, type EtlNodeData } from '../graph/etlCanvas.utils';

export interface EtlCanvasModel {
  readonly nodes: EtlNode[];
  readonly edges: EtlEdge[];
  readonly onNodesChange: (changes: NodeChange<EtlNode>[]) => void;
  readonly onNodeDragStop: OnNodeDrag<EtlNode>;
}

/**
 * The draft on the canvas. React Flow moves the boxes while they are dragged; the draft takes their positions when the
 * drag ends (v1 `dragend`), so a drag is one edit.
 */
export function useEtlCanvas(draft: EtlDraft, dispatch: EtlEditorDispatch, onMenu: EtlNodeData['onMenu']): EtlCanvasModel {
  const derived = useMemo(() => toEtlNodes(draft.graph, draft.extraData, onMenu), [draft.graph, draft.extraData, onMenu]);
  const edges = useMemo(() => toEtlEdges(draft.graph), [draft.graph]);
  const [nodes, setNodes] = useState(derived);
  const [drawn, setDrawn] = useState(derived);
  if (drawn !== derived) {
    setDrawn(derived);
    setNodes(current => keepMeasured(derived, current));
  }

  const onNodesChange = useCallback((changes: NodeChange<EtlNode>[]) => setNodes(current => applyNodeChanges(changes, current)), []);
  const onNodeDragStop = useCallback<OnNodeDrag<EtlNode>>(
    (_, __, dragged) =>
      dispatch({ type: 'move', moves: dragged.map(node => ({ ref: node.data.ref, point: node.position })) }),
    [dispatch]
  );

  return { nodes, edges, onNodesChange, onNodeDragStop };
}
