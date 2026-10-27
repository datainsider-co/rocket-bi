import { useCallback } from 'react';
import { App } from 'antd';
import { useSaveRelationship } from './useRelationshipData';
import type { RelationshipEditorState } from './useRelationshipEditor';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Cannot save the relationships';
}

/** Save and Discard Changes of the control bar. Save closes the editor when it succeeds (v1). */
export function useRelationshipEditActions(
  dashboardId: number,
  editor: Pick<RelationshipEditorState, 'discard' | 'toSaveInfo'>,
  onSaved: () => void
) {
  const { modal, message } = App.useApp();
  const { mutate: save, isPending: saving } = useSaveRelationship(dashboardId);
  const { discard, toSaveInfo } = editor;

  const onSave = useCallback(() => {
    save(toSaveInfo(), {
      onSuccess: onSaved,
      onError: error => void message.error(errorMessage(error))
    });
  }, [save, toSaveInfo, onSaved, message]);

  const onDiscard = useCallback(() => {
    void modal.confirm({
      title: 'Discard changes',
      content: 'Are you sure you want to discard the changes you made?',
      okText: 'Discard',
      onOk: discard
    });
  }, [modal, discard]);

  return { saving, onSave, onDiscard };
}
