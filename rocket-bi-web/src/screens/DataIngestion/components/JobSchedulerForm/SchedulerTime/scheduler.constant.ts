import { DropdownData } from '@/shared/components/Common/DiDropdown';
import { DaysOfWeek } from '@/shared/enums/DayOfWeeks';
import { SchedulerName } from '@/shared/enums/SchedulerName';
import { SchedulerType } from '@/shared/enums/SchedulerType';

export const DaysOfWeekOptions: DropdownData[] = [
  {
    text: 'Mon',
    value: DaysOfWeek.Monday
  },
  {
    text: 'Tue',
    value: DaysOfWeek.Tuesday
  },
  {
    text: 'Wed',
    value: DaysOfWeek.Wednesday
  },
  {
    text: 'Thu',
    value: DaysOfWeek.Thursday
  },
  {
    text: 'Fri',
    value: DaysOfWeek.Friday
  },
  {
    text: 'Sat',
    value: DaysOfWeek.Saturday
  },
  {
    text: 'Sun',
    value: DaysOfWeek.Sunday
  }
];

export const FrequencyOptions: DropdownData[] = [
  {
    value: SchedulerName.Minutely,
    text: 'Minutely'
  },
  {
    value: SchedulerName.Hourly,
    text: 'Hourly'
  },
  {
    value: SchedulerName.Daily,
    text: 'Daily'
  },
  {
    value: SchedulerName.Weekly,
    text: 'Weekly'
  },
  {
    value: SchedulerName.Monthly,
    text: 'Monthly'
  }
];

export const JobSchedulerDropdownData: DropdownData[] = [
  {
    value: SchedulerType.Recurring,
    label: 'Recurring'
  },
  {
    value: SchedulerType.RunOnlyOnce,
    label: 'Run only once'
  }
];
export const OnlyRecurringDropdownData: DropdownData[] = [
  {
    value: SchedulerType.Recurring,
    label: 'Recurring'
  }
];
