import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { dashboardKeys } from '@/features/dashboard/detail/dashboardQueries';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { analysisPath } from '../queryEditor.utils';
import { isTabDirty, tabWidgetJson, type AnalysisTab } from './analysis.utils';
import type { TabsAction } from './analysisTabs';

export interface AnalysisSaveInput {
  readonly tabs: readonly AnalysisTab[];
  /** The saved analysis open; none for a new query. */
  readonly analysisId: number | undefined;
  readonly dispatch: (action: TabsAction) => void;
  /** Lets the next navigation through the unsaved changes guard. */
  readonly release: () => void;
}

export interface AnalysisSave {
  /** Save (v1 `saveQueryAnalysis`): the tabs changed since the last save, or the name dialog for a new query. */
  readonly save: () => void;
  /** Save As (v1 Actions › Create Analysis): a new analysis of every tab, in a folder picked with its name. */
  readonly saveAs: () => void;
  readonly saving: boolean;
  /** The folder and name dialog. */
  readonly naming: { readonly open: boolean; readonly creating: boolean; readonly error: string | undefined; readonly onSubmit: (name: string, folderId: number) => void; readonly onCancel: () => void };
}

/**
 * Saving the analysis. v1 saved widget 0 every 5 s, whatever the tab; v2 saves when asked, each changed tab into its own
 * widget. A new analysis opens in place of the query (v1 went to My Data).
 */
export function useAnalysisSave({ tabs, analysisId, dispatch, release }: AnalysisSaveInput): AnalysisSave {
  const service = useDi(DashboardService);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [naming, setNaming] = useState(false);

  const update = useMutation({
    mutationFn: async (id: number) => {
      for (const tab of tabs.filter(isTabDirty)) await service.editWidget(id, tabWidgetJson(tab));
    },
    onSuccess: (_, id) => {
      dispatch({ type: 'saved' });
      void message.success('Save analysis successful!');
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(id), refetchType: 'none' });
    },
    onError: error => void message.error(`Save analysis failed: ${toErrorMessage(error)}`)
  });
  const create = useMutation({
    mutationFn: ({ name, folderId }: { name: string; folderId: number }) => service.createQuery(name, folderId, tabs.map(tabWidgetJson)),
    onSuccess: created => {
      setNaming(false);
      release();
      void message.success(`Analysis "${created.name}" created`);
      void navigate(analysisPath(created.id), { replace: analysisId === undefined });
    }
  });

  const openNaming = () => {
    create.reset();
    setNaming(true);
  };

  return {
    save: () => (analysisId === undefined ? openNaming() : update.mutate(analysisId)),
    saveAs: openNaming,
    saving: update.isPending,
    naming: {
      open: naming,
      creating: create.isPending,
      error: create.error ? toErrorMessage(create.error) : undefined,
      onSubmit: (name, folderId) => create.mutate({ name, folderId }),
      onCancel: () => setNaming(false)
    }
  };
}
