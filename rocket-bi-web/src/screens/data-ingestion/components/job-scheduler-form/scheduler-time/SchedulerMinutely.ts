import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';

export class SchedulerMinutely implements TimeScheduler {
  className: SchedulerName = SchedulerName.Minutely;
  constructor(public recurEvery: number) {}
  isValid(): boolean {
    const validRecurEvery = this.recurEvery > 0;
    return validRecurEvery;
  }

  static fromObject(obj: any) {
    return new SchedulerMinutely(obj.recurEvery);
  }
}
