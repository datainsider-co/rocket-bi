/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:20 AM
 */

import { DashboardThemeType } from '@core/common/domain/model/dashboard/setting/DashboardThemeType';

export interface DashboardSettingData {
  version?: string;
  enableOverlap?: boolean;
  themeName?: DashboardThemeType;
}
