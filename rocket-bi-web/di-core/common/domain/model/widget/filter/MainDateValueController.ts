import { ValueControlInfo, ValueController, ValueControlType } from '@core/common/domain';
import { MainDateMode } from '@core/common/domain/model';
import { DateFilterUtils } from '@chart/date-filter/DateFilterUtils';
import { isArray } from 'lodash';
import { MainDateData } from '@/screens/dashboard-detail/stores';
import { DateTimeUtils } from '@/utils';
import { MainDateFilter2 } from '.';

export class MainDateValueController implements ValueController {
  private readonly mainDateFilter!: MainDateFilter2;

  constructor(mainDateFilter: MainDateFilter2) {
    this.mainDateFilter = mainDateFilter;
  }

  getDefaultValueAsMap(): Map<ValueControlType, string[]> | undefined {
    const dateRanges: string[] = DateFilterUtils.calculatedDates({
      mode: this.mainDateFilter.mode ?? MainDateMode.allTime,
      dates: []
    });
    if (isArray(dateRanges) && dateRanges.length == 2) {
      return new Map<ValueControlType, string[]>([
        [ValueControlType.MinValue, [dateRanges[0]]],
        [ValueControlType.MaxValue, [dateRanges[1]]]
      ]);
    } else {
      return void 0;
    }
  }

  getDefaultValueMapWithDateData(data: MainDateData): Map<ValueControlType, string[]> | undefined {
    const customDateRanges: string[] = this.toDateRange(data);
    const dateRanges: string[] = DateFilterUtils.calculatedDates({
      mode: data.mode ?? this.mainDateFilter.mode,
      dates: customDateRanges
    });

    if (isArray(dateRanges) && dateRanges.length == 2) {
      return new Map<ValueControlType, string[]>([
        [ValueControlType.MinValue, [dateRanges[0]]],
        [ValueControlType.MaxValue, [dateRanges[1]]]
      ]);
    } else {
      return void 0;
    }
  }

  /**
   * @return [startDate, endDate] with format 'YYYY-MM-DD 00:00:00' - 'YYYY-MM-DD 23:59:59'
   */
  private toDateRange(data: MainDateData): string[] {
    if (data.chosenDateRange && data.chosenDateRange.start && data.chosenDateRange.end) {
      return [DateTimeUtils.formatDateTime(data.chosenDateRange.start), DateTimeUtils.formatDateTime(data.chosenDateRange.end, true)];
    } else {
      return [];
    }
  }

  getSupportedControls(): ValueControlInfo[] {
    return [new ValueControlInfo(ValueControlType.MinValue, 'Start date'), new ValueControlInfo(ValueControlType.MaxValue, 'End date')];
  }

  isEnableControl(): boolean {
    return true;
  }
}
