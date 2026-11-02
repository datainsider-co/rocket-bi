import { describe, expect, it } from 'vitest';
import { isTabDirty, newQueryTab, type AnalysisTab } from './analysis.utils';
import { initialTabs, tabsReducer, type TabsState } from './analysisTabs';

const query = newQueryTab('select 1', 'view_q', false);
const chart = (id: number): AnalysisTab => ({ ...query, id, kind: 'chart', widget: { id }, saved: undefined });
const state: TabsState = { tabs: [query, chart(-2), chart(-3)], activeId: -2 };

describe('initialTabs', () => {
  it('shows the first tab', () => {
    expect(initialTabs([query]).activeId).toBe(-1);
    expect(initialTabs([]).activeId).toBe(-1);
  });
});

describe('tabsReducer', () => {
  it('selects a tab that exists only', () => {
    expect(tabsReducer(state, { type: 'select', id: -3 }).activeId).toBe(-3);
    expect(tabsReducer(state, { type: 'select', id: 99 })).toBe(state);
  });

  it('edits one tab', () => {
    const next = tabsReducer(state, { type: 'edit', id: -1, edit: { sql: 'select 2' } });
    expect(next.tabs.map(tab => tab.sql)).toEqual(['select 2', 'select 1', 'select 1']);
    expect(state.tabs[0]?.sql).toBe('select 1');
  });

  it('adds a chart and shows it', () => {
    const next = tabsReducer(state, { type: 'add', tab: chart(-4) });
    expect(next.tabs.map(tab => tab.id)).toEqual([-1, -2, -3, -4]);
    expect(next.activeId).toBe(-4);
  });

  it('replaces a tab, following its new id', () => {
    const next = tabsReducer(state, { type: 'replace', id: -2, tab: chart(30) });
    expect(next.tabs.map(tab => tab.id)).toEqual([-1, 30, -3]);
    expect(next.activeId).toBe(30);
    expect(tabsReducer(state, { type: 'replace', id: -3, tab: chart(31) }).activeId).toBe(-2);
  });

  it('removes a chart and shows the next one, else the one before', () => {
    expect(tabsReducer(state, { type: 'remove', id: -2 })).toEqual({ tabs: [query, chart(-3)], activeId: -3 });
    expect(tabsReducer({ ...state, activeId: -3 }, { type: 'remove', id: -3 }).activeId).toBe(-2);
    expect(tabsReducer(state, { type: 'remove', id: -3 }).activeId).toBe(-2);
  });

  it('never removes the query, nor an unknown tab', () => {
    expect(tabsReducer(state, { type: 'remove', id: -1 })).toBe(state);
    expect(tabsReducer(state, { type: 'remove', id: 99 })).toBe(state);
  });

  it('marks every tab saved as it is', () => {
    const edited = tabsReducer(state, { type: 'edit', id: -1, edit: { sql: 'select 2' } });
    expect(edited.tabs.map(isTabDirty)).toEqual([true, true, true]);
    expect(tabsReducer(edited, { type: 'saved' }).tabs.map(isTabDirty)).toEqual([false, false, false]);
  });
});
