import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';

export class NoneScheduler implements TimeScheduler {
  className: SchedulerName = SchedulerName.None;

  isValid(): boolean {
    return false;
  }

  static fromObject() {
    return new NoneScheduler();
  }
}
