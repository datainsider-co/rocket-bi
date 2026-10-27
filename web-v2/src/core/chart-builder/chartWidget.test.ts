import { describe, expect, it } from 'vitest';
import { asRecord, type JsonObject } from '@/core/json/json';
import { chartSizeOf, chartWidgetJson, newChartPosition, withChartFilter, withoutChartFilter } from './chartWidget';
import sent from './builderRequests.fixture.json';

const bodies = sent as Record<string, JsonObject>;

const body = (key: string): JsonObject => {
  const found = bodies[key];
  if (!found) throw new Error(`no body ${key}`);
  return found;
};

const built = (key: string, stored?: JsonObject) => chartWidgetJson({ stored, setting: asRecord(body(key)['setting']), extraData: asRecord(body(key)['extra_data']) });

const setting = (className: string, vizClass: string, options: JsonObject = {}) => ({ class_name: className, options: { class_name: vizClass, options } });

describe('chartWidgetJson', () => {
  it.each(Object.keys(bodies).filter(key => key !== 'inner_filter'))('makes the body v1 sent to add the %s chart', key => {
    expect(built(key)).toEqual(body(key));
  });

  it("keeps the stored chart's id, inner filter and other keys, and its other extra data", () => {
    const stored = { class_name: 'chart_v3', id: 31, name: 'Old', chart_filter: { id: -41 }, extra_data: { geo: 1, current_chart_type: 'pie' } };
    const json = built('column', stored);
    expect(json).toMatchObject({ id: 31, name: 'Untitled chart', chart_filter: { id: -41 } });
    expect(json['extra_data']).toMatchObject({ geo: 1, current_chart_type: 'column' });
  });

  it("falls back to v1's colours without options", () => {
    expect(chartWidgetJson({ setting: { class_name: 'series_chart_setting' }, extraData: {} })).toMatchObject({
      name: '',
      description: '',
      background_color: '#0000001A',
      text_color: '#fff'
    });
  });
});

describe('chartSizeOf', () => {
  it.each([
    ['series', setting('series_chart_setting', 'series_chart_setting'), [16, 10]],
    ['kpi', setting('number_chart_setting', 'number_chart_setting', { theme: 'style_1' }), [16, 8]],
    ['small kpi', setting('number_chart_setting', 'number_chart_setting', { theme: 'style_10' }), [8, 8]],
    ['wide kpi', setting('number_chart_setting', 'number_chart_setting', { theme: 'style_7' }), [15, 5]],
    ['pie', setting('pie_chart_setting', 'pie_chart_setting'), [10, 10]],
    ['semi pie', setting('pie_chart_setting', 'pie_chart_setting', { is_semi_pie: true }), [18, 10]],
    ['slicer', setting('input_control_chart_setting', 'slice_filter_setting'), [12, 4]],
    ['date select', setting('input_control_chart_setting', 'date_select_filter_setting'), [12, 3]],
    ['input', setting('input_control_chart_setting', 'input_filter_setting'), [12, 2]],
    ['tree', setting('tab_control_chart_setting', 'tree_filter_chart_setting'), [12, 8]],
    ['dropdown', setting('tab_control_chart_setting', 'tab_filter_chart_setting', { display_as: 'drop_down' }), [12, 2]],
    ['tab with search', setting('tab_control_chart_setting', 'tab_filter_chart_setting', { display_as: 'normal' }), [12, 4]],
    ['tab without search', setting('tab_control_chart_setting', 'tab_filter_chart_setting', { display_as: 'normal', search: { enabled: false } }), [12, 2]],
    ['choice in a column', setting('tab_control_chart_setting', 'tab_filter_chart_setting', { display_as: 'single_choice', direction: 'column' }), [12, 8]],
    ['tab of unknown display', setting('tab_control_chart_setting', 'tab_filter_chart_setting'), [16, 10]]
  ])('sizes a %s', (_name, value, size) => {
    expect(chartSizeOf(value)).toEqual(size);
  });

  it('sizes the charts of the fixture', () => {
    expect(chartSizeOf(asRecord(body('pie')['setting']))).toEqual([10, 10]);
    expect(chartSizeOf(asRecord(body('slicer')['setting']))).toEqual([12, 4]);
  });
});

describe('newChartPosition', () => {
  it('leaves the slot to the grid', () => {
    expect(newChartPosition(asRecord(body('number')['setting']))).toEqual({ row: -1, column: -1, width: 16, height: 8, zIndex: 1 });
  });
});

describe('withChartFilter and withoutChartFilter', () => {
  it('adds the inner filter v1 sent, with an id following the chart', () => {
    const filter = chartWidgetJson({ setting: asRecord(body('inner_filter')['setting']), extraData: asRecord(body('inner_filter')['extra_data']) });
    expect(withChartFilter({ id: 31, name: 'Revenue' }, filter, 31)).toEqual({ id: 31, name: 'Revenue', chart_filter: body('inner_filter') });
  });

  it('removes the inner filter only', () => {
    expect(withoutChartFilter({ id: 31, chart_filter: { id: -41 } })).toEqual({ id: 31 });
  });
});
