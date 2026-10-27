import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from './Dashboard';
import { nestedWidgetIds, widgetFromJson } from './Widget';
// `GET dashboards/1` of the sample dashboard on the local backend (KPI, column, pie, tab filter, text, tab with a pie).
import fixture from './dashboard.fixture.json';

describe('dashboardFromJson', () => {
  const dashboard = dashboardFromJson(fixture);

  it('reads the dashboard fields', () => {
    expect(dashboard).toMatchObject({ id: 1, name: 'v2 Sample', ownerId: 'root' });
    // Created without a setting: v1 defaults.
    expect(dashboard.setting.themeName).toBe('light_default');
  });

  it('gives a dashboard without a stored setting the all time main date, and keeps the stored JSON empty', () => {
    expect(fixture).not.toHaveProperty('setting');
    expect(dashboard.setting.mainDateFilter).toMatchObject({ id: -99887766, mode: 'all_time' });
    expect(dashboard.settingJson).toEqual({});
  });

  it('has no main date for a stored setting without one, and keeps the setting as stored', () => {
    const stored = { theme_name: 'light_theme1', unknown_key: { a: 1 } };
    const read = dashboardFromJson({ ...fixture, setting: stored });
    expect(read.setting.mainDateFilter).toBeUndefined();
    expect(read.settingJson).toEqual(stored);
  });

  it('reads a stored main date filter', () => {
    const read = dashboardFromJson({ ...fixture, setting: { main_date_filter: { id: -99887766, mode: 'last_7_days' } } });
    expect(read.setting.mainDateFilter).toMatchObject({ mode: 'last_7_days' });
  });

  it('reads every widget with its kind', () => {
    expect(dashboard.widgets.map(widget => [widget.id, widget.kind])).toEqual([
      [3, 'chart'],
      [4, 'chart'],
      [6, 'chart'],
      [8, 'chart'],
      [10, 'text'],
      [11, 'chart'],
      [12, 'tab'],
      [7, 'chart']
    ]);
  });

  it('keeps the chart setting as stored', () => {
    const chart = dashboard.widgets.find(widget => widget.id === 4);
    expect(chart?.kind === 'chart' && chart.setting['class_name']).toBe('series_chart_setting');
    expect(chart?.json).toBe(fixture.widgets[1]);
  });

  it('reads positions keyed by widget id', () => {
    expect(dashboard.positions[12]).toEqual({ row: 25, column: 30, width: 18, height: 14, zIndex: 0 });
  });

  it('finds the widgets that live in tabs', () => {
    expect([...nestedWidgetIds(dashboard.widgets)]).toEqual([11]);
  });
});

describe('widgetFromJson', () => {
  it('reads text widgets', () => {
    expect(widgetFromJson({ class_name: 'text_widget', id: 1, name: 'Note', content: '<b>x</b>', is_html_render: true })).toMatchObject({
      kind: 'text',
      content: '<b>x</b>',
      isHtmlRender: true
    });
  });

  it('tells filter panels from tabs', () => {
    const json = { class_name: 'tab_widget', id: 2, tab_items: [{ name: 'A', widget_ids: [5, 6], options: {} }] };
    expect(widgetFromJson(json)).toMatchObject({ kind: 'tab', tabItems: [{ name: 'A', widgetIds: [5, 6] }] });
    expect(widgetFromJson({ ...json, extra_data: { current_chart_type: 'filter_panel' } }).kind).toBe('filter_panel');
  });

  it('reads the inner filter of a chart, its id from the chart', () => {
    const widget = widgetFromJson({ class_name: 'chart_v3', id: 3, setting: {}, chart_filter: { class_name: 'chart_v3', id: -13, setting: {} } });
    expect(widget.kind === 'chart' && widget.chartFilter?.id).toBe(-13);
    // A copy v1 made kept its original's inner filter id.
    const copy = widgetFromJson({ class_name: 'chart_v3', id: 40, setting: {}, chart_filter: { class_name: 'chart_v3', id: -13, setting: {} } });
    expect(copy.kind === 'chart' && copy.chartFilter?.id).toBe(-50);
  });

  it('keeps unknown widgets as unsupported', () => {
    expect(widgetFromJson({ class_name: 'link_widget', id: 4 })).toMatchObject({ kind: 'unsupported', className: 'link_widget' });
  });
});
