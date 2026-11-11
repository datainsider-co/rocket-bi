import { describe, expect, it, vi } from 'vitest';
import { canExportSetting, chartMenuItems, dimensionMenuItems, drillThroughMenuItems, LOAD_MORE_DASHBOARDS_KEY, staysOpen, zoomMenuItems, type ChartMenuHandlers, type ChartMenuInput } from './chartMenus.utils';

type Item = { key: string; label?: string; disabled?: boolean; onClick?: () => void; children?: Item[] };
const keys = (items: unknown[]) => (items as Item[]).map(item => item.key);
const find = (items: unknown[], key: string) => (items as Item[]).find(item => item.key === key)!;

function handlers() {
  return {
    useAsFilter: vi.fn<ChartMenuHandlers['useAsFilter']>(),
    zoom: vi.fn<ChartMenuHandlers['zoom']>(),
    pickValue: vi.fn<ChartMenuHandlers['pickValue']>(),
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

describe('chartMenuItems on the card', () => {
  it('asks for a value before filtering or drilling through, in v1 order', () => {
    const on = handlers();
    const items = chartMenuItems({ ...nothing, canDrill: true, pickFor: ['filter', 'drill-through'], canResetFilter: true }, on);
    expect(keys(items)).toEqual(['pick:filter', 'drill', 'pick:drill-through', 'reset-filter']);
    expect(find(items, 'pick:filter').label).toBe('Use as a filter');

    find(items, 'pick:filter').onClick!();
    find(items, 'pick:drill-through').onClick!();
    expect(on.pickValue.mock.calls).toEqual([['filter'], ['drill-through']]);
    expect(on.useAsFilter).not.toHaveBeenCalled();
  });

  it('lists only the picks that apply', () => {
    expect(keys(chartMenuItems({ ...nothing, pickFor: ['filter'] }, handlers()))).toEqual(['pick:filter']);
    expect(keys(chartMenuItems({ ...nothing, pickFor: [] }, handlers()))).toEqual([]);
  });

  it('needs no pick on a clicked point', () => {
    expect(keys(chartMenuItems({ ...nothing, value: 'Asia', pickFor: ['filter', 'drill-through'] }, handlers()))).toEqual(['filter']);
  });
});

describe('dimensionMenuItems', () => {
  const group = (items: unknown[]) => (items as Item[])[0]!;

  it('lists the values once each, sorted, under a title', () => {
    const values = ['Europe', 'Asia', 'Europe', ''];
    const items = dimensionMenuItems(values, vi.fn<(value: string) => void>());
    expect(group(items)).toMatchObject({ key: 'dimensions', label: 'Select a dimension' });
    expect(group(items).children!.map(item => item.label)).toEqual(['--', 'Asia', 'Europe']);
    expect(values).toEqual(['Europe', 'Asia', 'Europe', '']);
  });

  it('picks the clicked value and closes the menu', () => {
    const onPick = vi.fn<(value: string) => void>();
    const [asia] = group(dimensionMenuItems(['Asia'], onPick)).children!;
    asia!.onClick!();
    expect(onPick).toHaveBeenCalledWith('Asia');
    expect(staysOpen(asia!.key)).toBe(false);
  });

  it('keeps the menu open when a step follows the pick', () => {
    const [asia] = group(dimensionMenuItems(['Asia'], vi.fn<(value: string) => void>(), true)).children!;
    expect(staysOpen(asia!.key)).toBe(true);
  });

  it('is an empty group without values', () => {
    expect(group(dimensionMenuItems([], vi.fn<(value: string) => void>())).children).toEqual([]);
  });
});

describe('drillThroughMenuItems', () => {
  it('lists the dashboards at the top level', () => {
    const on = handlers();
    const items = drillThroughMenuItems({ dashboards: [sales], loading: false, hasMore: true }, on);
    expect(keys(items)).toEqual(['drill-through:2', LOAD_MORE_DASHBOARDS_KEY]);
    find(items, 'drill-through:2').onClick!();
    expect(on.drillThrough).toHaveBeenCalledWith(sales);
  });
});

describe('staysOpen', () => {
  it.each([
    [LOAD_MORE_DASHBOARDS_KEY, true],
    ['pick:filter', true],
    ['pick:drill-through', true],
    ['filter', false],
    ['drill-through:2', false],
    ['value:Asia', false]
  ])('%s → %s', (key, open) => {
    expect(staysOpen(key)).toBe(open);
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
