import { useCallback } from 'react';
import { App } from 'antd';
import type { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import type { RelationshipEditorState } from './useRelationshipEditor';

/**
 * Where an editor saves (a dashboard's relationships or the global ones): the `mutate` and `isPending` of the
 * caller's mutation, so each keeps its own request and what it refreshes afterwards.
 */
export interface RelationshipSaver {
  readonly save: (info: RelationshipInfo, callbacks: { onSuccess: () => void; onError: (error: Error) => void }) => void;
  readonly saving: boolean;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Cannot save the relationships';
}

/** Save and Discard Changes of the control bar. `onSaved` runs once the server took it (the dashboard closes). */
export function useRelationshipEditActions(saver: RelationshipSaver, editor: Pick<RelationshipEditorState, 'discard' | 'toSaveInfo'>, onSaved: () => void) {
  const { modal, message } = App.useApp();
  const { save, saving } = saver;
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
