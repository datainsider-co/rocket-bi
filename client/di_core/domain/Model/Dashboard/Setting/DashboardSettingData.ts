/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:20 AM
 */

import { DashboardThemeType } from '@core/domain/Model/Dashboard/Setting/DashboardThemeType';

export interface DashboardSettingData {
  version?: string;
  enableOverlap?: boolean;
  themeName?: DashboardThemeType;
}
