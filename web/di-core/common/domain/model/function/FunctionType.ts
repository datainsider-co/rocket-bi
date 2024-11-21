export enum FunctionType {
  Select = 'select',
  SelectDistinct = 'select_distinct',
  Group = 'group',
  Count = 'count',
  CountDistinct = 'count_distinct',
  Avg = 'avg',
  Sum = 'sum',
  Min = 'min',
  Max = 'max',
  OrderBy = 'order_by',
  Limit = 'limit',
  First = 'first',
  Last = 'last',
  Expression = 'select_expression',
  DynamicFunction = 'dynamic_function'
}
