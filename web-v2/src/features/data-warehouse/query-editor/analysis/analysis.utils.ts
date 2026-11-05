import type { Dashboard } from '@/core/dashboard/Dashboard';
import { DashboardSetting } from '@/core/dashboard/DashboardSetting';
import { WidgetClassName, type ChartWidget } from '@/core/dashboard/Widget';
import { asArray, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';
import { parameterDefinitionsOf, parameterToJson, type QueryParameter } from '@/core/query/queryParameters';
import { parameterValues, runnableSql, syncParameters } from '@/core/query/rawQuery';
import { isApiError } from '@/shared/http/ApiError';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { toRun, type QueryRun } from '@/shared/query-result/queryResult.utils';

/**
 * A query analysis (v1 `QueryComponent.listAdhocInfo`): a dashboard of `directory_type: queries` whose first widget is
 * the query (a `raw_query_setting` table) and the others charts made on it (v1 ad hoc charts). Each tab has its own
 * SQL and parameters, kept in the widget: `sql_views[0]` (the view a chart reads), `options.options.raw_query` and
 * `query_parameter` (v1 `buildAddAdhocAnalysis`).
 */

export interface SavedQuery {
  readonly sql: string;
  readonly parameters: readonly QueryParameter[];
}

export interface AnalysisTab {
  /** The widget's id; below 0 until saved. */
  readonly id: number;
  readonly kind: 'query' | 'chart';
  /** The widget as stored or built, merged onto when saving; none for a query not saved yet. */
  readonly widget: JsonObject | undefined;
  /** The view name of the SQL in the widget's `sql_views`. */
  readonly alias: string;
  readonly sql: string;
  /** Parameter definitions; the SQL's are kept (`syncParameters`), with their default values. */
  readonly parameters: readonly QueryParameter[];
  /** The last Execute, which the result or the chart shows; a chart shows its stored query until then. */
  readonly run: QueryRun | undefined;
  /** As last saved, to tell changes; none for a tab never saved. */
  readonly saved: SavedQuery | undefined;
}

/** The SQL a tab's widget holds (v1 `AdHocAnalysisInfo.rawQuery`), without the `" \n"` v1 added to its end. */
export function rawQueryOf(setting: JsonObject): string {
  const options = asRecord(asRecord(setting['options'])['options']);
  const view = asRecord(asArray(setting['sql_views'])[0]);
  const sql = asString(options['raw_query']) || asString(asRecord(view['query'])['query']) || asString(setting['sql']);
  return sql.trimEnd();
}

/** The alias of the widget's view, if it has one. */
export function aliasOf(setting: JsonObject): string {
  return asString(asRecord(asArray(setting['sql_views'])[0])['alias_name']);
}

/** The tabs of a saved analysis: its charts in order, the first one being the query. Each shows what it was saved with. */
export function tabsOfAnalysis(dashboard: Dashboard, fallbackAlias: (id: number) => string): AnalysisTab[] {
  return dashboard.widgets
    .filter((widget): widget is ChartWidget => widget.kind === 'chart')
    .map((widget, index) => {
      const sql = rawQueryOf(widget.setting);
      const parameters = parameterDefinitionsOf(widget.setting);
      return {
        id: widget.id,
        kind: index === 0 ? 'query' : 'chart',
        widget: widget.json,
        alias: aliasOf(widget.setting) || fallbackAlias(widget.id),
        sql,
        parameters,
        // The query runs as the analysis opens, as v1 rendered its widgets.
        run: sql.trim() === '' ? undefined : toRun(0, sql, parameters),
        saved: { sql, parameters }
      };
    });
}

/** The query tab of a new analysis; `sql` is what it starts with and runs when `autoRun`. Leaving it as is loses nothing. */
export function newQueryTab(sql: string, alias: string, autoRun: boolean): AnalysisTab {
  return { id: -1, kind: 'query', widget: undefined, alias, sql, parameters: [], run: autoRun && sql.trim() !== '' ? toRun(0, sql, []) : undefined, saved: { sql, parameters: [] } };
}

/** An id for a tab not saved yet: below every other. */
export function nextTempId(tabs: readonly AnalysisTab[]): number {
  return Math.min(-1, ...tabs.map(tab => tab.id)) - 1;
}

/** A view name like v1's (`view_` and 10 letters or digits). */
export function newViewAlias(random: () => number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return `view_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)] ?? 'a').join('')}`;
}

/** The query widget v1 made (`buildMainAdhocChart`): a table of the raw SQL. */
function newQueryWidget(id: number): JsonObject {
  return {
    class_name: WidgetClassName.Chart,
    id,
    name: '',
    description: '',
    extra_data: { current_chart_type: 'table' },
    setting: { class_name: 'raw_query_setting', filters: [], sorts: [], options: { class_name: 'table_chart_setting', options: {} } }
  };
}

/**
 * The widget with `sql` and its parameters in: the view a chart reads, the raw SQL and parameters of its viz options,
 * the values as SQL (`setting.parameters`, which the server reads), and `sql` for the query widget. The server reads
 * the view and `sql` inside its own SQL, so they lose a closing `;`; `raw_query` keeps the text as typed.
 */
export function withQuery(widget: JsonObject, sql: string, parameters: readonly QueryParameter[], alias: string): JsonObject {
  const setting = asRecord(widget['setting']);
  const options = asRecord(setting['options']);
  const views = asArray(setting['sql_views']).filter(isRecord);
  const runnable = runnableSql(sql);
  const view = { class_name: 'sql_view', ...views[0], alias_name: aliasOf(setting) || alias, query: { class_name: 'sql_query', query: runnable } };
  return {
    ...widget,
    setting: {
      ...setting,
      ...(setting['class_name'] === 'raw_query_setting' && { sql: runnable }),
      sql_views: [view, ...views.slice(1)],
      parameters: parameterValues(parameters),
      options: { ...options, options: { ...asRecord(options['options']), raw_query: sql, query_parameter: parameters.map(parameterToJson) } }
    }
  };
}

/** What the tab saves: its widget with the SQL and the parameters it names. */
export function tabWidgetJson(tab: AnalysisTab): JsonObject {
  return withQuery(tab.widget ?? newQueryWidget(tab.id), tab.sql, syncParameters(tab.sql, tab.parameters), tab.alias);
}

/** The chart a chart tab shows: as last run, with the values it ran with; as stored before that. */
export function shownChartJson(tab: AnalysisTab): JsonObject | undefined {
  if (tab.kind !== 'chart' || !tab.widget) return undefined;
  const run = tab.run ?? toRun(0, tab.sql, tab.parameters);
  return withQuery(tab.widget, run.sql, run.parameters, tab.alias);
}

function sameParameters(a: readonly QueryParameter[], b: readonly QueryParameter[]): boolean {
  return JSON.stringify(a.map(parameterToJson)) === JSON.stringify(b.map(parameterToJson));
}

/** Whether the tab has changes to save: its SQL or parameters differ from the saved ones, or it was never saved. */
export function isTabDirty(tab: AnalysisTab): boolean {
  if (!tab.saved) return true;
  return tab.sql !== tab.saved.sql || !sameParameters(syncParameters(tab.sql, tab.parameters), syncParameters(tab.saved.sql, tab.saved.parameters));
}

/** The tab's name on the bar: Query, or the chart's title. */
export function tabLabel(tab: AnalysisTab): string {
  if (tab.kind === 'query') return 'Query';
  return asString(tab.widget?.['name']) || 'Untitled chart';
}

/** The analysis a new query stands on until it is saved: no widget, the default setting. */
export function unsavedAnalysis(): Dashboard {
  return { id: -1, name: '', ownerId: '', setting: DashboardSetting.default(), settingJson: {}, widgets: [], positions: {} };
}

/** The tab to show once `id` is gone: the next one, else the one before (v1 `handleDeleteAdhocAnalysis`). */
export function neighbourOf(tabs: readonly AnalysisTab[], id: number): number | undefined {
  const index = tabs.findIndex(tab => tab.id === id);
  return (tabs[index + 1] ?? tabs[index - 1])?.id;
}

/** Why the analysis didn't open (v1 `Failed to load dashboard cause: ...`). */
export function analysisErrorMessage(error: unknown): string {
  if (isApiError(error) && (error.status === 404 || error.reason === 'not_found')) return 'Analysis not found';
  if (isApiError(error) && (error.status === 403 || error.reason === 'not_allowed')) return "You don't have permission to view this analysis";
  return `Failed to load analysis: ${toErrorMessage(error)}`;
}
