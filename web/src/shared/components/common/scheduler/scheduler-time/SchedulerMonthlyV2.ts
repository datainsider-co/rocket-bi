import { SchedulerName } from '@/shared/enums/SchedulerName';
import { ListUtils } from '@/utils';
import { TimeScheduler } from '@/shared/components/common/scheduler/scheduler-time/TimeScheduler';
import { SchedulerMonthly } from '@/shared/components/common/scheduler/scheduler-time/SchedulerMonthly';

export class SchedulerMonthlyV2 implements TimeScheduler {
  className: SchedulerName = SchedulerName.Monthly;
  constructor(public recurOnDays: number[], public atHour: number, public atMinute: number, public atSecond: number, public recurEveryMonth: number) {}
  isValid(): boolean {
    const validRecurOnDays = ListUtils.isNotEmpty(this.recurOnDays);
    const validRecurEveryMonth = this.recurEveryMonth > 0;
    return validRecurOnDays && validRecurEveryMonth;
  }

  toSchedulerMonthly() {
    const date = new Date();
    const atTime = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, date.getDate(), this.atHour, this.atMinute, this.atSecond)).getTime();
    return new SchedulerMonthly(this.recurOnDays, atTime, this.recurEveryMonth);
  }

  static fromObject(obj: any) {
    return new SchedulerMonthlyV2(obj.recurOnDays, obj.atHour, obj.atMinute, obj.atSecond, obj.recurEveryMonth);
  }
}
