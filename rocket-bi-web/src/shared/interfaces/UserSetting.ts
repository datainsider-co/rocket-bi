import { DIMap } from '@core/common/domain/model';

export interface UserSetting {
  chartType?: string;
  options?: any;
}

export interface DropdownUserSetting extends UserSetting {
  isApplyAllRelatives?: boolean;
  keyColIndex?: number;
  valueColIndex?: number;
}

export interface ChartUserSetting extends UserSetting {
  seriesTypes?: DIMap<string>;
  baseTypes?: Record<string, number>;
}
