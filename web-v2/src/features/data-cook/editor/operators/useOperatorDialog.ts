import { useCallback, useMemo, useState } from 'react';
import { App } from 'antd';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import type { JsonObject } from '@/core/json/json';
import type { EtlDraft } from '../draft/etlDraft.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';
import type { TablePreviewState } from '../preview/useEtlPreview';
import { notPreviewedText, type OperatorDialog } from './operators.utils';

export interface OperatorDialogModel {
  readonly dialog: OperatorDialog | undefined;
  readonly open: (dialog: OperatorDialog) => void;
  readonly close: () => void;
  /**
   * A new operator reading `parentNames`, with a source it brings (Join with a warehouse table) or its ChartBuilder
   * state (Transform, Pivot).
   */
  readonly add: (operator: EtlOperator, parentNames: readonly string[], extras?: OperatorExtras) => void;
  readonly update: (operator: EtlOperator, renderOptions?: JsonObject) => void;
}

/** What comes with a new operator. */
export interface OperatorExtras {
  readonly sources?: readonly EtlOperator[];
  readonly renderOptions?: JsonObject;
}

/**
 * The operator dialog open on the editor (v1 `JoinTable`, `QueryTable`, `ManageFields` opened with a callback). An
 * operator added after a table needs that table's columns: v1 said "Can not add operator" while its preview had
 * failed, and disabled its menu while it loaded. What was added or edited is shown below the canvas.
 */
export function useOperatorDialog(
  draft: EtlDraft,
  dispatch: EtlEditorDispatch,
  previews: ReadonlyMap<string, TablePreviewState>,
  show: (tblName: string) => void
): OperatorDialogModel {
  const { message, modal } = App.useApp();
  const [dialog, setDialog] = useState<OperatorDialog>();
  const { graph } = draft;

  const open = useCallback(
    (next: OperatorDialog) => {
      if (next.mode === 'add') {
        const parent = graph.operators.get(next.parent);
        const name = parent?.destTable.tblDisplayName || next.parent;
        const status = previews.get(next.parent)?.status;
        if (status === 'loading') {
          void message.info(`The preview of ${name} is loading`);
          return;
        }
        if (status !== 'ready') {
          void modal.error({ title: 'Can not add operator', content: notPreviewedText([name]) });
          return;
        }
      }
      setDialog(next);
    },
    [graph, previews, message, modal]
  );
  const close = useCallback(() => setDialog(undefined), []);
  const add = useCallback(
    (operator: EtlOperator, parentNames: readonly string[], extras: OperatorExtras = {}) => {
      dispatch({ type: 'addOperator', operator, parentNames, ...extras });
      show(operator.destTable.tblName);
      setDialog(undefined);
    },
    [dispatch, show]
  );
  const update = useCallback(
    (operator: EtlOperator, renderOptions?: JsonObject) => {
      dispatch({ type: 'updateOperator', operator, renderOptions });
      show(operator.destTable.tblName);
      setDialog(undefined);
    },
    [dispatch, show]
  );

  return useMemo(() => ({ dialog, open, close, add, update }), [dialog, open, close, add, update]);
}
