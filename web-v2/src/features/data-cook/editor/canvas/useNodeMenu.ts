import { useCallback, useState } from 'react';
import { App } from 'antd';
import { downstreamNames, removeStepsText, type EtlDraft } from '../draft/etlDraft.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';
import { EtlMenuKey } from '../graph/etlMenu.utils';
import type { EtlNodeRef } from '../graph/etlNodeRef';

/** The table whose display name is being edited. */
export interface TableRename {
  readonly tblName: string;
  readonly displayName: string;
}

/**
 * What the box menus do: Remove (asking first when steps after it go too) and Edit Display Name. The other items open
 * dialogs that come with later steps.
 */
export function useNodeMenu(draft: EtlDraft, dispatch: EtlEditorDispatch) {
  const { modal } = App.useApp();
  const [renaming, setRenaming] = useState<TableRename>();
  const { graph } = draft;

  const onMenu = useCallback(
    (ref: EtlNodeRef, key: string) => {
      const operator = graph.operators.get(ref.tblName);
      if (!operator) return;
      if (key === EtlMenuKey.Rename) setRenaming({ tblName: ref.tblName, displayName: operator.destTable.tblDisplayName });
      if (key !== EtlMenuKey.Remove) return;

      const remove = () => dispatch({ type: 'remove', ref });
      const after = ref.type === 'persist' || ref.type === 'thirdParty' ? 0 : downstreamNames(graph, ref.tblName).length - 1;
      if (after === 0) {
        remove();
        return;
      }
      void modal.confirm({
        title: 'Remove',
        content: removeStepsText(operator.destTable.tblDisplayName || ref.tblName, after),
        okText: 'Remove',
        okButtonProps: { danger: true },
        onOk: remove
      });
    },
    [graph, dispatch, modal]
  );

  const submitRename = useCallback(
    (displayName: string) => {
      if (renaming) dispatch({ type: 'renameTable', tblName: renaming.tblName, displayName });
      setRenaming(undefined);
    },
    [renaming, dispatch]
  );
  const cancelRename = useCallback(() => setRenaming(undefined), []);

  return { onMenu, renaming, submitRename, cancelRename };
}
