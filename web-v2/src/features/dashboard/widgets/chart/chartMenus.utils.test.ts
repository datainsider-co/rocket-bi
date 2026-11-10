import { describe, expect, it, vi } from 'vitest';
import { canExportSetting, chartMenuItems, LOAD_MORE_DASHBOARDS_KEY, zoomMenuItems, type ChartMenuHandlers, type ChartMenuInput } from './chartMenus.utils';

type Item = { key: string; label?: string; disabled?: boolean; onClick?: () => void; children?: Item[] };
const keys = (items: unknown[]) => (items as Item[]).map(item => item.key);
const find = (items: unknown[], key: string) => (items as Item[]).find(item => item.key === key)!;

function handlers() {
  return {
    useAsFilter: vi.fn<ChartMenuHandlers['useAsFilter']>(),
    zoom: vi.fn<ChartMenuHandlers['zoom']>(),
    openDrill: vi.fn<() => void>(),
    resetFilter: vi.fn<() => void>(),
    resetDrill: vi.fn<() => void>(),
    drillThrough: vi.fn<ChartMenuHandlers['drillThrough']>(),
    loadMoreDashboards: vi.fn<() => void>(),
    download: vi.fn<ChartMenuHandlers['download']>()
  };
}

const nothing: ChartMenuInput = { canDrill: false, canResetFilter: false, canResetDrill: false, canExport: false };
const sales = { id: 2, name: 'Sales' };

describe('chartMenuItems', () => {
  it('lists everything that applies to a clicked point, in order', () => {
    const on = handlers();
    const items = chartMenuItems(
      { value: 'Asia', zoomLevel: 'to_year', canDrill: true, drillThrough: { dashboards: [sales], loading: false, hasMore: false }, canResetFilter: true, canResetDrill: true, canExport: true },
      on
    );
    expect(keys(items)).toEqual(['filter', 'zoom', 'drill', 'drill-through', 'reset-filter', 'reset-drill', 'csv', 'xlsx']);

    find(items, 'filter').onClick!();
    expect(on.useAsFilter).toHaveBeenCalledWith('Asia');
    find(items, 'drill').onClick!();
    expect(on.openDrill).toHaveBeenCalledOnce();
    find(items, 'xlsx').onClick!();
    expect(on.download).toHaveBeenCalledWith('xlsx');
  });

  it('leaves out what does not apply, as v1 removed its disabled options', () => {
    expect(chartMenuItems(nothing, handlers())).toEqual([]);
    expect(keys(chartMenuItems({ ...nothing, value: 'a' }, handlers()))).toEqual(['filter']);
  });

  it('has no value items for a right click on the card', () => {
    const drillThrough = { dashboards: [sales], loading: false, hasMore: false };
    expect(keys(chartMenuItems({ ...nothing, canDrill: true, drillThrough, canExport: true }, handlers()))).toEqual(['drill', 'csv', 'xlsx']);
  });
});

describe('chartMenuItems drill through', () => {
  const base = { ...nothing, value: 'Asia' };

  it('opens a listed dashboard and loads more on demand', () => {
    const on = handlers();
    const items = chartMenuItems({ ...base, drillThrough: { dashboards: [sales], loading: false, hasMore: true } }, on);
    const [target, more] = find(items, 'drill-through').children!;
    target!.onClick!();
    expect(on.drillThrough).toHaveBeenCalledWith(sales);
    expect(more).toMatchObject({ key: LOAD_MORE_DASHBOARDS_KEY, label: 'Load more' });
    more!.onClick!();
    expect(on.loadMoreDashboards).toHaveBeenCalled();
  });

  it('says when dashboards load or there are none', () => {
    const children = (drillThrough: { dashboards: (typeof sales)[]; loading: boolean; hasMore: boolean }) =>
      find(chartMenuItems({ ...base, drillThrough }, handlers()), 'drill-through').children!;
    expect(children({ dashboards: [], loading: true, hasMore: false })[0]).toMatchObject({ label: 'Loading...', disabled: true });
    expect(children({ dashboards: [], loading: false, hasMore: false })[0]!.label).toBe('No dashboard to drill through');
    expect(children({ dashboards: [sales], loading: true, hasMore: true })[1]).toMatchObject({ label: 'Loading...', disabled: true });
    expect(children({ dashboards: [sales], loading: false, hasMore: false })).toHaveLength(1);
  });
});

describe('zoomMenuItems', () => {
  it('offers every date function but the current one', () => {
    const onZoom = vi.fn<(level: string) => void>();
    const levels = zoomMenuItems('to_year', onZoom);
    expect(find(levels, 'zoom:to_year').disabled).toBe(true);
    find(levels, 'zoom:to_month').onClick!();
    expect(onZoom).toHaveBeenCalledWith('to_month');
  });
});

describe('canExportSetting', () => {
  it('excludes KPIs and filters', () => {
    expect(canExportSetting({ class_name: 'series_chart_setting' }, false)).toBe(true);
    expect(canExportSetting({ class_name: 'number_chart_setting' }, false)).toBe(false);
    expect(canExportSetting({ class_name: 'tab_filter_chart_setting' }, true)).toBe(false);
  });
});
