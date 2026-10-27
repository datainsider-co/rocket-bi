import { useState, type MouseEvent } from 'react';
import { ConnectionMode, ReactFlow, type EdgeTypes, type NodeTypes } from '@xyflow/react';
import { MAX_ZOOM, MIN_ZOOM } from './canvasZoom.utils';
import { ConnectionMenu, type ConnectionMenuAnchor } from './ConnectionMenu';
import { RelationshipConnectionLine } from './RelationshipConnectionLine';
import { RelationshipEdgeView } from './RelationshipEdgeView';
import { RELATIONSHIP_EDGE_TYPE, TABLE_NODE_TYPE, type RelationshipEdge } from './relationshipGraph.utils';
import { TableNodeView } from './TableNodeView';
import type { RelationshipEditorState } from './useRelationshipEditor';

const nodeTypes: NodeTypes = { [TABLE_NODE_TYPE]: TableNodeView };
const edgeTypes: EdgeTypes = { [RELATIONSHIP_EDGE_TYPE]: RelationshipEdgeView };
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export type CanvasGraph = Pick<
  RelationshipEditorState,
  'nodes' | 'edges' | 'onNodesChange' | 'isValidConnection' | 'connect' | 'removeConnection'
>;

interface RelationshipCanvasProps {
  graph: CanvasGraph;
  editable: boolean;
}

/**
 * The tables and their joins. Dragging a table's header moves it, dragging a column onto another table's column
 * joins them (edit mode), the wheel zooms and dragging the background pans, like v1's Konva stage.
 */
export function RelationshipCanvas({ graph, editable }: RelationshipCanvasProps) {
  const [menu, setMenu] = useState<ConnectionMenuAnchor | null>(null);

  const openMenu = (event: MouseEvent, edge: RelationshipEdge) => {
    if (!editable) return;
    const bounds = event.currentTarget.closest('.react-flow')?.getBoundingClientRect();
    setMenu({ key: edge.id, x: event.clientX - (bounds?.left ?? 0), y: event.clientY - (bounds?.top ?? 0) });
  };
  const closeMenu = () => setMenu(null);

  return (
    <div className="relative min-h-0 flex-1">
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={graph.onNodesChange}
        onConnect={graph.connect}
        isValidConnection={graph.isValidConnection}
        onEdgeClick={openMenu}
        onPaneClick={closeMenu}
        onMoveStart={closeMenu}
        connectionMode={ConnectionMode.Loose}
        connectionLineComponent={RelationshipConnectionLine}
        nodesConnectable={editable}
        elementsSelectable={false}
        edgesFocusable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
        zoomOnDoubleClick={false}
        defaultViewport={DEFAULT_VIEWPORT}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        className={editable ? 'relationship-canvas relationship-canvas--editable' : 'relationship-canvas'}
      />
      <ConnectionMenu anchor={menu} onRemove={graph.removeConnection} onClose={closeMenu} />
    </div>
  );
}
