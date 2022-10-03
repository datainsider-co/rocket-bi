import { SchedulerName } from '@/shared/enums/SchedulerName';
import { DaysOfWeek } from '@/shared/enums/DayOfWeeks';
import { ListUtils } from '@/utils';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerWeeklyV2 } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerWeeklyV2';
import moment from 'moment';

export class SchedulerWeekly implements TimeScheduler {
  className: SchedulerName = SchedulerName.Weekly;
  constructor(public recurEvery: number, public atTime: number, public includeDays: DaysOfWeek[]) {}
  isValid(): boolean {
    const validWeekDays = ListUtils.isNotEmpty(this.includeDays);
    const validTime = TimeScheduler.validTime(this.atTime);
    const validRecurEvery = this.recurEvery > 0;
    return validTime && validRecurEvery && validWeekDays;
  }

  toSchedulerWeeklyV2(): SchedulerWeeklyV2 {
    const atHour = moment(this.atTime)
      .utc()
      .hours();
    const atMinute = moment(this.atTime)
      .utc()
      .minutes();
    const atSecond = moment(this.atTime)
      .utc()
      .seconds();
    return new SchedulerWeeklyV2(this.recurEvery, atHour, atMinute, atSecond, this.includeDays);
  }
}
