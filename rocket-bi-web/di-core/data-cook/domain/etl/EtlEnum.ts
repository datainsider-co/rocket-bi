export enum ETL_SCHEDULE_TYPE {
  NoneSchedule = 'none_schedule',
  ScheduleOnce = 'schedule_once',
  ScheduleHourly = 'schedule_hourly',
  ScheduleDaily = 'schedule_daily',
  ScheduleWeekly = 'schedule_weekly',
  ScheduleMonthly = 'schedule_monthly'
}

export enum DAY_OF_WEEK {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday'
}

export enum ETLOperatorType {
  GetDataOperator = 'get_data_operator',
  JoinOperator = 'join_operator',
  TransformOperator = 'transform_operator',
  ManageFieldOperator = 'manage_field_operator',
  PivotTableOperator = 'pivot_table_operator',
  SQLQueryOperator = 'sql_query_operator',
  PythonOperator = 'python_operator',
  SendToGroupEmailOperator = 'send_to_group_email_operator'
}

export const ETL_OPERATOR_TYPE_NAME: Record<ETLOperatorType, string> = Object.freeze({
  [ETLOperatorType.GetDataOperator]: 'Preview Data',
  [ETLOperatorType.JoinOperator]: 'Join Table',
  [ETLOperatorType.TransformOperator]: 'Transform Table',
  [ETLOperatorType.ManageFieldOperator]: 'Manage Fields',
  [ETLOperatorType.PivotTableOperator]: 'Pivot Table',
  [ETLOperatorType.SQLQueryOperator]: 'SQL Query',
  [ETLOperatorType.PythonOperator]: 'Python Query',
  [ETLOperatorType.SendToGroupEmailOperator]: 'Send Email'
});

export const ETL_OPERATOR_TYPE_SHORT_NAME: Record<ETLOperatorType, string> = Object.freeze({
  [ETLOperatorType.GetDataOperator]: '',
  [ETLOperatorType.JoinOperator]: 'Join',
  [ETLOperatorType.TransformOperator]: 'Transform',
  [ETLOperatorType.ManageFieldOperator]: 'Manage Fields',
  [ETLOperatorType.PivotTableOperator]: 'Pivot',
  [ETLOperatorType.SQLQueryOperator]: 'SQL Query',
  [ETLOperatorType.PythonOperator]: 'Python Query',
  [ETLOperatorType.SendToGroupEmailOperator]: 'Send Email'
});

export enum PERSISTENT_TYPE {
  Update = 'Update',
  Append = 'Append'
}

export enum JOIN_TYPE {
  Left = 'left',
  Right = 'right',
  Inner = 'inner',
  FullOuter = 'full_outer'
}

export const JOIN_TYPE_NAME = Object.freeze({
  [JOIN_TYPE.Left]: 'Left join',
  [JOIN_TYPE.Right]: 'Right join',
  [JOIN_TYPE.Inner]: 'Inner join',
  [JOIN_TYPE.FullOuter]: 'Full join'
});

export enum EQUAL_FIELD_TYPE {
  And = 'and',
  Or = 'or',
  EqualField = 'equal_field',
  NotEqualField = 'not_equal_field',
  LessThanField = 'less_than_field',
  GreaterThanField = 'greater_than_field',
  LessOrEqualField = 'less_or_equal_field',
  GreaterOrEqualField = 'greater_or_equal_field'
}

export const EQUAL_FIELD_TYPE_NAME = Object.freeze({
  [EQUAL_FIELD_TYPE.And]: 'and',
  [EQUAL_FIELD_TYPE.Or]: 'or',
  [EQUAL_FIELD_TYPE.EqualField]: '=',
  [EQUAL_FIELD_TYPE.NotEqualField]: '≠',
  [EQUAL_FIELD_TYPE.LessThanField]: '<',
  [EQUAL_FIELD_TYPE.GreaterThanField]: '>',
  [EQUAL_FIELD_TYPE.LessOrEqualField]: '≤',
  [EQUAL_FIELD_TYPE.GreaterOrEqualField]: '≥'
});
