import type { RelationshipData } from '@/shared/relationship/relationshipData';
import { RelationshipEditorView } from '@/shared/relationship/RelationshipEditorView';
import { useCanvasControls } from '@/shared/relationship/useCanvasControls';
import { useFullscreen } from '@/shared/relationship/useFullscreen';
import { useRelationshipEditActions } from '@/shared/relationship/useRelationshipEditActions';
import { useRelationshipEditor } from '@/shared/relationship/useRelationshipEditor';
import { useSaveRelationship } from './useRelationshipData';

interface RelationshipEditorProps {
  dashboardId: number;
  data: RelationshipData;
  editable: boolean;
  onSaved: () => void;
}

/**
 * The dashboard's editor over loaded relationships: its tables are its views, so none are added or removed. Render
 * inside `ReactFlowProvider`, keyed by the load, so a reload starts over.
 */
export function RelationshipEditor({ dashboardId, data, editable, onSaved }: RelationshipEditorProps) {
  const editor = useRelationshipEditor(data, { editable, allowTableEdit: false });
  const { mutate, isPending } = useSaveRelationship(dashboardId);
  const actions = useRelationshipEditActions({ save: mutate, saving: isPending }, editor, onSaved);
  const zoom = useCanvasControls();
  const fullscreen = useFullscreen(zoom.onFitContent);

  return <RelationshipEditorView graph={editor} editable={editable} zoom={zoom} fullscreen={fullscreen} edit={{ dirty: editor.dirty, ...actions }} />;
}
