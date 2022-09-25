import { SchedulerName } from '@/shared/enums/SchedulerName';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';

export class NoneScheduler implements TimeScheduler {
  className: SchedulerName = SchedulerName.None;

  isValid(): boolean {
    return false;
  }

  static fromObject() {
    return new NoneScheduler();
  }
}
