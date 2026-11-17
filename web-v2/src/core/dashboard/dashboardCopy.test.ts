import { describe, expect, it, vi } from 'vitest';
import { DirectoryType } from '@/core/directory/Directory';
import type { JsonObject } from '@/core/json/json';
import { dashboardFromJson } from './Dashboard';
import type { DashboardService } from './DashboardService';
import { copyDashboard, copyName, copyRequest, CopyTabsError, tabsWithNewIds } from './dashboardCopy';
import { widgetFromJson } from './Widget';

/** `GET dashboards/1` of the local backend ("v2 Sample"), cut down to what a copy reads. */
const SOURCE: JsonObject = {
  id: 1,
  name: 'v2 Sample',
  owner_id: 'root',
  boost_info: { enable: false },
  main_date_filter: { mode: 'last_7_days' },
  setting: { theme_name: 'light_theme1', padding: 0 },
  widgets: [
    { class_name: 'text_widget', id: 3, content: 'a' },
    { class_name: 'text_widget', id: 4, content: 'b', extra_data: { origin: 999, keep: true } },
    { class_name: 'chart_v3', id: 11, setting: {} },
    { class_name: 'tab_widget', id: 12, tab_items: [{ name: 'Pie', widget_ids: [11] }, { name: 'Empty', widget_ids: [] }], extra_data: { current_chart_type: 'tab' } },
    { class_name: 'tab_widget', id: 30, tab_items: [{ name: 'Tile', widget_ids: [3, 4], options: { a: 1 } }], extra_data: { current_chart_type: '' } }
  ],
  widget_positions: { '3': { row: 0, column: 0, width: 4, height: 2, z_index: 0 } }
};

/**
 * What the local backend answered to the copy of `SOURCE`: new ids in another order, `extra_data.origin` kept, tabs
 * still naming the source's widgets.
 */
const CREATED_WIDGETS: JsonObject[] = [
  { class_name: 'tab_widget', id: 111, tab_items: [{ name: 'Pie', widget_ids: [11] }, { name: 'Empty', widget_ids: [] }], extra_data: { current_chart_type: 'tab', origin: 12 } },
  { class_name: 'text_widget', id: 104, content: 'a', extra_data: { origin: 3 } },
  { class_name: 'chart_v3', id: 112, setting: {}, extra_data: { origin: 11 } },
  { class_name: 'tab_widget', id: 110, tab_items: [{ name: 'Tile', widget_ids: [3, 4], options: { a: 1 } }], extra_data: { current_chart_type: '', origin: 30 } },
  { class_name: 'text_widget', id: 114, content: 'b', extra_data: { origin: 4, keep: true } }
];

describe('copyName', () => {
  it('names the copy after its source, like v1', () => {
    expect(copyName('Sales')).toBe('Sales copy');
    expect(copyName('')).toBe(' copy');
  });
});

describe('copyRequest', () => {
  const target = { name: 'v2 Sample copy', parentDirectoryId: -1, directoryType: DirectoryType.Dashboard };

  it('copies the widgets, positions, setting and what v2 does not model', () => {
    expect(copyRequest(SOURCE, target)).toMatchObject({
      name: 'v2 Sample copy',
      parent_directory_id: -1,
      directory_type: 'dashboard',
      main_date_filter: { mode: 'last_7_days' },
      widget_positions: SOURCE['widget_positions'],
      setting: { theme_name: 'light_theme1', padding: 0 },
      boost_info: { enable: false }
    });
  });

  it('marks every widget with its own id, over an origin left by an earlier copy', () => {
    const widgets = copyRequest(SOURCE, target)['widgets'] as JsonObject[];
    expect(widgets.map(widget => (widget['extra_data'] as JsonObject)['origin'])).toEqual([3, 4, 11, 12, 30]);
    expect(widgets[1]).toMatchObject({ id: 4, content: 'b', extra_data: { origin: 4, keep: true } });
    expect(widgets[3]).toMatchObject({ extra_data: { current_chart_type: 'tab', origin: 12 }, tab_items: [{ widget_ids: [11] }, { widget_ids: [] }] });
  });

  it('copies a saved query as a saved query', () => {
    expect(copyRequest(SOURCE, { ...target, directoryType: DirectoryType.Query })).toMatchObject({ directory_type: 'queries' });
  });

  it('sends no setting and no widgets for a source that has none', () => {
    const request = copyRequest({ id: 2, name: 'Empty' }, target);
    expect(request).toMatchObject({ widgets: [], widget_positions: {} });
    expect(request['setting']).toBeUndefined();
    expect(request['boost_info']).toBeUndefined();
  });

  it('does not change the source', () => {
    const before = structuredClone(SOURCE);
    copyRequest(SOURCE, target);
    expect(SOURCE).toEqual(before);
  });
});

