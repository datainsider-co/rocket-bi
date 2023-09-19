import { MainDateMode } from '@core/common/domain';

export interface DateFilterData {
  /**
   * [startDate, endDate] with format 'YYYY-MM-DD 00:00:00' - 'YYYY-MM-DD 23:59:59'
   */
  dates: string[];
  mode: MainDateMode;
}
