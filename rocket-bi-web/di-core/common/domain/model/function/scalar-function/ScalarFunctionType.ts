export enum ScalarFunctionType {
  ToYear = 'to_year',
  ToQuarter = 'to_quarter',
  ToMonth = 'to_month',
  ToWeek = 'to_week',
  ToDayOfYear = 'to_day_of_year',
  ToDayOfMonth = 'to_day_of_month',
  ToDayOfWeek = 'to_day_of_week',
  ToHour = 'to_hour',
  ToMinute = 'to_minute',
  ToSecond = 'to_second',
  ToYearNum = 'to_year_num',
  ToQuarterNum = 'to_quarter_num',
  ToMonthNum = 'to_month_num',
  ToWeekNum = 'to_week_num',
  ToDayNum = 'to_day_num',
  ToHourNum = 'to_hour_num',
  ToMinuteNum = 'to_minute_num',
  ToSecondNum = 'to_second_num',
  GetArrayElement = 'get_array_element',
  ToDateTime = 'to_date_time',
  /**
   * @deprecated
   * use DateTimeToSeconds, DateTimeToMillis, DateTimeToNanos instead of
   */
  TimestampToDate = 'timestamp_to_datetime',
  SecondsToDateTime = 'seconds_to_datetime',
  MillisToDateTime = 'millis_to_datetime',
  NanosToDateTime = 'nanos_to_datetime',
  DateTimeToSeconds = 'datetime_to_seconds',
  DateTimeToMillis = 'datetime_to_millis',
  DateTimeToNanos = 'datetime_to_nanos',
  PastNYear = 'past_n_year',
  PastNQuarter = 'past_n_quarter',
  PastNMonth = 'past_n_month',
  PastNWeek = 'past_n_week',
  PastNDay = 'past_n_day'
}
