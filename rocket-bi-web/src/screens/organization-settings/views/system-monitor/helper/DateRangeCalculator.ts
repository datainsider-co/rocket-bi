import { MainDateMode } from '@core/common/domain';
import { DateUtils } from '@/utils';
import { isDate } from 'moment';
import { Route } from 'vue-router';

export class DateRangeCalculator {
  mode: MainDateMode;

  constructor() {
    this.mode = MainDateMode.allTime;
  }

  withMode(mode: MainDateMode | null): DateRangeCalculator {
    this.mode = mode ?? MainDateMode.allTime;
    return this;
  }

  calculate(router: Route): { start: number; end: number } | null {
    if (this.mode === MainDateMode.allTime) {
      return null;
    }

    if (!this.mode) {
      return null;
    }

    if (this.mode === MainDateMode.custom && this.isRouterDateRangeValid(router)) {
      return {
        start: this.wrapStartTimeStamp(new Date(+router.query.s.toString() * 1000)),
        end: this.wrapEndTimeStamp(new Date(+router.query.e.toString() * 1000))
      };
    }

    const { start, end } = DateUtils.getDateRange(this.mode!)!;
    return {
      start: this.wrapStartTimeStamp(start as Date),
      end: this.wrapEndTimeStamp(end as Date)
    };
  }

  private wrapStartTimeStamp(date: Date): number {
    return date.setHours(0, 0, 0, 0);
  }

  private wrapEndTimeStamp(date: Date): number {
    return date.setHours(23, 59, 59, 999);
  }

  private isRouterDateRangeValid(router: Route): boolean {
    if (!router.query.s?.toString() || isNaN(+router.query.s.toString())) {
      return false;
    }

    if (!router.query.e?.toString() || isNaN(+router.query.s.toString())) {
      return false;
    }
    const start = new Date(+router.query.s.toString() * 1000);
    const end = new Date(+router.query.e.toString() * 1000);
    return isDate(start) && isDate(end);
  }
}
