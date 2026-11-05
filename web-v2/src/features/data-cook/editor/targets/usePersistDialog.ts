import { useCallback, useMemo, useState } from 'react';
import type { PersistConfiguration } from '@/core/data-cook/EtlOperator';
import type { EtlDraft } from '../draft/etlDraft.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';

export interface PersistDialogModel {
  /** The table whose destination is being set; none while closed. */
  readonly tblName: string | undefined;
  /** Where it is saved now, when it is. */
  readonly persist: PersistConfiguration | undefined;
  readonly open: (tblName: string) => void;
  readonly close: () => void;
  readonly submit: (persist: PersistConfiguration) => void;
}

/** Save To Data Warehouse of a table, from its menu or its box's Edit (v1 `handleSaveToDataWareHouse`). */
export function usePersistDialog(draft: EtlDraft, dispatch: EtlEditorDispatch): PersistDialogModel {
  const [tblName, setTblName] = useState<string>();
  const persist = tblName ? draft.graph.operators.get(tblName)?.persist : undefined;
  const close = useCallback(() => setTblName(undefined), []);
  const submit = useCallback(
    (next: PersistConfiguration) => {
      if (tblName) dispatch({ type: 'persist', tblName, persist: next });
      setTblName(undefined);
    },
    [tblName, dispatch]
  );
  return useMemo(() => ({ tblName, persist, open: setTblName, close, submit }), [tblName, persist, close, submit]);
}
