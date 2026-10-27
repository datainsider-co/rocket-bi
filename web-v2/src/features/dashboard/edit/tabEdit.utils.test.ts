import { describe, expect, it, vi } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import filtersFixture from '@/core/dashboard/filters.fixture.json';
import { widgetFromJson, type TabWidget } from '@/core/dashboard/Widget';
import { newFilterPanelJson } from '@/core/dashboard/widgetJson';
import { OWNER_PERMISSIONS, permissionsOf } from '../access/access.utils';
import { tabHeaderStyleOf } from '../widgets/tab/tabWidget.utils';
import {
  applyButtonStyleOf,
  moveInOrder,
  tabItemMenuItems,
  tabWidgetMenuItems,
  widgetLabel,
  widgetsOfTab,
  widgetsToAdd,
  withTabAdded,
  withTabRemoved,
  withTabRenamed,
  withTabsOrdered,
  withTabStyle,
  withWidgetsAdded,
  withWidgetsRemoved,
  type TabEditHandlers
} from './tabEdit.utils';

const tab = widgetFromJson({
  class_name: 'tab_widget',
  id: 12,
  name: 'Tabs',
  tab_items: [
    { name: 'A', widget_ids: [1, 2], options: {} },
    { name: 'B', widget_ids: [3], options: {} }
  ],
  extra_data: { current_chart_type: 'tab', header: { font_family: 'Roboto' } }
}) as TabWidget;
const tabsOf = (json: Record<string, unknown>) => (widgetFromJson(json) as TabWidget).tabItems.map(item => [item.name, item.widgetIds]);

describe('tab edits', () => {
  it('adds, renames and removes tabs', () => {
    expect(tabsOf(withTabAdded(tab, 'New tab'))).toEqual([['A', [1, 2]], ['B', [3]], ['New tab', []]]);
    expect(tabsOf(withTabRenamed(tab, 1, 'Second'))).toEqual([['A', [1, 2]], ['Second', [3]]]);
    const removed = withTabRemoved(tab, 0);
    expect(tabsOf(removed.json)).toEqual([['B', [3]]]);
    expect(removed.released).toEqual([1, 2]);
    expect(withTabRemoved(tab, 5).released).toEqual([]);
  });

  it('moves widgets in and out of a tab, once each', () => {
    expect(tabsOf(withWidgetsAdded(tab, 1, [2, 4, 3]))).toEqual([['A', [1, 2]], ['B', [3, 2, 4]]]);
    expect(tabsOf(withWidgetsRemoved(tab, 0, [1]))).toEqual([['A', [2]], ['B', [3]]]);
  });

  it('orders tabs and keeps the rest of the JSON', () => {
    const json = withTabsOrdered(tab, [1, 0]);
    expect(tabsOf(json)).toEqual([['B', [3]], ['A', [1, 2]]]);
    expect(json['extra_data']).toEqual(tab.json['extra_data']);
  });

  it('moves an entry one step, staying in bounds', () => {
    expect(moveInOrder([0, 1, 2], 1, -1)).toEqual([1, 0, 2]);
    expect(moveInOrder([0, 1, 2], 2, 1)).toEqual([0, 1, 2]);
    expect(moveInOrder([0, 1, 2], 0, -1)).toEqual([0, 1, 2]);
  });
});

describe('widgets to pick', () => {
  const sample = dashboardFromJson(fixture);
  const sampleTab = sample.widgets.find(widget => widget.id === 12) as TabWidget;

  it('offers the dashboard widgets that are not tabs or in one', () => {
    const ids = widgetsToAdd(sample, sampleTab).map(widget => widget.id);
    expect(ids).not.toContain(12);
    expect(ids).not.toContain(11);
    expect(ids).toContain(10);
  });

  it('offers filters only to a filter panel', () => {
    const filters = dashboardFromJson(filtersFixture);
    const panel = widgetFromJson({ ...newFilterPanelJson(), id: 99 }) as TabWidget;
    const offered = widgetsToAdd(filters, panel);
    expect(offered.length).toBeGreaterThan(0);
    expect(offered.every(widget => widget.kind === 'chart')).toBe(true);
    expect(offered.map(widget => widget.id)).not.toContain(20);
  });

  it("lists a tab's widgets", () => {
    expect(widgetsOfTab(sample, sampleTab, 0).map(widget => widget.id)).toEqual([11]);
    expect(widgetsOfTab(sample, sampleTab, 9)).toEqual([]);
  });

  it('labels widgets without a name', () => {
    expect(widgetLabel(widgetFromJson({ class_name: 'text_widget', id: 1, content: '<b>Hello</b> there' }))).toBe('Hello there');
    expect(widgetLabel(widgetFromJson({ class_name: 'chart_v3', id: 2, setting: {} }))).toBe('Untitled chart');
    expect(widgetLabel(widgetFromJson({ class_name: 'chart_v3', id: 2, name: 'Sales', setting: {} }))).toBe('Sales');
  });
});

