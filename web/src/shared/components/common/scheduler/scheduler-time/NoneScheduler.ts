import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/shared/components/common/scheduler/scheduler-time/TimeScheduler';

export class NoneScheduler implements TimeScheduler {
  className: SchedulerName = SchedulerName.None;

  isValid(): boolean {
    return false;
  }

  static fromObject() {
    return new NoneScheduler();
  }
}
