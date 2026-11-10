import { useCallback, useMemo, useState } from 'react';
import { applyNodeChanges, type NodeChange, type NodeMouseHandler, type OnNodeDrag } from '@xyflow/react';
import type { EtlDraft } from '../draft/etlDraft.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';
import {
  keepMeasured,
  toEtlEdges,
  toEtlNodes,
  withEdgeErrors,
  withPreview,
  type EtlEdge,
  type EtlNode,
  type EtlNodeData,
  type NodePreview
} from '../graph/etlCanvas.utils';

export interface EtlCanvasModel {
  readonly nodes: EtlNode[];
  readonly edges: EtlEdge[];
  readonly onNodesChange: (changes: NodeChange<EtlNode>[]) => void;
  readonly onNodeDragStop: OnNodeDrag<EtlNode>;
  readonly onNodeClick: NodeMouseHandler<EtlNode>;
}

/** What the canvas shows of the preview: each table's, the one below the canvas, and picking another. */
export interface CanvasPreview {
  readonly tables: ReadonlyMap<string, Pick<NodePreview, 'status' | 'message'>>;
  readonly shown: string | undefined;
  readonly onShow: (tblName: string) => void;
}

/**
 * The draft on the canvas. React Flow moves the boxes while they are dragged; the draft takes their positions when the
 * drag ends (v1 `dragend`), so a drag is one edit. A click on a table shows its rows below.
 */
export function useEtlCanvas(draft: EtlDraft, dispatch: EtlEditorDispatch, onMenu: EtlNodeData['onMenu'], preview: CanvasPreview): EtlCanvasModel {
  const { tables, shown, onShow } = preview;
  const derived = useMemo(
    () => withPreview(toEtlNodes(draft.graph, draft.extraData, onMenu), tables, shown),
    [draft.graph, draft.extraData, onMenu, tables, shown]
  );
  const edges = useMemo(() => withEdgeErrors(toEtlEdges(draft.graph), tables), [draft.graph, tables]);
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
  const onNodeClick = useCallback<NodeMouseHandler<EtlNode>>(
    (_, node) => {
      if (node.data.ref.type === 'table') onShow(node.data.ref.tblName);
    },
    [onShow]
  );

  return { nodes, edges, onNodesChange, onNodeDragStop, onNodeClick };
}
