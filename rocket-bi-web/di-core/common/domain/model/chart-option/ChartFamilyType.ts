/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:38 PM
 */

export enum ChartFamilyType {
  Table = 'table',
  Series = 'series',
  Pie = 'pie',
  Funnel = 'funnel',
  Pyramid = 'pyramid',
  /**
   * @deprecated from v1.0.0
   */
  Drilldown = 'drilldown',
  /**
   * @deprecated from v1.0.0
   */
  DrilldownPie = 'drilldown_pie',
  Gauge = 'gauge',
  HeatMap = 'heat_map',
  TreeMap = 'tree_map',
  Bubble = 'bubble',
  Scatter = 'scatter',
  Pareto = 'pareto',
  Histogram = 'histogram',
  BellCurve = 'bell_curve',
  Number = 'number',
  WordCloud = 'wordcloud',
  Custom = 'custom',
  Dropdown = 'dropdown_filter',
  TabFilter = 'tab_filter',
  Map = 'map',
  Unknown = 'unknown',
  Pivot = 'pivot',
  Parliament = 'parliament',
  Sankey = 'sankey',
  FlattenPivot = 'flatten_pivot',
  FlattenTable = 'flatten_table',
  TreeFilter = 'tree_filter'
}
