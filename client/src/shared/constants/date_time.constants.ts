import { CompareOption, DateModeOption } from '@/shared';
import { CompareMode } from '@/shared/enums/compare_option_type';
import { MainDateMode } from '@core/domain/Model/Widget/Filter/MainDateMode';

export abstract class DateTimeConstants {
  static readonly ListDateRangeModeOptions: DateModeOption[] = [
    {
      value: MainDateMode.thisDay,
      label: 'Today'
    },
    {
      value: MainDateMode.thisWeek,
      label: 'This Week'
    },
    {
      value: MainDateMode.thisMonth,
      label: 'This Month'
    },
    {
      value: MainDateMode.thisQuarter,
      label: 'This Quarter'
    },
    {
      value: MainDateMode.thisYear,
      label: 'This Year'
    },
    {
      value: MainDateMode.lastDay,
      label: 'Last Day'
    },
    {
      value: MainDateMode.lastWeek,
      label: 'Last Week'
    },
    {
      value: MainDateMode.lastMonth,
      label: 'Last Month'
    },
    {
      value: MainDateMode.lastQuarter,
      label: 'Last Quarter'
    },
    {
      value: MainDateMode.lastYear,
      label: 'Last Year'
    },
    {
      value: MainDateMode.last7Days,
      label: 'Last 7 Days'
    },
    {
      value: MainDateMode.last30Days,
      label: 'Last 30 Days'
    },
    {
      value: MainDateMode.custom,
      label: 'Custom'
    },
    {
      value: MainDateMode.allTime,
      label: 'All Time'
    }
  ];

  static readonly ListCompareModeOptions: CompareOption[] = [
    // {
    //   label: 'None',
    //   value: CompareMode.none
    // },
    {
      label: 'Previous Period',
      value: CompareMode.previousPeriod
    },
    {
      label: 'Same Period Last Month',
      value: CompareMode.samePeriodLastMonth
    },
    {
      label: 'Same Period Last Quarter',
      value: CompareMode.samePeriodLastQuarter
    },
    {
      label: 'Same Period Last Year',
      value: CompareMode.samePeriodLastYear
    },
    {
      label: 'Custom',
      value: CompareMode.custom
    }
  ];

  static readonly mapMainDateFilterMode = [
    {
      mode: MainDateMode.thisDay,
      text: 'This Day'
    },
    {
      mode: MainDateMode.thisWeek,
      text: 'This Week'
    },
    {
      mode: MainDateMode.thisMonth,
      text: 'This Month'
    },
    {
      mode: MainDateMode.thisQuarter,
      text: 'This Quarter'
    },
    {
      mode: MainDateMode.thisYear,
      text: 'This Year'
    },
    {
      mode: MainDateMode.lastDay,
      text: 'Last Day'
    },
    {
      mode: MainDateMode.lastWeek,
      text: 'Last Week'
    },
    {
      mode: MainDateMode.lastMonth,
      text: 'Last Month'
    },
    {
      mode: MainDateMode.lastQuarter,
      text: 'Last Quarter'
    },
    {
      mode: MainDateMode.lastYear,
      text: 'Last Year'
    },
    {
      mode: MainDateMode.last7Days,
      text: 'Last 7 Days'
    },
    {
      mode: MainDateMode.last30Days,
      text: 'Last 30 Days'
    },
    {
      mode: MainDateMode.allTime,
      text: 'All Time'
    }
  ];
}
