import { describe, expect, it, vi } from 'vitest';
import { canExportSetting, LOAD_MORE_DASHBOARDS_KEY, pointMenuItems, widgetMenuItems, type PointMenuHandlers, type WidgetMenuHandlers } from './chartMenus.utils';

type Item = { key: string; label?: string; disabled?: boolean; onClick?: () => void; children?: Item[] };
const keys = (items: unknown[]) => (items as Item[]).map(item => item.key);
const find = (items: unknown[], key: string) => (items as Item[]).find(item => item.key === key)!;

const region = { label: 'region', field: { field_name: 'region' }, isDate: false };
const shipDate = { label: 'ship_date', field: { field_name: 'ship_date' }, isDate: true };

function pointHandlers() {
  return {
    useAsFilter: vi.fn<PointMenuHandlers['useAsFilter']>(),
    drillDown: vi.fn<PointMenuHandlers['drillDown']>(),
    resetFilter: vi.fn<() => void>(),
    resetDrill: vi.fn<() => void>(),
    drillThrough: vi.fn<PointMenuHandlers['drillThrough']>(),
    loadMoreDashboards: vi.fn<() => void>()
  };
}

function widgetHandlers() {
  return { zoom: vi.fn<WidgetMenuHandlers['zoom']>(), resetDrill: vi.fn<() => void>(), download: vi.fn<WidgetMenuHandlers['download']>() };
}

describe('pointMenuItems', () => {
  it('uses the value as a filter and drills into fields or date parts', () => {
    const handlers = pointHandlers();
    const items = pointMenuItems({ value: 'Asia', drill: { fields: [region, shipDate], loading: false }, canResetFilter: false, canResetDrill: true }, handlers);
    expect(keys(items)).toEqual(['filter', 'drill', 'reset-filter', 'reset-drill']);
    expect(find(items, 'reset-filter').disabled).toBe(true);

    find(items, 'filter').onClick!();
    expect(handlers.useAsFilter).toHaveBeenCalledWith('Asia');
    const drill = find(items, 'drill').children!;
    drill[0]!.onClick!();
    expect(handlers.drillDown).toHaveBeenCalledWith('Asia', region);
    drill[1]!.children![0]!.onClick!();
    expect(handlers.drillDown).toHaveBeenLastCalledWith('Asia', shipDate, 'to_year');
  });

  it('says when fields load or there are none, and hides what does not apply', () => {
    const loading = pointMenuItems({ value: 'a', drill: { fields: [], loading: true }, canResetFilter: true, canResetDrill: false }, pointHandlers());
    expect(find(loading, 'drill').children).toEqual([{ key: 'drill:loading', label: 'Loading...', disabled: true }]);
    const none = pointMenuItems({ value: 'a', drill: { fields: [], loading: false }, canResetFilter: true, canResetDrill: false }, pointHandlers());
    expect(find(none, 'drill').children![0]!.label).toBe('No field to drill down');
    expect(keys(pointMenuItems({ value: 'a', canResetFilter: true, canResetDrill: false }, pointHandlers()))).toEqual(['filter', 'reset-filter']);
  });
});

describe('pointMenuItems drill through', () => {
  const base = { value: 'Asia', canResetFilter: false, canResetDrill: false };
  const sales = { id: 2, name: 'Sales' };

  it('opens a listed dashboard and loads more on demand', () => {
    const handlers = pointHandlers();
    const items = pointMenuItems({ ...base, drillThrough: { dashboards: [sales], loading: false, hasMore: true } }, handlers);
    expect(keys(items)).toEqual(['filter', 'drill-through', 'reset-filter']);
    const [target, more] = find(items, 'drill-through').children!;
    target!.onClick!();
    expect(handlers.drillThrough).toHaveBeenCalledWith(sales);
    expect(more).toMatchObject({ key: LOAD_MORE_DASHBOARDS_KEY, label: 'Load more' });
    more!.onClick!();
    expect(handlers.loadMoreDashboards).toHaveBeenCalled();
  });

  it('says when dashboards load or there are none', () => {
    const children = (drillThrough: { dashboards: (typeof sales)[]; loading: boolean; hasMore: boolean }) =>
      find(pointMenuItems({ ...base, drillThrough }, pointHandlers()), 'drill-through').children!;
    expect(children({ dashboards: [], loading: true, hasMore: false })[0]).toMatchObject({ label: 'Loading...', disabled: true });
    expect(children({ dashboards: [], loading: false, hasMore: false })[0]!.label).toBe('No dashboard to drill through');
    expect(children({ dashboards: [sales], loading: true, hasMore: true })[1]).toMatchObject({ label: 'Loading...', disabled: true });
    expect(children({ dashboards: [sales], loading: false, hasMore: false })).toHaveLength(1);
  });
});

describe('widgetMenuItems', () => {
  it('offers date functions, reset and downloads', () => {
    const handlers = widgetHandlers();
    const items = widgetMenuItems({ zoomLevel: 'to_year', canResetDrill: true, canExport: true }, handlers);
    expect(keys(items)).toEqual(['zoom', 'reset-drill', 'csv', 'xlsx']);
    const levels = find(items, 'zoom').children!;
    expect(levels.find(item => item.key === 'zoom:to_year')!.disabled).toBe(true);
    levels.find(item => item.key === 'zoom:to_month')!.onClick!();
    expect(handlers.zoom).toHaveBeenCalledWith('to_month');
    find(items, 'xlsx').onClick!();
    expect(handlers.download).toHaveBeenCalledWith('xlsx');
  });

  it('is empty when nothing applies', () => {
    expect(widgetMenuItems({ canResetDrill: false, canExport: false }, widgetHandlers())).toEqual([]);
  });
});

describe('canExportSetting', () => {
  it('excludes KPIs and filters', () => {
    expect(canExportSetting({ class_name: 'series_chart_setting' }, false)).toBe(true);
    expect(canExportSetting({ class_name: 'number_chart_setting' }, false)).toBe(false);
    expect(canExportSetting({ class_name: 'tab_filter_chart_setting' }, true)).toBe(false);
  });
});
