import '@xyflow/react/dist/style.css';
import './RelationshipEditor.css';
import { ControlBarView, type EditControls, type FullscreenControls, type ZoomControls } from './ControlBarView';
import { RelationshipCanvas, type CanvasGraph } from './RelationshipCanvas';

interface RelationshipEditorViewProps {
  graph: CanvasGraph;
  editable: boolean;
  zoom: ZoomControls;
  fullscreen: FullscreenControls;
  edit: EditControls;
}

/** The canvas over the control bar. In full screen it covers the page (v1 `DiagramPanel`). */
export function RelationshipEditorView({ graph, editable, zoom, fullscreen, edit }: RelationshipEditorViewProps) {
  return (
    <div className={`relationship-editor${fullscreen.isFullscreen ? ' relationship-editor--fullscreen' : ''}`}>
      <RelationshipCanvas graph={graph} editable={editable} />
      <ControlBarView zoom={zoom} fullscreen={fullscreen} edit={editable ? edit : undefined} />
    </div>
  );
}
