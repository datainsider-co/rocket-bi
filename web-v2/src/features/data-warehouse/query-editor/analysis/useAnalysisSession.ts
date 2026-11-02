import { useCallback, useMemo, useReducer } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { useUnsavedGuard } from '../../useUnsavedGuard';
import { useTableFromQuery, type TableFromQuery } from '../table/useTableFromQuery';
import type { SessionStart } from '../useEditorSource';
import { isTabDirty, unsavedAnalysis, type AnalysisTab } from './analysis.utils';
import { initialTabs, tabsReducer, type TabEdit } from './analysisTabs';
import { useAnalysisCharts, type AnalysisCharts } from './useAnalysisCharts';
import { useAnalysisSave, type AnalysisSave } from './useAnalysisSave';

export interface AnalysisSession {
  readonly tabs: readonly AnalysisTab[];
  readonly active: AnalysisTab;
  readonly onSelect: (id: number) => void;
  readonly onEdit: (edit: TabEdit) => void;
  /** The analysis the charts stand on (theme, id); an empty one for a new query. */
  readonly dashboard: Dashboard;
  readonly isSaved: boolean;
  /** Viewing someone's analysis without the right to edit it (v1 `isReadOnly`). */
  readonly readOnly: boolean;
  readonly canDownload: boolean;
  readonly dirty: boolean;
  readonly save: AnalysisSave;
  readonly charts: AnalysisCharts;
  /** Create Table, and Update Table when a view's query is edited (then it is no analysis: no Save nor charts). */
  readonly tables: TableFromQuery;
  readonly dbName: string | undefined;
}

/**
 * The Query Editor's analysis (v1 `QueryEditor` + `QueryComponent`): its tabs, saving, the charts, and asking before
 * leaving with changes (v1 asked for a new query with text, or an edited view's query).
 */
export function useAnalysisSession(start: SessionStart): AnalysisSession {
  const [state, dispatch] = useReducer(tabsReducer, start.tabs, initialTabs);
  const analysis = start.analysis;
  const analysisId = analysis?.dashboard.id;
  const readOnly = analysis ? !analysis.permissions.canEdit : false;
  const dirty = !readOnly && state.tabs.some(isTabDirty);
  const release = useUnsavedGuard(dirty);
  const save = useAnalysisSave({ tabs: state.tabs, analysisId, dispatch, release });
  const charts = useAnalysisCharts(state.tabs, analysisId, dispatch);
  const tables = useTableFromQuery(start.view, release);
  const dashboard = useMemo(() => analysis?.dashboard ?? unsavedAnalysis(), [analysis?.dashboard]);
  const { activeId } = state;
  const onEdit = useCallback((edit: TabEdit) => dispatch({ type: 'edit', id: activeId, edit }), [activeId]);
  const onSelect = useCallback((id: number) => dispatch({ type: 'select', id }), []);
  const active = state.tabs.find(tab => tab.id === activeId) ?? state.tabs[0];
  if (!active) throw new Error('An analysis has its query tab');

  return {
    tabs: state.tabs,
    active,
    onSelect,
    onEdit,
    dashboard,
    isSaved: analysis !== undefined,
    readOnly,
    canDownload: analysis ? analysis.permissions.canDownload : true,
    dirty,
    save,
    charts,
    tables,
    dbName: start.dbName
  };
}
