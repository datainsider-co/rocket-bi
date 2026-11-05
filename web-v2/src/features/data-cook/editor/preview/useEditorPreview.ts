import { useMemo, useState } from 'react';
import type { EtlDraft } from '../draft/etlDraft.utils';
import type { CanvasPreview } from '../canvas/useEtlCanvas';
import { previewTabs, shownTable, type PreviewTab } from './etlPreview.utils';
import { useEtlPreview, type EtlPreviewModel, type TablePreviewState } from './useEtlPreview';

export interface PreviewPanelModel {
  readonly tabs: readonly PreviewTab[];
  readonly shown: string | undefined;
  readonly state: TablePreviewState | undefined;
  readonly onShow: (tblName: string) => void;
  readonly onRetry: (tblName: string) => void;
  readonly onRefresh: () => void;
}

/**
 * The draft's preview with the table shown below the canvas: the one picked (on its tab or its box), else the first,
 * as v1. `show` picks the table an operator dialog just added.
 */
export function useEditorPreview(draft: EtlDraft) {
  const preview: EtlPreviewModel = useEtlPreview(draft.etl.id, draft.graph);
  const [picked, setPicked] = useState<string>();
  const { tables, retry, refresh } = preview;
  const shown = shownTable([...tables.keys()], picked);

  const canvas = useMemo<CanvasPreview>(() => ({ tables, shown, onShow: setPicked }), [tables, shown]);
  const panel = useMemo<PreviewPanelModel>(
    () => ({
      tabs: previewTabs(draft.graph, tables),
      shown,
      state: shown === undefined ? undefined : tables.get(shown),
      onShow: setPicked,
      onRetry: retry,
      onRefresh: refresh
    }),
    [draft.graph, tables, shown, retry, refresh]
  );

  return { tables, canvas, panel, show: setPicked };
}
