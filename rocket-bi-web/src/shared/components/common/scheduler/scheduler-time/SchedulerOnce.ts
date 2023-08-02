import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/shared/components/common/scheduler/scheduler-time/TimeScheduler';

export class SchedulerOnce implements TimeScheduler {
  className: SchedulerName = SchedulerName.Once;
  constructor(public startTime: number) {}
  isValid(): boolean {
    const validTime = TimeScheduler.validTime(this.startTime);
    return validTime;
  }

  static fromObject(obj: any) {
    return new SchedulerOnce(obj.startTime);
  }
}
