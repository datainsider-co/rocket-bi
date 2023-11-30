import { DateTimeUtils, DateUtils } from '@/utils';
import { DateFilterData } from '@chart/date-filter/DateFilterData';
import { MainDateMode } from '@core/common/domain/model/widget/filter/MainDateMode';

export abstract class DateFilterUtils {
  static readonly DEFAULT_DATE_FILTER_DATA: DateFilterData = Object.freeze({
    dates: [],
    mode: MainDateMode.allTime
  });

  static isDateFilterData(obj: any): obj is DateFilterData {
    return !!obj?.dates && !!obj?.mode;
  }

  /**
   * @return [startDate, endDate] with format 'YYYY-MM-DD 00:00:00' - 'YYYY-MM-DD 23:59:59'
   */
  static calculatedDates(data: DateFilterData): string[] {
    if (data.mode === MainDateMode.allTime) {
      return [];
    }
    if (data.mode === MainDateMode.custom) {
      return data.dates;
    }
    const dateRange = DateUtils.getDateRange(data.mode);
    return dateRange ? [DateTimeUtils.formatDateTime(dateRange.start), DateTimeUtils.formatDateTime(dateRange.end, true)] : [];
  }
}
