import { SchedulerName } from '@/shared/enums/SchedulerName';
import { SchedulerMinutely } from '@/shared/components/common/scheduler/scheduler-time/SchedulerMinutely';
import { SchedulerHourly } from '@/shared/components/common/scheduler/scheduler-time/SchedulerHourly';
import { SchedulerOnce } from '@/shared/components/common/scheduler/scheduler-time/SchedulerOnce';
import { SchedulerWeeklyV2 } from '@/shared/components/common/scheduler/scheduler-time/SchedulerWeeklyV2';
import { NoneScheduler } from '@/shared/components/common/scheduler/scheduler-time/NoneScheduler';
import { Log } from '@core/utils/Log';
import { SchedulerMonthlyV2 } from '@/shared/components/common/scheduler/scheduler-time/SchedulerMonthlyV2';
import { SchedulerDailyV2 } from '@/shared/components/common/scheduler/scheduler-time/SchedulerDailyV2';
import { SchedulerMonthly } from '@/shared/components/common/scheduler/scheduler-time/SchedulerMonthly';
import { SchedulerDaily } from '@/shared/components/common/scheduler/scheduler-time/SchedulerDaily';
import { SchedulerWeekly } from '@/shared/components/common/scheduler/scheduler-time/SchedulerWeekly';

export abstract class TimeScheduler {
  abstract className: SchedulerName;
  abstract atTime?: number;
  abstract recurEvery?: number;

  abstract isValid(): boolean;

  static validTime(time: number) {
    return !isNaN(time);
  }

  static fromObject(obj: any): TimeScheduler {
    switch (obj.className as SchedulerName) {
      case SchedulerName.Minutely:
        return SchedulerMinutely.fromObject(obj);
      case SchedulerName.Hourly:
        return SchedulerHourly.fromObject(obj);

      case SchedulerName.Daily:
        return SchedulerDailyV2.fromObject(obj).toSchedulerDaily();
      case SchedulerName.Weekly:
        return SchedulerWeeklyV2.fromObject(obj).toSchedulerWeekly();
      case SchedulerName.Monthly:
        return SchedulerMonthlyV2.fromObject(obj).toSchedulerMonthly();
      case SchedulerName.Once:
        return SchedulerOnce.fromObject(obj);
      default: {
        return NoneScheduler.fromObject();
      }
    }
  }

  //todo: use this returned object interact with server
  static toSchedulerV2(obj: TimeScheduler): TimeScheduler {
    switch (obj.className as SchedulerName) {
      case SchedulerName.Daily:
        return (obj as SchedulerDaily).toSchedulerDailyV2();
      case SchedulerName.Weekly:
        return (obj as SchedulerWeekly).toSchedulerWeeklyV2();
      case SchedulerName.Monthly:
        return (obj as SchedulerMonthly).toSchedulerMonthlyV2();
        return SchedulerOnce.fromObject(obj);
      default: {
        return obj;
      }
    }
  }
}
