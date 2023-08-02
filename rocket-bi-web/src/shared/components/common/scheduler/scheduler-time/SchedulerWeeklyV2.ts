import { SchedulerName } from '@/shared/enums/SchedulerName';
import { DaysOfWeek } from '@/shared/enums/DayOfWeeks';
import { DateTimeFormatter, ListUtils } from '@/utils';
import { TimeScheduler } from '@/shared/components/common/scheduler/scheduler-time/TimeScheduler';
import { SchedulerWeekly } from '@/shared/components/common/scheduler/scheduler-time/SchedulerWeekly';
import moment from 'moment';
import { Log } from '@core/utils';

export class SchedulerWeeklyV2 implements TimeScheduler {
  className: SchedulerName = SchedulerName.Weekly;
  constructor(public recurEvery: number, public atHour: number, public atMinute: number, public atSecond: number, public includeDays: DaysOfWeek[]) {}
  isValid(): boolean {
    const validWeekDays = ListUtils.isNotEmpty(this.includeDays);
    const validRecurEvery = this.recurEvery > 0;
    return validRecurEvery && validWeekDays;
  }

  toSchedulerWeekly() {
    const date = new Date();
    const atTime = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, date.getDate(), this.atHour, this.atMinute, this.atSecond)).getTime();
    Log.debug('toSchedulerWeekly::', this.atHour, this.atMinute, this.atSecond, atTime);
    return new SchedulerWeekly(this.recurEvery, atTime, this.includeDays);
  }

  static fromObject(obj: any) {
    return new SchedulerWeeklyV2(obj.recurEvery, obj.atHour, obj.atMinute, obj.atSecond, obj.includeDays);
  }
}
