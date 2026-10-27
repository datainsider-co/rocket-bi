import type { ComponentType } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { ChartWidget } from '@/core/dashboard/Widget';
import type { DashboardEditor } from './useDashboardEditor';

/**
 * What edit mode asks ChartBuilder for (v1 `DashboardDetail` `onAddChart`, `onUpdateChart`, `onAddInnerFilter`,
 * `onUpdateInnerFilter`).
 */
export type ChartBuilderRequest =
  | { readonly kind: 'addChart' }
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
  editor: DashboardEditor;
  onClose: () => void;
}

/**
 * ChartBuilder as the dashboard page shows it. The route gives it (lazy loaded), so the dashboard doesn't depend on
 * ChartBuilder; without one the page has no Add chart nor Config chart.
 */
export type ChartBuilderHost = ComponentType<ChartBuilderHostProps>;