describe('tab menus', () => {
  const handlers = (): TabEditHandlers => ({
    addTab: vi.fn<TabEditHandlers['addTab']>(),
    renameTab: vi.fn<TabEditHandlers['renameTab']>(),
    addWidgets: vi.fn<TabEditHandlers['addWidgets']>(),
    removeWidgets: vi.fn<TabEditHandlers['removeWidgets']>(),
    deleteTab: vi.fn<TabEditHandlers['deleteTab']>(),
    sortTabs: vi.fn<TabEditHandlers['sortTabs']>(),
    configTab: vi.fn<TabEditHandlers['configTab']>(),
    remove: vi.fn<TabEditHandlers['remove']>()
  });
  type Item = { key?: string; disabled?: boolean; onClick?: () => void; children?: Item[] };
  const flat = (items: unknown[]): Item[] => (items as Item[]).flatMap(item => [item, ...(item.children ?? [])]).filter(item => item.key);

  it("offers the tab widget's own items", () => {
    const all = handlers();
    const items = flat(tabWidgetMenuItems(tab, OWNER_PERMISSIONS, all));
    expect(items.map(item => item.key)).toEqual(['add-tab', 'sort', 'config-tab', 'delete']);
    items.find(item => item.key === 'add-tab')!.onClick!();
    expect(all.addTab).toHaveBeenCalledWith(tab);
  });

  it('acts on one tab from its own menu', () => {
    const all = handlers();
    const items = flat(tabItemMenuItems(tab, 1, OWNER_PERMISSIONS, all));
    expect(items.map(item => item.key)).toEqual(['rename-tab', 'add-widgets', 'remove-widgets', 'delete-tab']);
    items.find(item => item.key === 'delete-tab')!.onClick!();
    expect(all.deleteTab).toHaveBeenCalledWith(tab, 1);
  });

  it('has no tab menu for a tab that does not exist', () => {
    expect(tabItemMenuItems(tab, 5, OWNER_PERMISSIONS, handlers())).toEqual([]);
  });

  it("works on a filter panel's one tab", () => {
    const panel = widgetFromJson({ ...newFilterPanelJson(), id: 9 }) as TabWidget;
    const items = flat(tabWidgetMenuItems(panel, OWNER_PERMISSIONS, handlers()));
    expect(items.map(item => item.key)).toEqual(['rename-tab', 'add-filters', 'remove-filters', 'config-panel', 'delete']);
    expect(items.find(item => item.key === 'remove-filters')!.disabled).toBe(true);
  });

  it('disables edits without the permission', () => {
    const items = flat(tabWidgetMenuItems(tab, permissionsOf(['delete']), handlers()));
    expect(items.find(item => item.key === 'add-tab')!.disabled).toBe(true);
    expect(items.find(item => item.key === 'delete')!.disabled).toBe(false);
    expect(flat(tabItemMenuItems(tab, 0, permissionsOf(['delete']), handlers())).every(item => item.disabled)).toBe(true);
  });
});

describe('tab style', () => {
  it("reads v1's header and Apply button, with defaults", () => {
    expect(tabHeaderStyleOf(tab)).toEqual({
      position: 'horizontal',
      fontSize: '14px',
      color: 'var(--text-color)',
      activeBackground: 'var(--tab-widget-background-active)',
      inactiveBackground: 'var(--tab-widget-background-deactive)'
    });
    const panel = widgetFromJson({ ...newFilterPanelJson(), id: 9 }) as TabWidget;
    expect(applyButtonStyleOf(panel)).toEqual({ title: 'Apply', color: 'var(--accent-text-color)', background: 'var(--accent)' });
  });

  it('writes them back over the stored JSON', () => {
    const header = { ...tabHeaderStyleOf(tab), position: 'vertical' as const, fontSize: '16px' };
    const json = withTabStyle(tab, header, { title: 'Go', color: '#fff', background: '#000' });
    const written = widgetFromJson(json) as TabWidget;
    expect(tabHeaderStyleOf(written)).toEqual(header);
    expect(applyButtonStyleOf(written).title).toBe('Go');
    expect(json['extra_data']).toMatchObject({ current_chart_type: 'tab', header: { font_family: 'Roboto' } });
  });
});
