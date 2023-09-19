import moment from 'moment';
import { CompareMode, DateRange, DateTypes } from '@/shared';
import { MainDateMode } from '@core/common/domain/model';
import { StringUtils } from '@/utils/StringUtils';
// import { TimeUnit } from '@core/lake-house/domain';
import { DaysOfWeek } from '@/shared/enums/DayOfWeeks';

enum DisplayFormatType {
  SameYear,
  SameMonthYear,
  Default
}

export class DateTimeUtils {
  /**
   * format with format: yyyy-MM-dd HH:mm:ss
   * if (isEndOfDay) => format: yyyy-MM-dd 23:59:59
   * otherwise => format: yyyy-MM-dd 00:00:00
   */
  static formatDate(currentData: Date | string | number, isEndOfDay = false): string {
    const date = moment(currentData).toDate();
    let day = date.getDate().toString();
    let month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (isEndOfDay) {
      return `${year}-${month}-${day} 23:59:59`;
    } else {
      return `${year}-${month}-${day} 00:00:00`;
    }
  }

  /**
   * @param currentData is Date or string or number
   * @param time is string format: HH:mm:ss
   * @return format: yyyy-MM-dd HH:mm:ss if time is not empty
   * otherwise => format: yyyy-MM-dd
   */
  static formatDateWithTime(currentData: Date | string | number, time: string): string {
    const date = moment(currentData).toDate();
    let day = date.getDate().toString();
    let month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (StringUtils.isNotEmpty(time)) {
      return `${year}-${month}-${day} ${time}`;
    } else {
      return `${year}-${month}-${day}`;
    }
  }

  /**
   * @return format Aug 23, 2021
   * @deprecated use formatASMMMDDYYYY instead of
   */
  static formatDateDisplay(currentData: Date | string): string {
    const date = moment(currentData).toDate();
    let day = date.getDate().toString();
    let month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    const shortMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format;
    const shortName = shortMonthName(date);
    return `${shortName} ${day},${year} `;
  }

  /**
   * 07:15:15
   * @param time
   */
  static formatAsHms(time: number): string {
    const hours = Math.trunc(moment.duration(time).asHours());
    const minutes = moment.duration(time).minutes();
    const seconds = moment.duration(time).seconds();
    if (hours === 0 && minutes === 0) {
      return `${seconds}s`;
    } else if (hours === 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  }

  /**
   * 17/02/2016 07:15:15
   * @param time
   */
  static formatAsDDMMYYYYHms(time: number | string | Date, utc?: boolean): string {
    if (utc ?? true) {
      return moment(time)
        .utc()
        .format('DD/MM/YYYY HH:mm:ss');
    } else {
      return moment(time).format('DD/MM/YYYY HH:mm:ss');
    }
  }

  /**
   * 17/02/2016 13:15
   * @param time
   */
  static formatAsDDMMYYYYHM(time: number | string | Date): string {
    return moment(time).format('DD/MM/YYYY HH:mm');
  }

  /**
   * 13:15
   * @param time
   */
  static formatAsHM(time: number | string | Date): string {
    return moment(time).format('HH:mm');
  }

  /**
   * 17/02/2016
   * @param time
   */
  static formatAsDDMMYYYY(time: number | Date | string): string {
    return moment(time).format('DD/MM/YYYY');
  }

  /**
   * Jul, 15
   * @param time
   */
  static formatASMMMYY(date: any): string {
    return moment(date).format('MMM, YY');
  }

  /**
   * Jul, 15
   * @param time
   */
  static formatASMonthYYYY(date: any): string {
    return moment(date).format('MMMM YYYY');
  }

  /**
   * Aug 23, 2021
   * @param time
   */
  static formatASMMMDDYYYY(date: any): string {
    return moment(date).format('ll');
  }

  /**
   * Aug 23
   * @param date
   */
  static formatAsMMMMD(date: any): string {
    return moment(date).format('MMM D');
  }

  /**
   * 25
   * @param date
   */
  static formatAsD(date: any): string {
    return moment(date).format('D');
  }

  /**
   * Mar 25, 2021 08:00:00
   * @param date
   */
  static formatAsMMMDDYYYHHmmss(date: any): string {
    return moment(date).format('MMM DD, YYYY HH:mm:ss');
  }

  /**
   * 20:20:00
   * @param date
   */
  static formatAsHHmmss(date: any): string {
    return moment(date).format('HH:mm:ss');
  }

  static formatDisplayDateRange(dateRange: DateRange): string {
    const { start, end } = dateRange;
    const formatType = DateTimeUtils.getDisplayFormatType(start, end);
    switch (formatType) {
      case DisplayFormatType.SameYear:
        return `${DateTimeUtils.formatAsMMMMD(start)} - ${DateTimeUtils.formatAsMMMMD(end)}`;
      case DisplayFormatType.SameMonthYear:
        return `${DateTimeUtils.formatAsMMMMD(start)} - ${DateTimeUtils.formatAsD(end)}`;
      default:
        return `${DateTimeUtils.formatASMMMDDYYYY(start)} - ${DateTimeUtils.formatASMMMDDYYYY(end)}`;
    }
  }

  static getDisplayFormatType(dateA: any, dateB: any): DisplayFormatType {
    const startDate = moment(dateA);
    const endDate = moment(dateB);
    const isSameYear = startDate.year() === endDate.year();
    const isSameMonth = startDate.month() === endDate.month();
    if (isSameYear && isSameMonth) {
      return DisplayFormatType.SameMonthYear;
    } else if (isSameYear) {
      return DisplayFormatType.SameYear;
    } else {
      return DisplayFormatType.Default;
    }
  }

  static formatDateRange(range: DateRange | undefined, date?: DateTypes): string {
    switch (date) {
      case DateTypes.minute:
      case DateTypes.hour: {
        if (range) {
          const { start, end } = range;
          const startDateAsString = DateTimeUtils.formatAsDDMMYYYYHM(start);
          const endDateAsString = DateTimeUtils.formatAsHM(end);
          return `${startDateAsString} - ${endDateAsString}`;
        }
        return '';
      }
      default: {
        if (range) {
          const { start, end } = range;
          const startDateAsString = DateTimeUtils.formatAsDDMMYYYY(start);
          const endDateAsString = DateTimeUtils.formatAsDDMMYYYY(end);
          const isStartFirst = moment(start).valueOf() - moment(end).valueOf() < 0;
          return isStartFirst ? `${startDateAsString} - ${endDateAsString}` : `${endDateAsString} - ${startDateAsString}`;
        }
        return '';
      }
    }
  }
}

export class DateUtils {
  static DefaultLocale = 'en-US';
  static DefaultMinDate = new Date(1970, 0, 1);
  static DefaultMaxDate = new Date(2099, 0, 1);

