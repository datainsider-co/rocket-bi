import { syncParameters } from '@/core/query/rawQuery';
import { neighbourOf, type AnalysisTab } from './analysis.utils';

/** The analysis's tabs and the one shown (v1 `listAdhocInfo`, `currentAdHocIndex`). */
export interface TabsState {
  readonly tabs: readonly AnalysisTab[];
  readonly activeId: number;
}

export type TabEdit = Partial<Pick<AnalysisTab, 'sql' | 'parameters' | 'run'>>;

export type TabsAction =
  | { readonly type: 'select'; readonly id: number }
  | { readonly type: 'edit'; readonly id: number; readonly edit: TabEdit }
  /** A new chart, shown at once. */
  | { readonly type: 'add'; readonly tab: AnalysisTab }
  /** The tab as the builder or the server gave it back. */
  | { readonly type: 'replace'; readonly id: number; readonly tab: AnalysisTab }
  | { readonly type: 'remove'; readonly id: number }
  /** Everything was saved as it is now. */
  | { readonly type: 'saved' };

export function initialTabs(tabs: readonly AnalysisTab[]): TabsState {
  return { tabs, activeId: tabs[0]?.id ?? -1 };
}

const savedNow = (tab: AnalysisTab): AnalysisTab => ({ ...tab, saved: { sql: tab.sql, parameters: syncParameters(tab.sql, tab.parameters) } });

export function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  switch (action.type) {
    case 'select':
      return state.tabs.some(tab => tab.id === action.id) ? { ...state, activeId: action.id } : state;
    case 'edit':
      return { ...state, tabs: state.tabs.map(tab => (tab.id === action.id ? { ...tab, ...action.edit } : tab)) };
    case 'add':
      return { tabs: [...state.tabs, action.tab], activeId: action.tab.id };
    case 'replace':
      return {
        tabs: state.tabs.map(tab => (tab.id === action.id ? action.tab : tab)),
        activeId: state.activeId === action.id ? action.tab.id : state.activeId
      };
    case 'remove': {
      // The query tab stays: an analysis is its query.
      const removed = state.tabs.find(tab => tab.id === action.id);
      if (!removed || removed.kind === 'query') return state;
      const activeId = state.activeId === action.id ? (neighbourOf(state.tabs, action.id) ?? state.tabs[0]?.id ?? -1) : state.activeId;
      return { tabs: state.tabs.filter(tab => tab.id !== action.id), activeId };
    }
    case 'saved':
      return { ...state, tabs: state.tabs.map(savedNow) };
  }
}
