import { MainDateMode } from '@core/common/domain';
import { DateTimeFormatter, DateUtils } from '@/utils';
import { DateFilterData } from '@chart/date-filter/DateFilterData';

export abstract class DateFilterUtils {
  static defaultDateFilterData: DateFilterData = {
    dates: [],
    mode: MainDateMode.allTime
  };

  static isDateFilterData(obj: any): obj is DateFilterData {
    return !!obj?.dates && !!obj?.mode;
  }

  static calculatedDates(data: DateFilterData): string[] {
    if (data.mode === MainDateMode.allTime) {
      return [];
    }
    if (data.mode === MainDateMode.custom) {
      return data.dates;
    }
    const dateRange = DateUtils.getDateRange(data.mode);
    return dateRange ? [DateTimeFormatter.formatDate(dateRange.start), DateTimeFormatter.formatDate(dateRange.end)] : [];
  }
}
