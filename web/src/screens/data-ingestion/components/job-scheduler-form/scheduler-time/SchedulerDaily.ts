import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { SchedulerDailyV2 } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerDailyV2';

export class SchedulerDaily implements TimeScheduler {
  className: SchedulerName = SchedulerName.Daily;
  constructor(public recurEvery: number, public atTime: number) {}
  isValid(): boolean {
    const validRecurEvery = this.recurEvery > 0;
    const validTime = TimeScheduler.validTime(this.atTime);
    return validRecurEvery && validTime;
  }

  toSchedulerDailyV2(): SchedulerDailyV2 {
    return new SchedulerDailyV2(this.recurEvery, this.atTime);
  }
}
