import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/schema/warehouse.fixture.json';
import { ApiError } from '@/shared/http/ApiError';
import {
  analysisErrorMessage,
  isTabDirty,
  neighbourOf,
  newQueryTab,
  newViewAlias,
  nextTempId,
  rawQueryOf,
  shownChartJson,
  tabLabel,
  tabsOfAnalysis,
  tabWidgetJson,
  withQuery,
  type AnalysisTab
} from './analysis.utils';

const minQty = { displayName: 'min_qty', valueType: 'number', value: '2' };
const v1Widget = fixture.analysisCreate.request.widgets[0]!;
const analysis = dashboardFromJson({
  id: 5,
  name: 'DW0 Analysis',
  owner_id: 'root',
  widgets: [
    { ...v1Widget, id: 21 },
    { class_name: 'text_widget', id: 22 },
    {
      class_name: 'chart_v3',
      id: 23,
      name: 'Qty by name',
      setting: {
        class_name: 'pie_chart_setting',
        sql_views: [{ class_name: 'sql_view', alias_name: 'view_pie', query: { class_name: 'sql_query', query: 'select * from t' } }],
        options: { options: {} }
      }
    }
  ]
});
const alias = (id: number) => `view_${id}`;

describe('rawQueryOf', () => {
  it('reads the raw query, then the view, then the SQL, without v1’s trailing " \\n"', () => {
    expect(rawQueryOf(v1Widget.setting)).toBe('select id, name, qty from dw0_probe.products where qty > {{min_qty}}');
    expect(rawQueryOf({ sql_views: [{ query: { query: 'select 1 ' } }] })).toBe('select 1');
    expect(rawQueryOf({ sql: 'select 2' })).toBe('select 2');
    expect(rawQueryOf({})).toBe('');
  });
});

describe('tabsOfAnalysis', () => {
  it('makes the first chart the query and the others charts, saved as they are', () => {
    const tabs = tabsOfAnalysis(analysis, alias);
    expect(tabs.map(tab => [tab.id, tab.kind, tab.alias])).toEqual([
      [21, 'query', 'view_2ATJwZNKDn'],
      [23, 'chart', 'view_pie']
    ]);
    expect(tabs[0]).toMatchObject({ parameters: [{ displayName: 'min_qty', valueType: 'text', value: '' }], run: { id: 0 } });
    expect(tabs.some(isTabDirty)).toBe(false);
  });
});

describe('newQueryTab', () => {
  it('starts unchanged, running only when asked and there is SQL', () => {
    expect(isTabDirty(newQueryTab('select 1', 'view_a', false))).toBe(false);
    expect(newQueryTab('select 1', 'view_a', false).run).toBeUndefined();
    expect(newQueryTab('select 1', 'view_a', true).run).toMatchObject({ sql: 'select 1' });
    expect(newQueryTab(' ', 'view_a', true).run).toBeUndefined();
  });
});

describe('nextTempId / newViewAlias', () => {
  it('gives ids below every tab', () => {
    expect(nextTempId([])).toBe(-2);
    expect(nextTempId(tabsOfAnalysis(analysis, alias))).toBe(-2);
    expect(nextTempId([{ ...newQueryTab('', 'a', false), id: -4 }])).toBe(-5);
  });

  it('names a view like v1', () => {
    expect(newViewAlias(() => 0)).toBe('view_aaaaaaaaaa');
    expect(newViewAlias(() => 0.999)).toMatch(/^view_9{10}$/);
  });
});

