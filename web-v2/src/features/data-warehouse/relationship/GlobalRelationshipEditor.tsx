import { useCallback } from 'react';
import { App } from 'antd';
import type { RelationshipData } from '@/shared/relationship/relationshipData';
import { RelationshipEditorView } from '@/shared/relationship/RelationshipEditorView';
import { useCanvasControls } from '@/shared/relationship/useCanvasControls';
import { useFullscreen } from '@/shared/relationship/useFullscreen';
import { useRelationshipEditActions } from '@/shared/relationship/useRelationshipEditActions';
import { useRelationshipEditor } from '@/shared/relationship/useRelationshipEditor';
import { useUnsavedGuard, type LeaveTexts } from '@/shared/routing/useUnsavedGuard';
import { EMPTY_CANVAS_HINT } from './globalRelationship.utils';
import { useSaveGlobalRelationship } from './useGlobalRelationship';
import { useTableDrop } from './useTableDrop';

const LEAVE_TEXTS: LeaveTexts = { title: 'Leave without saving?', content: 'Changes to the relationships you have not saved will be lost.' };

/**
 * The global relationships, always editable (v1 `GlobalRelationshipHandler`): tables come from the tree, and their
 * menu removes them. A save keeps the canvas as it is and makes it what Discard goes back to. Render inside
 * `ReactFlowProvider`.
 */
export function GlobalRelationshipEditor({ data }: { data: RelationshipData }) {
  const { message } = App.useApp();
  const editor = useRelationshipEditor(data, { editable: true, allowTableEdit: true });
  const { mutate, isPending } = useSaveGlobalRelationship();
  const { markSaved } = editor;
  const onSaved = useCallback(() => {
    markSaved();
    void message.success('Relationships saved');
  }, [markSaved, message]);
  const actions = useRelationshipEditActions({ save: mutate, saving: isPending }, editor, onSaved);
  const zoom = useCanvasControls();
  const fullscreen = useFullscreen(zoom.onFitContent);
  const drop = useTableDrop(editor);
  useUnsavedGuard(editor.dirty, LEAVE_TEXTS);

  return (
    <RelationshipEditorView
      graph={editor}
      editable
      zoom={zoom}
      fullscreen={fullscreen}
      edit={{ dirty: editor.dirty, ...actions }}
      drop={drop}
      emptyHint={EMPTY_CANVAS_HINT}
    />
  );
}
