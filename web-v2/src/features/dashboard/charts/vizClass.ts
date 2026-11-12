/** v1 `ChartOptionClassName` values v2 renders so far (`setting.options.class_name`). */
export const ChartVizClass = {
  Series: 'highcharts_series_chart_setting',
  /** Stacked column and bar (v1 `StackedChartOption`). */
  StackedSeries: 'stacking_series_chart_setting',
  /** Drawn like the stacked charts, on a polar pane (v1 `CircularChartOption`). */
  CircularBar: 'circular_bar_chart_setting',
  Pie: 'highcharts_pie_chart_setting',
  /** Drawn as a pie: v1 `DonutChart` is `PieChart` with a hole (`innerSize` in its options). */
  Donut: 'donut_chart_setting',
  /** Read from a generic response (`generic_chart_setting`). */
  VariablePie: 'variablepie_chart_setting',
  /** Area Range and Column Range (v1 `GenericChartOption`), told apart by `chart.type`; read from a generic response. */
  Generic: 'generic_chart_setting',
  Funnel: 'highcharts_funnel_chart_setting',
  Pyramid: 'highcharts_pyramid_chart_setting',
  Parliament: 'parliament_setting',
  Number: 'number_chart_setting',
  TabFilter: 'tab_filter_chart_setting',
  Dropdown: 'dropdown_filter_chart_setting',
  Slicer: 'slice_filter_setting',
  DateSelect: 'date_select_filter_setting',
  Input: 'input_filter_setting',
  Tree: 'tree_filter_chart_setting'
} as const;

/** Viz classes rendered as filters, which set a control instead of showing data. */
const FILTER_CLASSES = new Set<string>([
  ChartVizClass.TabFilter,
  ChartVizClass.Dropdown,
  ChartVizClass.Slicer,
  ChartVizClass.DateSelect,
  ChartVizClass.Input,
  ChartVizClass.Tree
]);

export function isFilterVizClass(className: string): boolean {
  return FILTER_CLASSES.has(className);
}
