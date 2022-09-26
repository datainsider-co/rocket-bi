import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';

export class SchedulerHourly implements TimeScheduler {
  className: SchedulerName = SchedulerName.Hourly;

  constructor(public recurEvery: number, public startTime?: number) {}

  isValid(): boolean {
    const validRecurEvery = this.recurEvery > 0;
    return validRecurEvery;
  }

  static fromObject(obj: any) {
    return new SchedulerHourly(obj.recurEvery);
  }
}