describe('withQuery', () => {
  it('puts the SQL and parameters where v1 kept them, keeping the rest', () => {
    const json = withQuery({ id: 1, setting: { class_name: 'raw_query_setting', options: { class_name: 'table_chart_setting', options: { title: 't' } } } }, 'select {{min_qty}}', [minQty], 'view_x');
    expect(json).toEqual({
      id: 1,
      setting: {
        class_name: 'raw_query_setting',
        sql: 'select {{min_qty}}',
        sql_views: [{ class_name: 'sql_view', alias_name: 'view_x', query: { class_name: 'sql_query', query: 'select {{min_qty}}' } }],
        parameters: { min_qty: '2' },
        options: {
          class_name: 'table_chart_setting',
          options: { title: 't', raw_query: 'select {{min_qty}}', query_parameter: [{ display_name: 'min_qty', value_type: 'number', value: '2', list: null }] }
        }
      }
    });
  });

  it('gives the server SQL without a closing `;`, keeping the text', () => {
    const setting = withQuery({ setting: { class_name: 'raw_query_setting' } }, 'select 1;', [], 'v')['setting'];
    expect(setting).toMatchObject({ sql: 'select 1', sql_views: [{ query: { query: 'select 1' } }], options: { options: { raw_query: 'select 1;' } } });
  });

  it("keeps a chart's view name and leaves `sql` to the query", () => {
    const chart = analysis.widgets[2]!.json;
    const json = withQuery(chart, 'select 2', [], 'other');
    expect(json['setting']).toMatchObject({ sql_views: [{ alias_name: 'view_pie', query: { query: 'select 2' } }] });
    expect(json['setting']).not.toHaveProperty('sql');
  });
});

describe('tabWidgetJson', () => {
  it('builds a new query widget like v1, with the parameters its SQL names', () => {
    const tab: AnalysisTab = { ...newQueryTab('select {{min_qty}}', 'view_q', false), parameters: [minQty, { ...minQty, displayName: 'gone' }] };
    expect(tabWidgetJson(tab)).toMatchObject({
      class_name: 'chart_v3',
      id: -1,
      extra_data: { current_chart_type: 'table' },
      setting: { class_name: 'raw_query_setting', sql: 'select {{min_qty}}', parameters: { min_qty: '2' }, options: { class_name: 'table_chart_setting', options: { query_parameter: [{ display_name: 'min_qty' }] } } }
    });
  });
});

describe('shownChartJson', () => {
  it('shows a chart as last run, else as stored, and nothing for the query', () => {
    const [query, chart] = tabsOfAnalysis(analysis, alias);
    expect(shownChartJson(query!)).toBeUndefined();
    expect(shownChartJson(chart!)?.['setting']).toMatchObject({ sql_views: [{ query: { query: 'select * from t' } }] });
    const ran = { ...chart!, sql: 'edited', run: { id: 3, sql: 'select {{a}}', parameters: [{ displayName: 'a', valueType: 'number', value: '7' }] } };
    expect(shownChartJson(ran)?.['setting']).toMatchObject({ sql_views: [{ query: { query: 'select {{a}}' } }], parameters: { a: '7' } });
  });
});

describe('isTabDirty', () => {
  const tab = tabsOfAnalysis(analysis, alias)[0]!;

  it('sees changed SQL or parameters, not unused definitions', () => {
    expect(isTabDirty({ ...tab, sql: `${tab.sql} ` })).toBe(true);
    expect(isTabDirty({ ...tab, parameters: [{ ...tab.parameters[0]!, value: '5' }] })).toBe(true);
    expect(isTabDirty({ ...tab, parameters: [...tab.parameters, { ...minQty, displayName: 'unused' }] })).toBe(false);
    expect(isTabDirty({ ...tab, saved: undefined })).toBe(true);
  });
});

describe('tabLabel / neighbourOf', () => {
  const tabs = tabsOfAnalysis(analysis, alias);

  it('names the query and the charts', () => {
    expect(tabs.map(tabLabel)).toEqual(['Query', 'Qty by name']);
    expect(tabLabel({ ...tabs[1]!, widget: {} })).toBe('Untitled chart');
  });

  it('moves to the next tab, else the one before', () => {
    const three = [...tabs, { ...tabs[1]!, id: 24 }];
    expect(neighbourOf(three, 23)).toBe(24);
    expect(neighbourOf(three, 24)).toBe(23);
    expect(neighbourOf([tabs[0]!], 21)).toBeUndefined();
  });
});

describe('analysisErrorMessage', () => {
  it.each([
    [new ApiError('gone', 404, 'not_found'), 'Analysis not found'],
    [new ApiError('nope', 403, 'forbidden'), "You don't have permission to view this analysis"],
    [new ApiError('nope', 401, 'not_allowed'), "You don't have permission to view this analysis"],
    [new Error('boom'), 'Failed to load analysis: boom']
  ])('%s', (error, expected) => {
    expect(analysisErrorMessage(error)).toBe(expected);
  });
});
