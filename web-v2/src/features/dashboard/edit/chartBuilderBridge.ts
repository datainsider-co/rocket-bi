import type { ComponentType } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { ChartWidget } from '@/core/dashboard/Widget';
import type { DashboardEditor } from './useDashboardEditor';

/**
 * A new chart on a query's result (v1 `AdhocBuilderConfig`): the view the query becomes, `{{parameter}}` marks kept,
 * and the parameter values that read its columns.
 */
export interface AdhocSource {
  readonly view: { readonly name: string; readonly query: string };
  readonly parameters: Readonly<Record<string, string>>;
}

/** What the builder saves a chart with: the dashboard's editor, or any host that keeps charts. */
export type ChartSaver = Pick<DashboardEditor, 'createWidget' | 'updateWidget'>;

/**
 * What edit mode asks ChartBuilder for (v1 `DashboardDetail` `onAddChart`, `onUpdateChart`, `onAddInnerFilter`,
 * `onUpdateInnerFilter`).
 */
export type ChartBuilderRequest =
  | { readonly kind: 'addChart'; readonly adhoc?: AdhocSource }
  | { readonly kind: 'configChart'; readonly chart: ChartWidget }
  | { readonly kind: 'addInnerFilter'; readonly chart: ChartWidget }
  | { readonly kind: 'configInnerFilter'; readonly chart: ChartWidget };

/** Where ChartBuilder plugs into edit mode: Add chart, Config chart and the inner filter items open it. */
export interface ChartBuilderBridge {
  open: (request: ChartBuilderRequest) => void;
}

export interface ChartBuilderHostProps {
  request: ChartBuilderRequest;
  /** The dashboard as saved, for its charts (controls, the database they use). */
  dashboard: Dashboard;
  /** Saves the chart once the user is done. */
  editor: ChartSaver;
  onClose: () => void;
}

/**
 * ChartBuilder as the dashboard page shows it. The route gives it (lazy loaded), so the dashboard doesn't depend on
 * ChartBuilder; without one the page has no Add chart nor Config chart.
 */
export type ChartBuilderHost = ComponentType<ChartBuilderHostProps>;
