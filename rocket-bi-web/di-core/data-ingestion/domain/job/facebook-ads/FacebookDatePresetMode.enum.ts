import { SelectOption } from '@/shared';

export enum FacebookDatePresetMode {
  today = 'today',
  yesterday = 'yesterday',
  thisMonth = 'this_month',
  lastMonth = 'last_month',
  thisQuarter = 'this_quarter',
  maximum = 'maximum',
  dataMaximum = 'data_maximum',
  last3Days = 'last_3d',
  last7days = 'last_7d',
  last14Days = 'last_14d',
  last28Days = 'last_28d',
  last30Days = 'last_30d',
  last90Days = 'last_90d',
  lastWeekMonSun = 'last_week_mon_sun',
  lastWeekSunSat = 'last_week_sun_sat',
  lastQuarter = 'last_quarter',
  lastYear = 'last_year',
  thisWeekMonToday = 'this_week_mon_today',
  thisWeekSunToday = 'this_week_sun_today',
  thisYear = 'this_year'
}

export const FacebookDatePresetAsOptions: SelectOption[] = [
  {
    id: FacebookDatePresetMode.today,
    displayName: 'Today'
  },

  {
    id: FacebookDatePresetMode.yesterday,
    displayName: 'Yesterday'
  },
  // {
  //   id: FacebookDatePresetMode.thisMonth,
  //   displayName: 'This Month'
  // },
  // {
  //   id: FacebookDatePresetMode.lastMonth,
  //   displayName: 'Last Month'
  // },
  // {
  //   id: FacebookDatePresetMode.thisQuarter,
  //   displayName: 'This Quarter'
  // },
  // {
  //   id: FacebookDatePresetMode.maximum,
  //   displayName: 'Maximum'
  // },
  // {
  //   id: FacebookDatePresetMode.dataMaximum,
  //   displayName: 'Data Maximum'
  // },
  {
    id: FacebookDatePresetMode.last3Days,
    displayName: 'Last 3 Days'
  },
  {
    id: FacebookDatePresetMode.last7days,
    displayName: 'Last 7 Days'
  },
  {
    id: FacebookDatePresetMode.last14Days,
    displayName: 'Last 14 Days'
  },
  {
    id: FacebookDatePresetMode.last28Days,
    displayName: 'Last 28 Days'
  },
  {
    id: FacebookDatePresetMode.last30Days,
    displayName: 'Last 30 Days'
  },
  {
    id: FacebookDatePresetMode.last90Days,
    displayName: 'Last 90 Days'
  }
  // {
  //   id: FacebookDatePresetMode.lastWeekMonSun,
  //   displayName: 'Last Week From Monday To Sunday'
  // },
  // {
  //   id: FacebookDatePresetMode.lastWeekSunSat,
  //   displayName: 'Last Week From Sunday To Saturday'
  // },
  // {
  //   id: FacebookDatePresetMode.lastQuarter,
  //   displayName: 'Last Quarter'
  // },
  // {
  //   id: FacebookDatePresetMode.thisWeekMonToday,
  //   displayName: 'This Week From Monday To Today'
  // },
  // {
  //   id: FacebookDatePresetMode.thisWeekSunToday,
  //   displayName: 'This Week From Sunday To Today'
  // },
  // {
  //   id: FacebookDatePresetMode.thisYear,
  //   displayName: 'This Year'
  // }
];
