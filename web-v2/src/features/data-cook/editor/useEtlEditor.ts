import { useCallback, useRef, useState } from 'react';
import { App } from 'antd';
import { useLocation, useNavigate } from 'react-router';
import type { EtlId, EtlJob } from '@/core/data-cook/EtlJob';
import type { PageLocation } from '@/shared/routing/leavesPage';
import { useUnsavedGuard } from '@/shared/routing/useUnsavedGuard';
import { etlEditorPath, isEtlEditorPath } from '../dataCook.utils';
import { useEtlCanvas } from './canvas/useEtlCanvas';
import { useNodeMenu } from './canvas/useNodeMenu';
import { useEtlEditorState } from './draft/useEtlEditorState';
import { useSaveEtl } from './save/useSaveEtl';
import { useAddSource } from './source/useAddSource';

/**
 * The ETL editor (v1 `ManageEtlJob` + `ManageEtlOperator`): the draft, its canvas, Add Source, Save, the renames and
 * the leave guard. `onCreated` tells the page the new ETL's id before the URL moves to it.
 */
export function useEtlEditor(initial: EtlJob, onCreated: (id: EtlId) => void) {
  const { draft, dirty, dispatch } = useEtlEditorState(initial);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { modal } = App.useApp();

  // The ETL's id, read by the guard as the URL moves: set before the navigation that follows a create.
  const idRef = useRef(initial.id);
  const stays = useCallback((next: PageLocation) => isEtlEditorPath(next.pathname, idRef.current), []);
  useUnsavedGuard(dirty, undefined, stays);

  /** The URL follows the ETL: its id once created, its name once saved. */
  const follow = useCallback(
    (etl: EtlJob) => {
      if (idRef.current !== etl.id) {
        idRef.current = etl.id;
        onCreated(etl.id);
      }
      const path = etlEditorPath(etl.id, etl.displayName);
      if (path !== pathname) void navigate(path, { replace: true });
    },
    [onCreated, pathname, navigate]
  );

  const source = useAddSource(draft, dispatch, follow);
  const { save, isSaving } = useSaveEtl(draft, dispatch, follow);
  const menu = useNodeMenu(draft, dispatch);
  const canvas = useEtlCanvas(draft, dispatch, menu.onMenu);
  const [isRenaming, setRenaming] = useState(false);

  return {
    draft,
    canvas,
    source,
    menu,
    edit: {
      dirty,
      saving: isSaving,
      onSave: useCallback(() => save(), [save]),
      // The Relationship editor's words.
      onDiscard: useCallback(
        () =>
          void modal.confirm({
            title: 'Discard changes',
            content: 'Are you sure you want to discard the changes you made?',
            okText: 'Discard',
            onOk: () => dispatch({ type: 'discard' })
          }),
        [modal, dispatch]
      )
    },
    rename: {
      isOpen: isRenaming,
      open: useCallback(() => setRenaming(true), []),
      close: useCallback(() => setRenaming(false), []),
      submit: useCallback(
        (displayName: string) => {
          dispatch({ type: 'rename', displayName });
          setRenaming(false);
        },
        [dispatch]
      )
    }
  };
}
