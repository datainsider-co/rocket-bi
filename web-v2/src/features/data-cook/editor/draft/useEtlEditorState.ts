import { useMemo, useReducer } from 'react';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { draftSnapshot } from './etlDraft.utils';
import { etlEditorReducer, initEtlEditor } from './etlEditorReducer';

/** The editor's draft of `initial`, and whether it differs from what was last loaded or saved. */
export function useEtlEditorState(initial: EtlJob) {
  const [state, dispatch] = useReducer(etlEditorReducer, initial, initEtlEditor);
  const baseSnapshot = useMemo(() => draftSnapshot(state.base), [state.base]);
  const snapshot = useMemo(() => draftSnapshot(state.draft), [state.draft]);
  return { draft: state.draft, dirty: snapshot !== baseSnapshot, dispatch };
}

export type EtlEditorDispatch = ReturnType<typeof useEtlEditorState>['dispatch'];
