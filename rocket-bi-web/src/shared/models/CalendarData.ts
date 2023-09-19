/*
 * @author: tvc12 - Thien Vi
 * @created: 12/18/20, 2:38 PM
 */

import { CompareMode, DateRange, DateTimeConstants } from '@/shared';
import { MainDateMode } from '@core/common/domain/model';
import { DIException } from '@core/common/domain';

export class CalendarData {
  /**
   * @deprecated it is not used
   */
  compareDateRange: DateRange | null;
  chosenDateRange: DateRange | null;

  compareMode: CompareMode;
  filterMode: MainDateMode;

  constructor(obj: { compareDateRange: DateRange | null; dateRange: DateRange | null; compareMode: CompareMode; filterMode: MainDateMode }) {
    this.compareDateRange = obj.compareDateRange;
    this.chosenDateRange = obj.dateRange;
    this.compareMode = obj.compareMode;
    this.filterMode = obj.filterMode;
  }

  setChosenDateRange(dateRange: DateRange) {
    this.chosenDateRange = dateRange;
  }

  get isDisableCompare(): boolean {
    return this.isAllTime;
  }

  static default(): CalendarData {
    return new CalendarData({
      compareMode: CompareMode.none,
      filterMode: MainDateMode.thisDay,
      compareDateRange: {
        start: new Date(),
        end: new Date()
      },
      dateRange: {
        start: new Date(),
        end: new Date()
      }
    });
  }

  get isAllTime(): boolean {
    return this.filterMode == MainDateMode.allTime;
  }

  /**
   * @deprecated always return false, because compare mode is moved to query request
   */
  get isCompare(): boolean {
    return this.compareMode != CompareMode.none;
  }

  showAllTime() {
    this.filterMode = MainDateMode.allTime;
    this.chosenDateRange = null;
  }

  updateCompareRange(compareRange: DateRange) {
    this.compareDateRange = {
      start: compareRange.start,
      end: compareRange.end
    };
  }

  updateChosenDateRange(newDateRange: DateRange) {
    this.chosenDateRange = {
      start: newDateRange.start,
      end: newDateRange.end
    };
  }
}