  static isDate(date: any) {
    return moment.isDate(date);
  }

  static getDate(date: any, format?: string) {
    return moment(date, format).toDate();
  }

  static getThisMinute(): DateRange {
    const weekStart = moment().startOf('minute');
    const result: DateRange = { start: weekStart.toDate(), end: moment().toDate() };
    return result;
  }

  static getThisHour(): DateRange {
    const weekStart = moment().startOf('hour');
    const result: DateRange = { start: weekStart.toDate(), end: moment().toDate() };
    return result;
  }

  static getThisWeek(): DateRange {
    const weekStart = moment().startOf('week');
    const result: DateRange = { start: weekStart.toDate(), end: moment().toDate() };
    return result;
  }

  static getThisMonth(): DateRange {
    const monthStart = moment().startOf('month');
    const result: DateRange = { start: monthStart.toDate(), end: moment().toDate() };
    return result;
  }

  static getThisQuarter(): DateRange {
    const quarterStart = moment().startOf('quarter');
    const result: DateRange = { start: quarterStart.toDate(), end: moment().toDate() };
    return result;
  }

  static getThisYear(): DateRange {
    const yearStart = moment().startOf('year');
    const result: DateRange = { start: yearStart.toDate(), end: moment().toDate() };
    return result;
  }

  static getLastDay(): DateRange {
    const lastDay = moment().add(-1, 'd');
    const result: DateRange = { start: lastDay.toDate(), end: lastDay.toDate() };
    return result;
  }

  static getLastWeek(): DateRange {
    const lastWeekStartDay = moment()
      .subtract(1, 'week')
      .startOf('week');
    const lastWeekEndDay = moment()
      .subtract(1, 'week')
      .endOf('week');
    const result: DateRange = { start: lastWeekStartDay.toDate(), end: lastWeekEndDay.toDate() };
    return result;
  }

  static getLastMonth(): DateRange {
    const lastMonthStartDay = moment()
      .subtract(1, 'month')
      .startOf('month');
    const lastMonthEndDay = moment()
      .subtract(1, 'month')
      .endOf('month');
    const result: DateRange = { start: lastMonthStartDay.toDate(), end: lastMonthEndDay.toDate() };
    return result;
  }

