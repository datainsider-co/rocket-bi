import { SchedulerName } from '@/shared/enums/SchedulerName';
import { SchedulerMinutely } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerMinutely';
import { SchedulerHourly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerHourly';
import { SchedulerOnce } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerOnce';
import { SchedulerWeeklyV2 } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerWeeklyV2';
import { NoneScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/NoneScheduler';
import { Log } from '@core/utils/Log';
import { SchedulerMonthlyV2 } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerMonthlyV2';
import { SchedulerDailyV2 } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerDailyV2';
import { SchedulerMonthly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerMonthly';
import { SchedulerDaily } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerDaily';
import { SchedulerWeekly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerWeekly';

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
