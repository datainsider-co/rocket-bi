export enum ConditionTypes {
  DateHistogram = 'Date histogram',
  Number = 'number',
  String = 'string'
}

export enum DateHistogramConditionTypes {
  earlierThan = 'earlier than',
  laterThan = 'later than',
  between = 'between',
  betweenAndIncluding = 'between and including',
  lastNMinutes = 'last N minutes',
  lastNHours = 'last N hours',
  lastNDays = 'last N days',
  lastNQuarters = 'last N quarters',
  lastNWeeks = 'last N weeks',
  lastNMonths = 'last N months',
  lastNYears = 'last N years',
  currentDay = 'current day',
  currentWeek = 'current week',
  currentMonth = 'current month',
  currentQuarter = 'current quarter',
  currentYear = 'current year',
  //using for clear condition
  allTime = 'all time'
}

export enum DateConditionTypes {
  earlierThan = 'earlier than',
  laterThan = 'later than',
  last = 'last',
  // betweenBeforeNow = 'between before now',
  current = 'current',
  allTime = 'all_time',
  between = 'between',
  betweenAndInclude = 'between and include'
}

export enum DateTypes {
  minute = 'minute',
  hour = 'hour',
  day = 'day',
  week = 'week',
  month = 'month',
  quarter = 'quarter',
  year = 'year'
}

export enum NumberConditionTypes {
  equal = 'equal',
  notEqual = 'not equal',
  greaterThan = 'greater than',
  greaterThanOrEqual = 'greater than or equal',
  lessThan = 'less than',
  lessThanOrEqual = 'less than or equal',
  between = 'between',
  betweenAndIncluding = 'between and including',
  in = 'in',
  notIn = 'not in'
}

export enum StringConditionTypes {
  equal = 'equal',
  notEqual = 'not equal',
  isnull = 'is null',
  notNull = 'is not null',
  isEmpty = 'is empty',
  notEmpty = 'is not empty',
  like = 'like',
  notLike = 'is not like',
  matchesRegex = 'matches regex',
  likeCaseInsensitive = 'like (case insensitive)',
  notLikeCaseInsensitive = 'not like (case insensitive)',
  in = 'in',
  notIn = 'not in'
}

export enum SortTypes {
  Unsorted = 'Unsorted',
  AscendingOrder = 'Ascending',
  DescendingOrder = 'Descending'
}

export enum FunctionFamilyTypes {
  groupBy = 'Group By',
  dateHistogram = 'Date histogram',
  aggregation = 'Aggregation',
  dynamic = 'Dynamic',
  none = 'None'
}

export enum DateFunctionTypes {
  secondOf = 'Second of',
  minuteOf = 'Minute of',
  hourOf = 'Hour of',
  dayOf = 'Day of',
  weekOf = 'Week of',
  monthOf = 'Month of',
  quarterOf = 'Quarter of',
  yearlyOf = 'Yearly of',
  hourOfDay = 'Hour of Day',
  dayOfWeek = 'Day of Week',
  dayOfMonth = 'Day of Month',
  dayOfYear = 'Day of Year',
  monthOfYear = 'Month of Year',
  year = 'Year',
  quarterOfYear = 'Quarter of Year',
  minuteOfHour = 'Minute of Hour',
  secondOfMinute = 'Second of Minute',
  weekOfYear = 'Week of Year',
  second = 'Second',
  millisecond = 'Millisecond',
  nanosecond = 'Nanosecond',
  dynamic = 'dynamic'
}

export enum AggregationFunctionTypes {
  average = 'Average',
  sum = 'Sum',
  // columnRatio = 'Column ratio',
  maximum = 'Maximum',
  minimum = 'Minimum',
  countOfDistinct = 'Count distinct',
  countAll = 'Count all',
  First = 'First',
  Last = 'Last',
  Expression = 'Expression'
}

export enum BuilderMode {
  Create = 'Create',
  Update = 'Update'
}

export enum ChartType {
  Area = 'area',
  AreaRange = 'arearange',
  AreaInverted = 'area_inverted',
  AreaSpline = 'areaspline',
  Bar = 'bar',
  BellCurve = 'bell_curve',
  Bubble = 'bubble_chart',
  Column = 'column',
  ColumnRange = 'column_range',
  ColumnDrillDown = 'column_drilldown',
  BarDrillDown = 'bar_drilldown',
  PieDrillDown = 'pie_drilldown',
  Funnel = 'funnel',
  Gauges = 'gauge',
  HeatMap = 'heatmap',
  TreeMap = 'tree_map',
  Histogram = 'histogram',
  Line = 'line',
  Spline = 'spline',
  LineInverted = 'line_inverted',
  Pareto = 'pareto',
  Pie = 'pie',
  SemiPie = 'semi_pie',
  Pyramid = 'pyramid',
  Scatter = 'scatter',
  Table = 'table',
  Kpi = 'kpi',
  WordCloud = 'wordcloud',
  StackedColumn = 'stack_column',
  StackedBar = 'stack_bar',
  StackedLine = 'stack_line',
  Map = 'map',
  TabFilter = 'tab_filter',
  PivotTable = 'pivot_table',
  Parliament = 'Parliament',
  SpiderWeb = 'spider_web',
  SingleChoice = 'single_choice',
  MultiChoice = 'multi_choice',
  DropDown = 'drop_down',
  Sankey = 'sankey',
  SlicerFilter = 'slicer_filter',
  DateSelectFilter = 'date_select_filter',
  InputFilter = 'input_filter',
  FlattenTable = 'flatten_table',
  FlattenPivotTable = 'flatten_pivot_table',
  Lollipop = 'lollipop',
  Bullet = 'bullet',
  //Using for inner filter
  TabInnerFilter = 'tab_inner_filter',
  SingleChoiceFilter = 'single_choice_filter',
  MultiChoiceFilter = 'multi_choice_filter',
  DropDownFilter = 'drop_down_filter',
  WindRose = 'wind_rose',
  LineStock = 'line_stock',
  /**
   * @deprecated
   */
  InputControl = 'input_control',
  CircularBar = 'circular_bar',
  FilterPanel = 'filter_panel',
  SingleTreeFilter = 'single_tree_filter',
  MultiTreeFilter = 'multi_tree_filter',
  Donut = 'Donut',
  Variablepie = 'variablepie'
}
