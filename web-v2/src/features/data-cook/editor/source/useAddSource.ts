import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import type { TreeTable } from '@/shared/database-tree/databaseTree.utils';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { etlsChanged } from '../../dataCookQueries';
import { alreadySourceText, findSource, newSourceOperator, type EtlDraft } from '../draft/etlDraft.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';
import { useLoadSource } from './useLoadSource';

export interface AddSourceDialog {
  readonly isOpen: boolean;
  readonly isAdding: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly pick: (table: TreeTable) => void;
}

/**
 * Add Source (v1 `SelectSourcePopover`): a warehouse table becomes a source, with the server's JSON of the table. A new
 * ETL is created on its first source (v1 created one as soon as the page opened): the editor needs an id from there on.
 * `onCreated` follows the new ETL to its URL.
 */
export function useAddSource(draft: EtlDraft, dispatch: EtlEditorDispatch, onCreated: (etl: EtlJob) => void): AddSourceDialog {
  const service = useDi(EtlService);
  const loadSource = useLoadSource();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [isOpen, setOpen] = useState(false);

  const add = useMutation({
    mutationFn: async (table: TreeTable) => {
      const { json, dbDisplayName } = await loadSource(table);
      // Created once the table is read, so a table that can't be read leaves no empty ETL.
      const created = draft.etl.id === 0 ? await service.create(draft.displayName) : undefined;
      return { json, dbDisplayName, created };
    },
    onSuccess: ({ json, dbDisplayName, created }) => {
      if (created) {
        dispatch({ type: 'created', etl: created });
        void etlsChanged(queryClient);
        onCreated(created);
      }
      dispatch({ type: 'addSource', operator: newSourceOperator(json, dbDisplayName, new Set(draft.graph.operators.keys())) });
      setOpen(false);
    },
    onError: error => void message.error(toErrorMessage(error))
  });
  const { mutate, isPending } = add;

  const pick = useCallback(
    (table: TreeTable) => {
      if (isPending) return;
      if (findSource(draft.graph, table.dbName, table.name)) {
        void message.info(alreadySourceText(table.name));
        return;
      }
      mutate(table);
    },
    [draft.graph, isPending, mutate, message]
  );

  return {
    isOpen,
    isAdding: isPending,
    open: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
    pick
  };
}
