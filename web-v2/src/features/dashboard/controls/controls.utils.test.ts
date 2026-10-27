import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import { MainDateFilterSetting } from '@/core/dashboard/DashboardSetting';
import fixture from '@/core/dashboard/filters.fixture.json';
import { widgetFromJson, type ChartWidget } from '@/core/dashboard/Widget';
import { DateMode } from '@/core/query/dateRanges';
import { FilterCondition } from '@/core/query/internalFilter';
import {
  MAIN_DATE_ID,
  controlEntryOf,
  controlsReducer,
  defaultControlValues,
  hasChangedControls,
  initialControls,
  initialMainDate,
  mainDateValues,
  panelOfWidgets,
  toStoredMainDate,
  type ControlsState
} from './controls.utils';

const now = new Date(2026, 7, 19);
const dashboard = dashboardFromJson(fixture);

const chart = (vizClass: string, value?: unknown, setting: object = {}) =>
  widgetFromJson({
    class_name: 'chart_v3',
    id: 1,
    setting: { ...setting, options: { class_name: vizClass, options: value === undefined ? {} : { default: { setting: { value } } } } }
  }) as ChartWidget;

describe('defaultControlValues', () => {
  it('reads one value or a list as the selected value', () => {
    expect(defaultControlValues(chart('tab_filter_chart_setting', ['Asia', 'Europe']), now)).toEqual({ selected_value: ['Asia', 'Europe'] });
    expect(defaultControlValues(chart('dropdown_filter_chart_setting', 2020), now)).toEqual({ selected_value: ['2020'] });
  });

  it('has none without a default', () => {
    expect(defaultControlValues(chart('tab_filter_chart_setting'), now)).toBeUndefined();
    expect(defaultControlValues(chart('input_filter_setting', ''), now)).toBeUndefined();
  });

  it('reads a slicer range as start and end', () => {
    expect(defaultControlValues(chart('slice_filter_setting', [10, 20]), now)).toEqual({ min_value: ['10'], max_value: ['20'] });
    expect(defaultControlValues(chart('slice_filter_setting', { from: { value: 1 } }), now)).toBeUndefined();
  });

  it('computes a date select range from its mode or custom dates', () => {
    expect(defaultControlValues(chart('date_select_filter_setting', { mode: 'last_year', dates: [] }), now)).toEqual({
      mode: 'last_year',
      min_value: ['2025-01-01 00:00:00'],
      max_value: ['2025-12-31 23:59:59']
    });
    expect(defaultControlValues(chart('date_select_filter_setting', ['a', 'b']), now)).toEqual({ mode: 'custom', min_value: ['a'], max_value: ['b'] });
    expect(defaultControlValues(chart('date_select_filter_setting', ['a']), now)).toBeUndefined();
    expect(defaultControlValues(chart('date_select_filter_setting', { mode: 'all_time', dates: [] }), now)).toBeUndefined();
  });

  it('reads an input value, not an object', () => {
    expect(defaultControlValues(chart('input_filter_setting', 5000), now)).toEqual({ selected_value: ['5000'] });
    expect(defaultControlValues(chart('input_filter_setting', { a: 1 }), now)).toBeUndefined();
  });

  it('keeps a tree filter keys with their values', () => {
    const tree = { values: [{ name: 'Region' }, { name: 'Country' }] };
    expect(defaultControlValues(chart('tree_filter_chart_setting', { selected_keys: ['Region//Asia'] }, tree), now)).toEqual({
      keys: ['Region//Asia'],
      selected_value: ['Asia']
    });
    expect(defaultControlValues(chart('tree_filter_chart_setting', { selected_keys: ['Region'] }, tree), now)).toEqual({ keys: ['Region'] });
    expect(defaultControlValues(chart('tree_filter_chart_setting', { expanded_keys: [] }, tree), now)).toBeUndefined();
  });

  it('picks the first column of a tab control without default', () => {
    const measure = dashboard.widgets.find(widget => widget.id === 19) as ChartWidget;
    expect(defaultControlValues(measure, now)).toEqual({ selected_value: ['revenue_0'] });
  });
});

describe('main date', () => {
  const setting = new MainDateFilterSetting({ mode: 'last_7_days' });

  it('starts from the stored choice, else the dashboard mode', () => {
    expect(initialMainDate(undefined, undefined)).toBeUndefined();
    expect(initialMainDate(setting, undefined)).toEqual({ mode: DateMode.Last7Days, dates: [] });
    expect(initialMainDate(setting, { mode: 'nope' })).toEqual({ mode: DateMode.Last7Days, dates: [] });
    expect(initialMainDate(setting, { mode: 'custom', chosenDateRange: { start: '2020-01-02T03:00:00', end: '2020-02-01 00:00:00' } })).toEqual({
      mode: DateMode.Custom,
      dates: ['2020-01-02 00:00:00', '2020-02-01 23:59:59']
    });
    expect(initialMainDate(setting, { mode: 'custom', chosenDateRange: { start: 'x', end: 'y' } })).toEqual({ mode: DateMode.Custom, dates: [] });
  });

  it('stores what it reads back', () => {
    const custom = { mode: DateMode.Custom, dates: ['2020-01-02 00:00:00', '2020-02-01 23:59:59'] };
    expect(initialMainDate(setting, toStoredMainDate(custom))).toEqual(custom);
    expect(toStoredMainDate({ mode: DateMode.AllTime, dates: [] })).toEqual({ mode: 'all_time' });
  });

  it('is a start and end, or cleared for all time', () => {
    expect(mainDateValues({ mode: DateMode.LastYear, dates: [] }, now)).toEqual({
      min_value: ['2025-01-01 00:00:00'],
      max_value: ['2025-12-31 23:59:59']
    });
    expect(mainDateValues({ mode: DateMode.AllTime, dates: [] }, now)).toEqual({});
  });
});