  static getLastQuarter(): DateRange {
    const lastQuarterStartDay = moment()
      .subtract(1, 'quarter')
      .startOf('quarter');
    const lastQuarterEndDay = moment()
      .subtract(1, 'quarter')
      .endOf('quarter');
    const result: DateRange = {
      start: lastQuarterStartDay.toDate(),
      end: lastQuarterEndDay.toDate()
    };
    return result;
  }

  static getLastYear(): DateRange {
    const lastYearStartDay = moment()
      .subtract(1, 'year')
      .startOf('year');
    const lastYearEndDay = moment()
      .subtract(1, 'year')
      .endOf('year');
    const result: DateRange = { start: lastYearStartDay.toDate(), end: lastYearEndDay.toDate() };
    return result;
  }

  static getLast7Day(): DateRange {
    const last7Day = moment().add(-7, 'd');
    const result: DateRange = { start: last7Day.toDate(), end: moment().toDate() };
    return result;
  }

  static getLast30Days(): DateRange {
    const last30Day = moment().add(-30, 'd');
    const result: DateRange = { start: last30Day.toDate(), end: moment().toDate() };
    return result;
  }

  static compareToPreviousPeriod(currentStartDate: Date | string | null | undefined, currentEndDate: Date | string | null | undefined): DateRange {
    const newEndDate = moment(currentStartDate).add(-1, 'd');
    const duration = moment(currentStartDate).diff(moment(currentEndDate), 'days');
    const newStartDate = moment(newEndDate).add(duration, 'd');
    const result: DateRange = { start: newStartDate.toDate(), end: newEndDate.toDate() };
    return result;
  }

  static compareToSamePeriodLastMonth(currentStartDate: Date | string | null | undefined, currentEndDate: Date | string | null | undefined): DateRange {
    const newStartDate = moment(currentStartDate).add(-1, 'M');
    const newEndDate = moment(currentEndDate).add(-1, 'M');
    const result: DateRange = { start: newStartDate.toDate(), end: newEndDate.toDate() };
    return result;
  }

  static compareToSamePeriodLastQuarter(currentStartDate: Date | string | null | undefined, currentEndDate: Date | string | null | undefined): DateRange {
    const newStartDate = moment(currentStartDate).add(-1, 'Q');
    const newEndDate = moment(currentEndDate).add(-1, 'Q');
    const result: DateRange = { start: newStartDate.toDate(), end: newEndDate.toDate() };
    return result;
  }

  static compareToSamePeriodLastYear(currentStartDate: Date | string | null | undefined, currentEndDate: Date | string | null | undefined): DateRange {
    const newStartDate = moment(currentStartDate).add(-1, 'y');
    const newEndDate = moment(currentEndDate).add(-1, 'y');
    const result: DateRange = { start: newStartDate.toDate(), end: newEndDate.toDate() };
    return result;
  }

  static getAllTime(): DateRange {
    return { start: DateUtils.DefaultMinDate, end: DateUtils.DefaultMaxDate };
  }

  static getThisDay() {
    return { start: new Date(), end: new Date() };
  }

  /**
   * Get date range by mode
   * @returns null when mode is custom or allTime
   */
  static getDateRange(mode: MainDateMode): DateRange | null {
    switch (mode) {
      case MainDateMode.thisDay:
        return DateUtils.getThisDay();
      case MainDateMode.thisWeek:
        return DateUtils.getThisWeek();
      case MainDateMode.thisMonth:
        return DateUtils.getThisMonth();

      case MainDateMode.thisQuarter:
        return DateUtils.getThisQuarter();

      case MainDateMode.thisYear:
        return DateUtils.getThisYear();

      case MainDateMode.lastDay:
        return DateUtils.getLastDay();

      case MainDateMode.lastWeek:
        return DateUtils.getLastWeek();

      case MainDateMode.lastMonth:
        return DateUtils.getLastMonth();

      case MainDateMode.lastQuarter:
        return DateUtils.getLastQuarter();

      case MainDateMode.lastYear:
        return DateUtils.getLastYear();

      case MainDateMode.last7Days:
        return DateUtils.getLast7Day();

      case MainDateMode.last30Days:
        return DateUtils.getLast30Days();

      default:
        return null;
    }
  }

  static getPeriodDateRange(mode: MainDateMode, currentRange: DateRange): DateRange {
    switch (mode) {
      case MainDateMode.previousPeriod:
        return DateUtils.compareToPreviousPeriod(currentRange?.start, currentRange?.end);
      case MainDateMode.samePeriodLastMonth:
        return DateUtils.compareToSamePeriodLastMonth(currentRange?.start, currentRange?.end);
      case MainDateMode.samePeriodLastQuarter:
        return DateUtils.compareToSamePeriodLastQuarter(currentRange?.start, currentRange?.end);
      case MainDateMode.samePeriodLastYear:
        return DateUtils.compareToSamePeriodLastYear(currentRange?.start, currentRange?.end);
      default:
        return currentRange;
    }
  }

