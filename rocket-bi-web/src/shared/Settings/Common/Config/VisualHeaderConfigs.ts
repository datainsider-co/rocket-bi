import { ChartType } from '@/shared';

export class VisualHeaderConfigs {
  static readonly drilldownWidgets: Set<ChartType> = new Set([
    // WidgetType.funnel,
    ChartType.Pareto,
    ChartType.Pyramid,
    ChartType.Pie,
    ChartType.Bar,
    ChartType.Column,
    ChartType.Line,
    ChartType.Area,
    ChartType.WordCloud,
    ChartType.SpiderWeb,
    ChartType.StackedBar,
    ChartType.StackedColumn,
    ChartType.Parliament
  ]);
  static readonly zoomWidgets: Set<ChartType> = new Set<ChartType>([
    ChartType.BellCurve,
    ChartType.Funnel,
    ChartType.Pareto,
    ChartType.Pie,
    ChartType.Scatter,
    ChartType.Bar,
    ChartType.Column,
    ChartType.Line,
    ChartType.Area,
    ChartType.SpiderWeb,
    ChartType.StackedBar,
    ChartType.StackedColumn
  ]);
}
