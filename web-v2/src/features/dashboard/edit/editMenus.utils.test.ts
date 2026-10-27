import { describe, expect, it, vi } from 'vitest';
import { widgetFromJson, type ChartWidget, type Widget } from '@/core/dashboard/Widget';
import { OWNER_PERMISSIONS, permissionsOf } from '../access/access.utils';
import { addMenuItems, leavesDashboard, widgetEditMenuItems, type WidgetEditHandlers } from './editMenus.utils';

type Item = { key: string; disabled?: boolean; onClick?: () => void };
const keys = (items: unknown[]) => (items as Item[]).map(item => item.key);
const find = (items: unknown[], key: string) => (items as Item[]).find(item => item.key === key)!;

function handlers(): WidgetEditHandlers {
  return {
    rename: vi.fn<WidgetEditHandlers['rename']>(),
    editText: vi.fn<WidgetEditHandlers['editText']>(),
    replaceImage: vi.fn<WidgetEditHandlers['replaceImage']>(),
    copy: vi.fn<WidgetEditHandlers['copy']>(),
    duplicate: vi.fn<WidgetEditHandlers['duplicate']>(),
    remove: vi.fn<WidgetEditHandlers['remove']>()
  };
}

const chart = widgetFromJson({ class_name: 'chart_v3', id: 1, setting: {} });
const text = widgetFromJson({ class_name: 'text_widget', id: 2 });
const image = widgetFromJson({ class_name: 'image_widget', id: 3 });
const tab = widgetFromJson({ class_name: 'tab_widget', id: 4 });

describe('widgetEditMenuItems', () => {
  it('offers each kind its own items', () => {
    expect(keys(widgetEditMenuItems(chart, OWNER_PERMISSIONS, handlers()))).toEqual(['rename', 'copy', 'duplicate', 'delete']);
    expect(keys(widgetEditMenuItems(text, OWNER_PERMISSIONS, handlers()))).toEqual(['edit-text', 'copy', 'duplicate', 'delete']);
    expect(keys(widgetEditMenuItems(image, OWNER_PERMISSIONS, handlers()))).toEqual(['replace-image', 'duplicate', 'delete']);
    expect(keys(widgetEditMenuItems(tab, OWNER_PERMISSIONS, handlers()))).toEqual(['delete']);
  });

  it('adds Config chart once ChartBuilder is there', () => {
    const configChart = vi.fn<(widget: Widget) => void>();
    const items = widgetEditMenuItems(chart, OWNER_PERMISSIONS, { ...handlers(), configChart });
    find(items, 'config').onClick!();
    expect(configChart).toHaveBeenCalledWith(chart);
  });

  it('offers to add an inner filter, or to update and delete the one there', () => {
    const innerFilter = { add: vi.fn<(chart: ChartWidget) => void>(), config: vi.fn<(chart: ChartWidget) => void>(), remove: vi.fn<(chart: ChartWidget) => void>() };
    const withFilter = widgetFromJson({ class_name: 'chart_v3', id: 5, setting: {}, chart_filter: { class_name: 'chart_v3', id: -15, setting: {} } });
    const added = widgetEditMenuItems(chart, OWNER_PERMISSIONS, { ...handlers(), innerFilter });
    expect(keys(added)).toEqual(['rename', 'copy', 'add-inner-filter', 'duplicate', 'delete']);
    find(added, 'add-inner-filter').onClick!();
    expect(innerFilter.add).toHaveBeenCalledWith(chart);
    const existing = widgetEditMenuItems(withFilter, permissionsOf(['view']), { ...handlers(), innerFilter });
    expect(keys(existing)).toEqual(['rename', 'copy', 'config-inner-filter', 'delete-inner-filter', 'duplicate', 'delete']);
    expect(find(existing, 'delete-inner-filter').disabled).toBe(true);
    find(existing, 'config-inner-filter').onClick!();
    expect(innerFilter.config).toHaveBeenCalledWith(withFilter);
  });

  it('disables what the viewer may not do', () => {
    const items = widgetEditMenuItems(chart, permissionsOf(['edit']), handlers());
    expect(find(items, 'rename').disabled).toBe(false);
    expect(find(items, 'copy').disabled).toBe(true);
    expect(find(items, 'delete').disabled).toBe(true);
  });

  it('calls the handler with the widget', () => {
    const all = handlers();
    find(widgetEditMenuItems(text, OWNER_PERMISSIONS, all), 'delete').onClick!();
    expect(all.remove).toHaveBeenCalledWith(text);
  });
});

describe('addMenuItems', () => {
  const base = { addText: vi.fn<() => void>(), addImage: vi.fn<() => void>(), addTab: vi.fn<() => void>(), addFilterPanel: vi.fn<() => void>() };

  it('lists v1 items, Paste disabled without a clipboard', () => {
    const items = addMenuItems(base);
    expect(keys(items)).toEqual(['tab', 'filter-panel', 'text', 'image', 'paste']);
    expect(find(items, 'paste').disabled).toBe(true);
  });

  it('adds Add chart once ChartBuilder is there', () => {
    expect(keys(addMenuItems({ ...base, addChart: vi.fn<() => void>(), paste: vi.fn<() => void>() }))[0]).toBe('chart');
  });
});

describe('leavesDashboard', () => {
  it.each([
    ['/dashboard/new-name-1', false],
    ['/dashboard/1', false],
    ['/dashboard/other-2', true],
    ['/mydata', true]
  ])('%s → %s', (pathname, leaves) => {
    expect(leavesDashboard(pathname, 1)).toBe(leaves);
  });
});
