/**
 * v1 `ChartType` values the builder makes, as stored in `extra_data.current_chart_type`. v1 spells the donut
 * `Donut`, capitalised, and so must v2.
 */
export const ChartType = {
  Table: 'flatten_table',
  Number: 'kpi',
  Line: 'line',
  Spline: 'spline',
  LineInverted: 'line_inverted',
  Area: 'area',
  AreaInverted: 'area_inverted',
  Column: 'column',
  Bar: 'bar',
  Pie: 'pie',
  SemiPie: 'semi_pie',
  Donut: 'Donut',
  TabFilter: 'tab_filter',
  SingleChoice: 'single_choice',
  MultiChoice: 'multi_choice',
  DropDown: 'drop_down',
  SlicerFilter: 'slicer_filter',
  DateSelectFilter: 'date_select_filter',
  InputFilter: 'input_filter',
  SingleTreeFilter: 'single_tree_filter',
  MultiTreeFilter: 'multi_tree_filter',
  /** Inner filters: a chart's own filter (`chart_filter`), never a widget of its own. */
  DropDownInnerFilter: 'drop_down_filter',
  TabInnerFilter: 'tab_inner_filter'
} as const;

export type ChartType = (typeof ChartType)[keyof typeof ChartType];

const ALL = new Set<string>(Object.values(ChartType));

export function isChartType(value: unknown): value is ChartType {
  return typeof value === 'string' && ALL.has(value);
}
