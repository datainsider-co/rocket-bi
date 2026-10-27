import { lazy } from 'react';
import { DashboardPage } from '@/features/dashboard/detail/DashboardPage';

/** Loaded the first time the builder opens, apart from the dashboard. */
const ChartBuilderHost = lazy(() => import('./host/ChartBuilderHost').then(module => ({ default: module.ChartBuilderHost })));

/** `/dashboard/:name` with ChartBuilder in edit mode: Add chart, Config chart and the inner filter items. */
export function DashboardBuilderPage() {
  return <DashboardPage chartBuilder={ChartBuilderHost} />;
}
