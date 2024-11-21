/*
 * @author: tvc12 - Thien Vi
 * @created: 12/18/20, 3:43 PM
 */

// TODO: move to src
export enum MainDateMode {
  thisDay = 'this_day',
  thisWeek = 'this_week',
  thisMonth = 'this_month',
  thisQuarter = 'this_quarter',
  thisYear = 'this_year',
  lastDay = 'last_day',
  lastWeek = 'last_week',
  lastMonth = 'last_month',
  lastQuarter = 'last_quarter',
  lastYear = 'last_year',
  last7Days = 'last_7_days',
  last30Days = 'last_30_days',
  allTime = 'all_time',
  // compare
  previousPeriod = 'previous_period',
  samePeriodLastYear = 'same_period_last_year',
  samePeriodLastMonth = 'same_period_last_month',
  samePeriodLastQuarter = 'same_period_last_quarter',
  // end-compare
  custom = 'custom'
}
