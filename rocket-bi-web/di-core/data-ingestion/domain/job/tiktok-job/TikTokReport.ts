import { DateRange } from '@/shared';
import { DateTimeFormatter, DateUtils } from '@/utils';

export class TikTokReport {
  reportType: string;
  timeRange: DateRange;

  constructor(reportType: string, timeRange: DateRange) {
    this.reportType = reportType;
    this.timeRange = timeRange;
  }

  static fromObject(obj: any): TikTokReport {
    return new TikTokReport(obj.reportType, obj.timeRange);
  }

  static default(): TikTokReport {
    return new TikTokReport('', TikTokReport.getTimeRange(DateUtils.getLast7Day()));
  }

  static getTimeRange(dateRange: DateRange) {
    return {
      start: DateTimeFormatter.formatDateWithTime(dateRange.start, ''),
      end: DateTimeFormatter.formatDateWithTime(dateRange.end, '')
    };
  }

  setDateRange(dateRange: DateRange) {
    this.timeRange = TikTokReport.getTimeRange(dateRange);
  }
}
