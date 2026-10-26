import type { ChartWidget } from '@/core/dashboard/Widget';

/**
 * Where ChartBuilder (Phase 4) plugs into edit mode: the dashboard page takes one and shows Add chart / Config chart
 * only when it has it. The builder saves the chart through `DashboardEditor` once the user is done.
 */
export interface ChartBuilderBridge {
  addChart: () => void;
  configChart: (widget: ChartWidget) => void;
}
