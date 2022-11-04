import { MainDateMode } from '@core/common/domain';
import { DateTimeFormatter, DateUtils } from '@/utils';

export interface DateFilterData {
  dates: string[];
  mode: MainDateMode;
}