describe('initialControls', () => {
  it('starts from the defaults, inner filters and the main date included', () => {
    const inner = widgetFromJson({
      class_name: 'chart_v3',
      id: 5,
      setting: {},
      chart_filter: { class_name: 'chart_v3', id: -15, setting: { options: { options: { default: { setting: { value: ['Asia'] } } } } } }
    });
    const controls = initialControls([inner, chart('tab_filter_chart_setting', ['x'])], { mode: DateMode.LastYear, dates: [] }, now);
    expect(controls).toEqual({
      1: { selected_value: ['x'] },
      [-15]: { selected_value: ['Asia'] },
      [MAIN_DATE_ID]: { min_value: ['2025-01-01 00:00:00'], max_value: ['2025-12-31 23:59:59'] }
    });
    expect(initialControls([], { mode: DateMode.AllTime, dates: [] }, now)).toEqual({});
  });
});

describe('panelOfWidgets', () => {
  it('maps the filter panel children to the panel', () => {
    expect([...panelOfWidgets(dashboard.widgets)]).toEqual([
      [13, 15],
      [14, 15]
    ]);
  });
});

describe('controls state', () => {
  const initial = { 1: { selected_value: ['Asia'] } };
  const state: ControlsState = { controls: initial, pending: {}, headerFilters: [] };

  it('sets, clears and resets controls', () => {
    const changed = controlsReducer(state, { type: 'set', id: 2, values: { selected_value: ['Fruits'] } });
    expect(changed.controls).toEqual({ 1: { selected_value: ['Asia'] }, 2: { selected_value: ['Fruits'] } });
    expect(hasChangedControls(changed, initial)).toBe(true);
    expect(controlsReducer(changed, { type: 'reset', initial, headerFilters: [] }).controls).toEqual(initial);
  });

  it('compares modes and keys too', () => {
    const dated = controlsReducer(state, { type: 'set', id: 3, values: { mode: DateMode.LastYear } });
    expect(hasChangedControls(dated, { ...initial, 3: { mode: DateMode.LastYear } })).toBe(false);
    expect(hasChangedControls(dated, initial)).toBe(true);
  });

  it('treats a cleared control without default as unchanged', () => {
    expect(hasChangedControls(controlsReducer(state, { type: 'set', id: 2, values: {} }), initial)).toBe(false);
    expect(hasChangedControls(controlsReducer(state, { type: 'set', id: 1, values: {} }), initial)).toBe(true);
  });

  it('holds panel changes until the panel applies them', () => {
    const pending = controlsReducer(state, { type: 'set', id: 13, values: { selected_value: ['Online'] }, panelId: 15 });
    expect(pending.controls).toBe(initial);
    expect(controlEntryOf(pending, 13, 15)).toEqual({ selected_value: ['Online'] });
    expect(controlEntryOf(pending, 13, undefined)).toBeUndefined();
    expect(hasChangedControls(pending, initial)).toBe(true);

    const applied = controlsReducer(pending, { type: 'apply', panelId: 15 });
    expect(applied.controls[13]).toEqual({ selected_value: ['Online'] });
    expect(applied.pending).toEqual({});
    expect(controlsReducer(applied, { type: 'apply', panelId: 15 })).toBe(applied);
  });

  it('keeps the main date out of Reset Filters', () => {
    const mainDate = { mode: DateMode.LastYear, dates: [] };
    const dated = controlsReducer(state, { type: 'mainDate', mainDate, values: { min_value: ['a'], max_value: ['b'] } });
    expect(dated.mainDate).toBe(mainDate);
    expect(hasChangedControls(dated, initial)).toBe(false);
    const reset = controlsReducer(dated, { type: 'reset', initial: { ...initial, [MAIN_DATE_ID]: {} }, headerFilters: [] });
    expect(reset.controls).toEqual({ ...initial, [MAIN_DATE_ID]: { min_value: ['a'], max_value: ['b'] } });
    expect(controlsReducer(state, { type: 'reset', initial: { [MAIN_DATE_ID]: {} }, headerFilters: [] }).controls).toEqual({});
  });

  it('drops the main date and its values when it is removed', () => {
    const dated = controlsReducer(state, { type: 'mainDate', mainDate: { mode: DateMode.LastYear, dates: [] }, values: { min_value: ['a'] } });
    const removed = controlsReducer(dated, { type: 'removeMainDate' });
    expect(removed.mainDate).toBeUndefined();
    expect(removed.controls).toEqual(initial);
    expect(dated.controls[MAIN_DATE_ID]).toEqual({ min_value: ['a'] });
  });

  it('edits, removes and resets header filters', () => {
    const region = { id: -1, name: 'Region', field: {}, condition: FilterCondition.In, values: ['Asia'], enabled: true, nested: false };
    const country = { ...region, id: -2, name: 'Country' };
    const opened = { ...state, headerFilters: [region, country] };
    const off = controlsReducer(opened, { type: 'headerFilter', filter: { ...region, enabled: false } });
    expect(off.headerFilters).toEqual([{ ...region, enabled: false }, country]);
    expect(hasChangedControls(off, initial, [region, country])).toBe(true);
    expect(hasChangedControls(opened, initial, [region, country])).toBe(false);

    const removed = controlsReducer(off, { type: 'removeHeaderFilter', id: -2 });
    expect(removed.headerFilters).toEqual([{ ...region, enabled: false }]);
    expect(controlsReducer(removed, { type: 'reset', initial, headerFilters: [region, country] }).headerFilters).toEqual([region, country]);
  });
});
