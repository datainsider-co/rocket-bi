import '@xyflow/react/dist/style.css';
import './RelationshipEditor.css';
import { ControlBarView, type EditControls, type FullscreenControls, type ZoomControls } from './ControlBarView';
import { RelationshipCanvas, type CanvasDrop, type CanvasGraph } from './RelationshipCanvas';

interface RelationshipEditorViewProps {
  graph: CanvasGraph;
  editable: boolean;
  zoom: ZoomControls;
  fullscreen: FullscreenControls;
  edit: EditControls;
  /** Tables can be dropped on the canvas (the global relationships). */
  drop?: CanvasDrop | undefined;
  emptyHint?: string | undefined;
}

/** The canvas over the control bar. In full screen it covers the page (v1 `DiagramPanel`). */
export function RelationshipEditorView({ graph, editable, zoom, fullscreen, edit, drop, emptyHint }: RelationshipEditorViewProps) {
  return (
    <div className={`relationship-editor${fullscreen.isFullscreen ? ' relationship-editor--fullscreen' : ''}`}>
      <RelationshipCanvas graph={graph} editable={editable} drop={drop} emptyHint={emptyHint} />
      <ControlBarView zoom={zoom} fullscreen={fullscreen} edit={editable ? edit : undefined} />
    </div>
  );
}
