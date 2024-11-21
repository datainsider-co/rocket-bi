import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerDaily } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerDaily';

export class SchedulerDailyV2 implements TimeScheduler {
  className: SchedulerName = SchedulerName.Daily;
  constructor(public recurEvery: number, public startTime: number) {}
  isValid(): boolean {
    const validRecurEvery = this.recurEvery > 0;
    const validTime = TimeScheduler.validTime(this.startTime);
    return validRecurEvery && validTime;
  }

  toSchedulerDaily(): SchedulerDaily {
    return new SchedulerDaily(this.recurEvery, this.startTime);
  }

  static fromObject(obj: any) {
    return new SchedulerDailyV2(obj.recurEvery, obj.startTime);
  }
}
