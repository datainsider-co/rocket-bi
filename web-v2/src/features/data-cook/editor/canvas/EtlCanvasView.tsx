import '@xyflow/react/dist/style.css';
import './EtlCanvas.css';
import { ReactFlow, type NodeTypes } from '@xyflow/react';
import { MAX_ZOOM, MIN_ZOOM } from '@/shared/relationship/canvasZoom.utils';
import { ControlBarView, type EditControls, type FullscreenControls, type ZoomControls } from '@/shared/relationship/ControlBarView';
import { FIT_VIEW_OPTIONS } from '@/shared/relationship/useCanvasControls';
import { ETL_NODE_TYPES, type EtlEdge, type EtlNode } from '../graph/etlCanvas.utils';
import { EtlBoxNodeView } from './EtlBoxNodeView';
import { EtlEmptyHint } from './EtlEmptyHint';
import { EtlOperatorNodeView } from './EtlOperatorNodeView';
import { EtlTableNodeView } from './EtlTableNodeView';
import type { EtlCanvasModel } from './useEtlCanvas';

const nodeTypes: NodeTypes = {
  [ETL_NODE_TYPES.table]: EtlTableNodeView,
  [ETL_NODE_TYPES.operator]: EtlOperatorNodeView,
  [ETL_NODE_TYPES.box]: EtlBoxNodeView
};
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };
/**
 * Opening an ETL fits it in, without zooming a small one past 100%. A new ETL keeps 100%: React Flow's `fitView` prop
 * would wait for the first source and zoom in on it.
 */
const OPEN_FIT_OPTIONS = { ...FIT_VIEW_OPTIONS, maxZoom: 1 };

interface EtlCanvasViewProps {
  canvas: EtlCanvasModel;
  zoom: ZoomControls;
  fullscreen: FullscreenControls;
  edit: EditControls;
  onAddSource: () => void;
}

/**
 * v1 `DiagramPanel` with the ETL on it: dragging a box moves it, dragging the background pans, the wheel zooms. Below
 * it the control bar with Discard Changes and Save (v1's Clear All emptied the ETL without asking).
 */
export function EtlCanvasView({ canvas, zoom, fullscreen, edit, onAddSource }: EtlCanvasViewProps) {
  return (
    <div className={`etl-editor${fullscreen.isFullscreen ? ' etl-editor--fullscreen' : ''}`}>
      <div className="etl-canvas">
        {canvas.nodes.length === 0 && <EtlEmptyHint onAddSource={onAddSource} />}
        <ReactFlow<EtlNode, EtlEdge>
          nodes={canvas.nodes}
          edges={canvas.edges}
          nodeTypes={nodeTypes}
          onNodesChange={canvas.onNodesChange}
          onNodeDragStop={canvas.onNodeDragStop}
          nodesConnectable={false}
          elementsSelectable={false}
          edgesFocusable={false}
          deleteKeyCode={null}
          zoomOnDoubleClick={false}
          defaultViewport={DEFAULT_VIEWPORT}
          onInit={instance => canvas.nodes.length > 0 && void instance.fitView(OPEN_FIT_OPTIONS)}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        />
      </div>
      <ControlBarView zoom={zoom} fullscreen={fullscreen} edit={edit} />
    </div>
  );
}
