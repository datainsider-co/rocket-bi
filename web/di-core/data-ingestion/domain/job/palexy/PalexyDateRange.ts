import { PalexyTime } from './PalexyTime';
import { DateTimeUtils, DateUtils } from '@/utils';
import moment from 'moment/moment';

export class PalexyDateRange {
  constructor(public fromDate: string | PalexyTime, public toDate: string | PalexyTime) {}

  static default() {
    return new PalexyDateRange(PalexyTime.Last60Days, PalexyTime.Today);
  }

  static fromObject(obj: PalexyDateRange) {
    return new PalexyDateRange(obj.fromDate, obj.toDate);
  }

  static getPalexyStringDate(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  static getDate(stringDate: string) {
    const foundPalexyTime = Object.values(PalexyTime).find(time => stringDate === time);
    if (foundPalexyTime) {
      return new Date();
    } else {
      return DateUtils.getDate(stringDate, 'YYYY-MM-DD');
    }
  }

  static getPalexyTimeMode(date: string | PalexyTime): PalexyTime {
    if (Object.values(PalexyTime).includes(date as PalexyTime)) {
      return date as PalexyTime;
    } else {
      return PalexyTime.Custom;
    }
  }

  getFromDate(): Date {
    return PalexyDateRange.getDate(this.fromDate);
  }

  getToDate(): Date {
    return PalexyDateRange.getDate(this.toDate);
  }
}
