import { SchedulerName } from '@/shared/enums/SchedulerName';
import { ListUtils } from '@/utils';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerMonthlyV2 } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerMonthlyV2';
import moment from 'moment';

export class SchedulerMonthly implements TimeScheduler {
  className: SchedulerName = SchedulerName.Monthly;
  constructor(public recurOnDays: number[], public atTime: number, public recurEveryMonth: number) {}
  isValid(): boolean {
    const validRecurOnDays = ListUtils.isNotEmpty(this.recurOnDays);
    const validTime = TimeScheduler.validTime(this.atTime);
    const validRecurEveryMonth = this.recurEveryMonth > 0;
    return validRecurOnDays && validTime && validRecurEveryMonth;
  }

  toSchedulerMonthlyV2(): SchedulerMonthlyV2 {
    const atHour = moment(this.atTime)
      .utc()
      .hours();
    const atMinute = moment(this.atTime)
      .utc()
      .minutes();
    const atSecond = moment(this.atTime)
      .utc()
      .seconds();
    return new SchedulerMonthlyV2(this.recurOnDays, atHour, atMinute, atSecond, this.recurEveryMonth);
  }
}
