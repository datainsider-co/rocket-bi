import { asArray, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';
import { ChartKind } from '@/core/chart-builder/chartCatalogue';
import { chartControlsOf, type ChartControl } from '@/core/chart-builder/chartControls';
import { ChartType } from '@/core/chart-builder/chartType';
import { chartWidgetJson, newChartPosition, withChartFilter } from '@/core/chart-builder/chartWidget';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { Position } from '@/core/dashboard/Position';
import { innerFilterId } from '@/core/dashboard/Widget';
import { storedParameters } from '@/core/query/queryParameters';
import type { ChartBuilderRequest } from '@/features/dashboard/edit/chartBuilderBridge';
import type { BuilderStart } from '../state/useBuilderState';

/** v1 `BuilderMode`: the button says Add or Update. */
export type BuilderMode = 'add' | 'update';

export function builderModeOf(request: ChartBuilderRequest): BuilderMode {
  return request.kind === 'addChart' || request.kind === 'addInnerFilter' ? 'add' : 'update';
}

/** The picker shown before the builder (v1 `VisualizeSelectionModal`): only for a new chart. */
export function pickerKindOf(request: ChartBuilderRequest): typeof ChartKind.Chart | undefined {
  return request.kind === 'addChart' ? ChartKind.Chart : undefined;
}

/** The chart types the builder offers to switch to: inner filters among themselves, charts and filter widgets else. */
export function typeKindOf(request: ChartBuilderRequest): typeof ChartKind.Chart | typeof ChartKind.InnerFilter {
  return request.kind === 'addInnerFilter' || request.kind === 'configInnerFilter' ? ChartKind.InnerFilter : ChartKind.Chart;
}

/** The widget the builder edits, as stored; none for a new one. */
export function editedJsonOf(request: ChartBuilderRequest): JsonObject | undefined {
  if (request.kind === 'configChart') return request.chart.json;
  if (request.kind === 'configInnerFilter') return request.chart.chartFilter?.json;
  return undefined;
}

/**
 * What the builder opens on: the edited widget, or a new chart of the picked type. A new inner filter starts as a
 * dropdown, v1's first inner filter type.
 */
export function builderStartOf(request: ChartBuilderRequest, pickedType: string): BuilderStart {
  const edited = editedJsonOf(request);
  if (edited) return { widget: edited };
  return { chartType: request.kind === 'addInnerFilter' ? ChartType.DropDownInnerFilter : pickedType };
}

const chartSettings = (dashboard: Dashboard) => dashboard.widgets.flatMap(widget => (widget.kind === 'chart' ? [widget.setting] : []));

/**
 * The settings whose fields pick the tree's database and tables (v1 `ChartBuilderController.selectDatabaseAndTable`):
 * the edited chart's, the chart an inner filter is added to, or the whole dashboard's for a new chart.
 */
export function usedSettingsOf(request: ChartBuilderRequest, dashboard: Dashboard): JsonObject[] {
  switch (request.kind) {
    case 'addChart':
      return chartSettings(dashboard);
    case 'configChart':
    case 'addInnerFilter':
      return [request.chart.setting];
    case 'configInnerFilter':
      return request.chart.chartFilter ? [request.chart.chartFilter.setting] : [];
  }
}

/**
 * The chart controls the builder offers (v1 `DashboardDetail`): every chart but the edited one, and the main date
 * filter. v1 gave inner filters none.
 */
export function builderControlsOf(request: ChartBuilderRequest, dashboard: Dashboard): ChartControl[] {
  if (typeKindOf(request) === ChartKind.InnerFilter) return [];
  const excludeId = request.kind === 'configChart' ? request.chart.id : undefined;
  return chartControlsOf(dashboard.widgets, { mainDate: dashboard.setting.mainDateFilter !== undefined, excludeId });
}

/** An ad hoc chart's view: its alias and SQL as stored, with `{{parameter}}` marks in it. */
export interface AdhocView {
  readonly name: string;
  readonly query: string;
}

/** The view an ad hoc chart (made from a query) reads, v1 opened those on that view's table alone. */
export function adhocViewOf(setting: JsonObject): AdhocView | undefined {
  const view = asArray(setting['sql_views']).find(isRecord);
  if (!view) return undefined;
  const query = asString(asRecord(view['query'])['query']);
  return query === '' ? undefined : { name: asString(view['alias_name']), query };
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The view's SQL with the chart's stored parameter values in place (v1 `DashboardDetail.assignParameterValues`), to
 * read its columns. v1 took the inputs' current values; the stored ones are what the chart was saved with.
 */
export function adhocQueryOf(view: AdhocView, setting: JsonObject): string {
  const parameters = storedParameters(setting);
  return Object.entries(parameters).reduce((query, [key, value]) => query.replace(new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g'), () => value), view.query);
}

export type SaveAction = { readonly kind: 'create'; readonly json: JsonObject; readonly position: Position } | { readonly kind: 'update'; readonly json: JsonObject };

/**
 * How the built chart is saved (v1 `ChartBuilderComponent` callbacks): a new chart is created in a free slot, an
 * edited one updated, and an inner filter saved within its chart.
 */
export function saveActionOf(request: ChartBuilderRequest, setting: JsonObject, extraData: JsonObject): SaveAction {
  const built = chartWidgetJson({ stored: editedJsonOf(request), setting, extraData });
  switch (request.kind) {
    case 'addChart':
      return { kind: 'create', json: built, position: newChartPosition(setting) };
    case 'configChart':
      return { kind: 'update', json: built };
    case 'addInnerFilter':
    case 'configInnerFilter':
      return { kind: 'update', json: withChartFilter(request.chart.json, built, request.chart.id) };
  }
}

/**
 * The chart the preview shows: the one saved, under the edited widget's id so its own inner filter and selection
 * apply (-1 for a new chart, like v1).
 */
export function previewJsonOf(request: ChartBuilderRequest, setting: JsonObject, extraData: JsonObject): JsonObject {
  const built = chartWidgetJson({ stored: editedJsonOf(request), setting, extraData });
  switch (request.kind) {
    case 'addChart':
      return built;
    case 'configChart':
      return { ...built, id: request.chart.id };
    case 'addInnerFilter':
    case 'configInnerFilter':
      return { ...built, id: innerFilterId(request.chart.id) };
  }
}
