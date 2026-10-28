import { describe, expect, it } from 'vitest';
import stored from '@/core/chart-builder/builder.fixture.json';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import type { ChartWidget } from '@/core/dashboard/Widget';
import type { ChartBuilderRequest } from '@/features/dashboard/edit/chartBuilderBridge';
import {
  adhocQueryOf,
  adhocViewOf,
  builderControlsOf,
  builderModeOf,
  builderStartOf,
  editedJsonOf,
  pickerKindOf,
  previewJsonOf,
  saveActionOf,
  typeKindOf,
  usedSettingsOf
} from './builderSession.utils';

const dashboard = dashboardFromJson(stored);

const chart = (id: number): ChartWidget => {
  const found = dashboard.widgets.find(widget => widget.id === id);
  if (found?.kind !== 'chart') throw new Error(`no chart ${id}`);
  return found;
};

/** Widget 31 is a column chart with an inner filter; 36 has none. */
const withFilter = chart(31);
const plain = chart(36);

const requests: Record<string, ChartBuilderRequest> = {
  addChart: { kind: 'addChart' },
  configChart: { kind: 'configChart', chart: plain },
  addInnerFilter: { kind: 'addInnerFilter', chart: plain },
  configInnerFilter: { kind: 'configInnerFilter', chart: withFilter }
};

const request = (kind: string): ChartBuilderRequest => {
  const found = requests[kind];
  if (!found) throw new Error(kind);
  return found;
};

describe('builderModeOf, pickerKindOf and typeKindOf', () => {
  it.each([
    ['addChart', 'add', 'chart', 'chart'],
    ['configChart', 'update', undefined, 'chart'],
    ['addInnerFilter', 'add', undefined, 'inner_filter'],
    ['configInnerFilter', 'update', undefined, 'inner_filter']
  ])('%s: %s, picker %s, types %s', (kind, mode, picker, types) => {
    expect(builderModeOf(request(kind))).toBe(mode);
    expect(pickerKindOf(request(kind))).toBe(picker);
    expect(typeKindOf(request(kind))).toBe(types);
  });
});

describe('editedJsonOf and builderStartOf', () => {
  it('edits the chart, or its inner filter', () => {
    expect(editedJsonOf(request('configChart'))).toBe(plain.json);
    expect(editedJsonOf(request('configInnerFilter'))).toBe(withFilter.chartFilter?.json);
    expect(builderStartOf(request('configChart'), 'pie')).toEqual({ widget: plain.json });
  });

  it('starts a new chart on the picked type, a new inner filter as a dropdown', () => {
    expect(editedJsonOf(request('addChart'))).toBeUndefined();
    expect(builderStartOf(request('addChart'), 'pie')).toEqual({ chartType: 'pie' });
    expect(builderStartOf(request('addInnerFilter'), 'pie')).toEqual({ chartType: 'drop_down_filter' });
  });

  it('has nothing to edit for a chart without inner filter', () => {
    expect(editedJsonOf({ kind: 'configInnerFilter', chart: plain })).toBeUndefined();
    expect(usedSettingsOf({ kind: 'configInnerFilter', chart: plain }, dashboard)).toEqual([]);
  });
});

describe('usedSettingsOf', () => {
  it("reads the dashboard's charts for a new chart, else the chart at hand", () => {
    expect(usedSettingsOf(request('addChart'), dashboard)).toHaveLength(dashboard.widgets.filter(widget => widget.kind === 'chart').length);
    expect(usedSettingsOf(request('configChart'), dashboard)).toEqual([plain.setting]);
    expect(usedSettingsOf(request('addInnerFilter'), dashboard)).toEqual([plain.setting]);
    expect(usedSettingsOf(request('configInnerFilter'), dashboard)).toEqual([withFilter.chartFilter?.setting]);
  });
});

describe('builderControlsOf', () => {
  it('offers every other chart to a chart', () => {
    const all = builderControlsOf(request('addChart'), dashboard);
    const others = builderControlsOf(request('configChart'), dashboard);
    expect(all.map(control => control.id)).toContain(36);
    expect(others.map(control => control.id)).not.toContain(36);
    expect(others).toHaveLength(all.length - 1);
  });

  it('offers none to an inner filter, as v1', () => {
    expect(builderControlsOf(request('addInnerFilter'), dashboard)).toEqual([]);
    expect(builderControlsOf(request('configInnerFilter'), dashboard)).toEqual([]);
  });
});

describe('adhocViewOf and adhocQueryOf', () => {
  const setting = {
    sql_views: [{ class_name: 'sql_view', alias_name: 'adhoc_1', query: { class_name: 'sql_query', query: 'select * from t where a = {{ limit }} and b = {{limit}} -- {{other}}' } }],
    parameters: { limit: '$10' }
  };

  it("reads an ad hoc chart's view", () => {
    expect(adhocViewOf(setting)).toEqual({ name: 'adhoc_1', query: setting.sql_views[0]?.query.query });
  });

  it('reads no view for a chart on tables, or an empty query', () => {
    expect(adhocViewOf({ sql_views: [] })).toBeUndefined();
    expect(adhocViewOf({})).toBeUndefined();
    expect(adhocViewOf({ sql_views: [{ alias_name: 'v', query: { query: '' } }] })).toBeUndefined();
  });

  it('puts the stored parameter values in, leaving unknown ones', () => {
    const view = adhocViewOf(setting);
    if (!view) throw new Error('no view');
    expect(adhocQueryOf(view, setting)).toBe('select * from t where a = $10 and b = $10 -- {{other}}');
  });
});

describe('saveActionOf', () => {
  const setting = { class_name: 'pie_chart_setting', options: { class_name: 'highcharts_pie_chart_setting', options: { title: { text: 'Share' } } } };
  const extraData = { configs: {}, filters: {}, current_chart_type: 'pie' };

  it('creates a new chart in a free slot', () => {
    const action = saveActionOf(request('addChart'), setting, extraData);
    expect(action).toMatchObject({ kind: 'create', json: { id: -1, name: 'Share', setting }, position: { row: -1, column: -1, width: 10, height: 10 } });
  });

  it('updates an edited chart, keeping its id', () => {
    expect(saveActionOf(request('configChart'), setting, extraData)).toMatchObject({ kind: 'update', json: { id: 36, name: 'Share' } });
  });

  it('saves an inner filter within its chart', () => {
    const added = saveActionOf(request('addInnerFilter'), setting, extraData);
    expect(added).toMatchObject({ kind: 'update', json: { id: 36, chart_filter: { id: -46, setting } } });
    const updated = saveActionOf(request('configInnerFilter'), setting, extraData);
    expect(updated).toMatchObject({ kind: 'update', json: { id: 31, chart_filter: { id: -41, setting } } });
  });
});

describe('previewJsonOf', () => {
  const setting = { class_name: 'pie_chart_setting', options: {} };

  it("shows the chart under the edited widget's id", () => {
    expect(previewJsonOf(request('addChart'), setting, {})['id']).toBe(-1);
    expect(previewJsonOf(request('configChart'), setting, {})['id']).toBe(36);
    expect(previewJsonOf(request('addInnerFilter'), setting, {})['id']).toBe(-46);
    expect(previewJsonOf(request('configInnerFilter'), setting, {})).toMatchObject({ id: -41, setting });
  });
});
