import type { RelationshipData } from './relationshipQueries';
import { RelationshipEditorView } from './RelationshipEditorView';
import { useCanvasControls } from './useCanvasControls';
import { useFullscreen } from './useFullscreen';
import { useRelationshipEditActions } from './useRelationshipEditActions';
import { useRelationshipEditor } from './useRelationshipEditor';

interface RelationshipEditorProps {
  dashboardId: number;
  data: RelationshipData;
  editable: boolean;
  onSaved: () => void;
}

/** Editor over loaded relationships. Render inside `ReactFlowProvider`, keyed by the load, so a reload starts over. */
export function RelationshipEditor({ dashboardId, data, editable, onSaved }: RelationshipEditorProps) {
  const editor = useRelationshipEditor(data, editable);
  const actions = useRelationshipEditActions(dashboardId, editor, onSaved);
  const zoom = useCanvasControls();
  const fullscreen = useFullscreen(zoom.onFitContent);

  return (
    <RelationshipEditorView
      graph={editor}
      editable={editable}
      zoom={zoom}
      fullscreen={fullscreen}
      edit={{ dirty: editor.dirty, ...actions }}
    />
  );
}