  /**
   * get compare date range by compare mode
   * @param compareMode
   * @param firstRange
   * @returns null if compareMode is none or custom
   */
  static getCompareDateRange(compareMode: CompareMode, firstRange: DateRange): DateRange | null {
    switch (compareMode) {
      case CompareMode.previousPeriod:
        return DateUtils.compareToPreviousPeriod(firstRange?.start, firstRange?.end);
      case CompareMode.samePeriodLastMonth:
        return DateUtils.compareToSamePeriodLastMonth(firstRange?.start, firstRange?.end);
      case CompareMode.samePeriodLastQuarter:
        return DateUtils.compareToSamePeriodLastQuarter(firstRange?.start, firstRange?.end);
      case CompareMode.samePeriodLastYear:
        return DateUtils.compareToSamePeriodLastYear(firstRange?.start, firstRange?.end);
      case CompareMode.none:
      case CompareMode.custom:
        return null;
      default:
        return null;
    }
  }

  static cloneDateRange(defaultDateRange: DateRange): DateRange {
    return {
      start: moment(defaultDateRange.start).toDate(),
      end: moment(defaultDateRange.end).toDate()
    };
  }

  static getLastNDays(n: number): DateRange | undefined {
    if (n < 0) {
      return void 0;
    } else {
      const today = moment();
      const lastNDays = moment().subtract(n, 'days');
      return { start: lastNDays.toDate(), end: today.toDate() };
    }
  }

  static getLastNWeeks(n: number): DateRange | undefined {
    if (n < 0) {
      return void 0;
    } else {
      const today = moment();
      const lastNWeeks = moment().subtract(n, 'weeks');
      return { start: lastNWeeks.toDate(), end: today.toDate() };
    }
  }

  static getLastNMonths(n: number): DateRange | undefined {
    if (n < 0) {
      return void 0;
    } else {
      const today = moment();
      const lastNMonths = moment().subtract(n, 'months');
      return { start: lastNMonths.toDate(), end: today.toDate() };
    }
  }

  static getLastNQuarters(n: number): DateRange | undefined {
    if (n < 0) {
      return void 0;
    } else {
      const today = moment();
      const lastNQuarters = moment().subtract(n, 'quarters');
      return { start: lastNQuarters.toDate(), end: today.toDate() };
    }
  }

  static getLastNYears(n: number): DateRange | undefined {
    if (n < 0) {
      return void 0;
    } else {
      const today = moment();
      const lastNYears = moment().subtract(n, 'years');
      return { start: lastNYears.toDate(), end: today.toDate() };
    }
  }

  static getLastNMinutes(n: number): DateRange | undefined {
    if (n < 0) {
      return void 0;
    } else {
      const today = moment();
      const lastNMinutes = moment().subtract(n, 'minutes');
      return { start: lastNMinutes.toDate(), end: today.toDate() };
    }
  }

  static getLastNHours(n: number): DateRange | undefined {
    if (n < 0) {
      return void 0;
    } else {
      const today = moment();
      const lastNHours = moment().subtract(n, 'hours');
      return { start: lastNHours.toDate(), end: today.toDate() };
    }
  }

  static getLastNDate(date: DateTypes, n: number): DateRange | undefined {
    switch (date) {
      case DateTypes.minute:
        return this.getLastNMinutes(n);
      case DateTypes.hour:
        return DateUtils.getLastNHours(n);
      case DateTypes.day:
        return DateUtils.getLastNDays(n);
      case DateTypes.week:
        return DateUtils.getLastNWeeks(n);
      case DateTypes.month:
        return DateUtils.getLastNMonths(n);
      case DateTypes.quarter:
        return DateUtils.getLastNQuarters(n);
      case DateTypes.year:
        return DateUtils.getLastNYears(n);
    }
  }

  // static getNextNDate(date: TimeUnit, n: number): number {
  //   if (n < 0) {
  //     return 0;
  //   } else {
  //     switch (date) {
  //       case TimeUnit.SECOND:
  //         return n * 1000;
  //       case TimeUnit.MINUTE:
  //         return n * 60 * 1000;
  //       case TimeUnit.HOUR:
  //         return n * 60 * 60 * 1000;
  //       case TimeUnit.DAY:
  //         return n * 24 * 60 * 60 * 1000;
  //       case TimeUnit.WEEK:
  //         return n * 7 * 24 * 60 * 60 * 1000;
  //       case TimeUnit.MONTH:
  //         return n * 30 * 24 * 60 * 60 * 1000;
  //       case TimeUnit.YEAR:
  //         return n * 12 * 30 * 24 * 60 * 60 * 1000;
  //     }
  //   }
  // }

