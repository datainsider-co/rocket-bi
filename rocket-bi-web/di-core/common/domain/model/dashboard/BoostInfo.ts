import { NoneScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/NoneScheduler';
import { SchedulerDaily } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerDaily';
import { SchedulerDailyV2 } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerDailyV2';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { Log } from '@core/utils';

export class BoostInfo {
  enable: boolean;
  scheduleTime: TimeScheduler;
  nextRunTime?: number;

  constructor(enable: boolean, scheduleTime: TimeScheduler, nextRunTime?: number) {
    this.enable = enable;
    this.scheduleTime = scheduleTime;
    this.nextRunTime = nextRunTime;
  }

  static fromObject(obj: BoostInfo): BoostInfo {
    const enable = obj.enable ?? false;
    const scheduler = obj.scheduleTime ? TimeScheduler.fromObject(obj.scheduleTime) : BoostInfo.default().scheduleTime;
    return new BoostInfo(enable, scheduler, obj.nextRunTime);
  }

  static default(): BoostInfo {
    //1653933600000 = 01:00:00
    return new BoostInfo(false, new SchedulerDaily(1, 1653933600000));
  }

  copyWith(scheduler?: TimeScheduler): BoostInfo {
    if (scheduler) {
      this.scheduleTime = scheduler;
    }
    return this;
  }
}