describe('tabsWithNewIds', () => {
  const widgets = CREATED_WIDGETS.map(widgetFromJson);

  it('points each tab at the copies of its children and keeps the rest of the widget', () => {
    expect(tabsWithNewIds(widgets)).toEqual([
      { ...CREATED_WIDGETS[0], tab_items: [{ name: 'Pie', widget_ids: [112] }, { name: 'Empty', widget_ids: [] }] },
      { ...CREATED_WIDGETS[3], tab_items: [{ name: 'Tile', widget_ids: [104, 114], options: { a: 1 } }] }
    ]);
  });

  it('fixes a filter panel too', () => {
    const panel = { class_name: 'tab_widget', id: 20, tab_items: [{ name: 'Filter panel', widget_ids: [3] }], extra_data: { current_chart_type: 'filter_panel', origin: 15 } };
    const filter = { class_name: 'chart_v3', id: 21, setting: {}, extra_data: { origin: 3 } };
    expect(tabsWithNewIds([panel, filter].map(widgetFromJson))).toMatchObject([{ id: 20, tab_items: [{ widget_ids: [21] }] }]);
  });

  it('leaves out the tabs that have nothing to change', () => {
    const fixed = tabsWithNewIds(widgets).map(widgetFromJson);
    const others = widgets.filter(widget => widget.kind !== 'tab');
    expect(tabsWithNewIds([...fixed, ...others])).toEqual([]);
    expect(tabsWithNewIds([widgetFromJson({ class_name: 'tab_widget', id: 5, tab_items: [{ name: 'Empty', widget_ids: [] }] })])).toEqual([]);
  });

  it('keeps the ids it knows no copy of', () => {
    const tab = { class_name: 'tab_widget', id: 7, tab_items: [{ name: 'Mixed', widget_ids: [3, 77] }], extra_data: { origin: 6 } };
    const child = { class_name: 'text_widget', id: 8, extra_data: { origin: 3 } };
    expect(tabsWithNewIds([tab, child].map(widgetFromJson))).toMatchObject([{ tab_items: [{ widget_ids: [8, 77] }] }]);
  });

  it('finds nothing in a dashboard that is not a copy', () => {
    expect(tabsWithNewIds((SOURCE['widgets'] as JsonObject[]).filter(widget => widget['id'] !== 4).map(widgetFromJson))).toEqual([]);
    expect(tabsWithNewIds([])).toEqual([]);
  });

  it('does not change the widgets it is given', () => {
    const before = structuredClone(CREATED_WIDGETS);
    tabsWithNewIds(widgets);
    expect(CREATED_WIDGETS).toEqual(before);
  });
});

describe('copyDashboard', () => {
  type EditWidget = DashboardService['editWidget'];

  function setup(editWidget = vi.fn<EditWidget>(async () => {})) {
    const created = dashboardFromJson({ id: 16, name: 'v2 Sample copy', owner_id: 'root', widgets: CREATED_WIDGETS, widget_positions: {} });
    const dashboards = {
      getJson: vi.fn<DashboardService['getJson']>(async () => SOURCE),
      createFrom: vi.fn<DashboardService['createFrom']>(async () => created),
      editWidget
    };
    return { dashboards, created };
  }

  it('creates the copy in the folder, then saves its tabs one after another', async () => {
    const order: string[] = [];
    const { dashboards, created } = setup(
      vi.fn<EditWidget>(async (_dashboardId, widget) => {
        order.push(`start ${String(widget['id'])}`);
        await Promise.resolve();
        order.push(`end ${String(widget['id'])}`);
      })
    );

    const copy = await copyDashboard(dashboards, { dashboardId: 1, directoryType: DirectoryType.Dashboard }, 7);

    expect(copy).toBe(created);
    expect(dashboards.getJson).toHaveBeenCalledWith(1);
    expect(dashboards.createFrom).toHaveBeenCalledWith(expect.objectContaining({ name: 'v2 Sample copy', parent_directory_id: 7, directory_type: 'dashboard' }));
    expect(order).toEqual(['start 111', 'end 111', 'start 110', 'end 110']);
    expect(dashboards.editWidget).toHaveBeenCalledWith(16, expect.objectContaining({ id: 110, tab_items: [{ name: 'Tile', widget_ids: [104, 114], options: { a: 1 } }] }));
  });

  it('edits nothing when the copy has no tab to fix', async () => {
    const { dashboards } = setup();
    dashboards.createFrom.mockResolvedValue(dashboardFromJson({ id: 17, name: 'x copy', widgets: [{ class_name: 'text_widget', id: 200, extra_data: { origin: 3 } }] }));
    await copyDashboard(dashboards, { dashboardId: 1, directoryType: DirectoryType.Query }, -1);
    expect(dashboards.createFrom).toHaveBeenCalledWith(expect.objectContaining({ directory_type: 'queries' }));
    expect(dashboards.editWidget).not.toHaveBeenCalled();
  });

  it('says the copy exists when a tab cannot be saved', async () => {
    const { dashboards, created } = setup(vi.fn<EditWidget>(async () => Promise.reject(new Error('boom'))));
    const failure = await copyDashboard(dashboards, { dashboardId: 1, directoryType: DirectoryType.Dashboard }, 7).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(CopyTabsError);
    expect((failure as CopyTabsError).dashboard).toBe(created);
    expect((failure as CopyTabsError).message).toContain('"v2 Sample copy" was created');
    // It stops at the first failure: the server would not take the next edit either.
    expect(dashboards.editWidget).toHaveBeenCalledTimes(1);
  });

  it('creates nothing when the source cannot be read', async () => {
    const { dashboards } = setup();
    dashboards.getJson.mockRejectedValue(new Error('not allowed'));
    await expect(copyDashboard(dashboards, { dashboardId: 1, directoryType: DirectoryType.Dashboard }, 7)).rejects.toThrow('not allowed');
    expect(dashboards.createFrom).not.toHaveBeenCalled();
  });
});