  static getCurrentDate(date: DateTypes): DateRange | undefined {
    switch (date) {
      case DateTypes.minute:
        return this.getThisMinute();
      case DateTypes.hour:
        return DateUtils.getThisHour();
      case DateTypes.day:
        return DateUtils.getThisDay();
      case DateTypes.week:
        return DateUtils.getThisWeek();
      case DateTypes.month:
        return DateUtils.getThisMonth();
      case DateTypes.quarter:
        return DateUtils.getThisQuarter();
      case DateTypes.year:
        return DateUtils.getThisYear();
    }
  }

  static HHMMSSToMs(time: string) {
    const [h, m, s] = time.split(':');
    const hAsMs = Number(h) * 60 * 60 * 1000;
    const mAsMs = Number(m) * 60 * 1000;
    const sAsMs = Number(s) * 1000;
    return hAsMs + mAsMs + sAsMs;
  }

  static dayToNumber(day: DaysOfWeek) {
    switch (day) {
      case DaysOfWeek.Sunday:
        return 1;
      case DaysOfWeek.Monday:
        return 2;
      case DaysOfWeek.Tuesday:
        return 3;
      case DaysOfWeek.Wednesday:
        return 4;
      case DaysOfWeek.Thursday:
        return 5;
      case DaysOfWeek.Friday:
        return 6;
      case DaysOfWeek.Saturday:
        return 7;
    }
  }

  static numberToDate(n: number): DaysOfWeek | undefined {
    switch (n) {
      case 1:
        return DaysOfWeek.Sunday;
      case 2:
        return DaysOfWeek.Monday;
      case 3:
        return DaysOfWeek.Tuesday;
      case 4:
        return DaysOfWeek.Wednesday;
      case 5:
        return DaysOfWeek.Thursday;
      case 6:
        return DaysOfWeek.Friday;
      case 7:
        return DaysOfWeek.Saturday;
      default:
        return void 0;
    }
  }

  static calculateDelayTimesOfWeek(day: DaysOfWeek, time: number) {
    const timeAsMS = DateUtils.HHMMSSToMs(DateTimeUtils.formatAsHHmmss(moment(time).toDate()));
    const dayAsNumber = this.dayToNumber(day);
    return dayAsNumber * timeAsMS;
  }

  static calculateDelayTimesOfMonth(day: number, time: number) {
    const timeAsMS = DateUtils.HHMMSSToMs(DateTimeUtils.formatAsHHmmss(moment(time).toDate()));
    return timeAsMS + day * 86400000;
  }

  static covertTimeToDate(time: number) {
    return DateUtils.DefaultMinDate.getDate() + time;
  }

  /**
   * return start timestamp of date: Wed Jun 22 2022 11:54:27 GMT+0700 (Indochina Time) -> 1655830800000(Wed Jun 22 2022 00:00:00 GMT+0700 (Indochina Time))
   */
  static toStartTime(date: Date): number {
    return date.setHours(0, 0, 0, 0);
  }

  /**
   * return end timestamp of date: Wed Jun 22 2022 11:54:27 GMT+0700 (Indochina Time) -> 1655917199999(Wed Jun 22 2022 23:59:59:999 GMT+0700 (Indochina Time))
   */
  static toEndTime(date: Date): number {
    return date.setHours(23, 59, 59, 999);
  }

  static yesterday(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  }

  static laterThan(date1: Date, date2: Date) {
    return date1.getTime() > date2.getTime();
  }

  static timeLeft(time: moment.MomentInput) {
    const dayLeft = moment(time).diff(moment(Date.now()), 'days');
    if (dayLeft > 0) {
      return dayLeft > 1 ? dayLeft + ' Days' : dayLeft + ' Day';
    } else {
      const hourLeft = moment(time).diff(moment(Date.now()), 'hours');
      if (hourLeft > 0) {
        return hourLeft > 1 ? hourLeft + ' Hours' : hourLeft + ' Hour';
      } else {
        const minuteLeft = moment(time).diff(moment(Date.now()), 'minutes');
        return minuteLeft > 1 ? minuteLeft + ' Minutes' : minuteLeft + ' Minute';
      }
    }
  }
}
