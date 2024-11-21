/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:23 AM
 */

import { DashboardSetting } from '@core/common/domain';
import { DashboardSettingConvertor } from '@core/common/services/version-resolver/dashboard-setting/DashboardSettingConvertor';

export class DefaultDashboardSettingConvertor implements DashboardSettingConvertor {
  convert(obj: any): DashboardSetting {
    return new DashboardSetting(obj);
  }

  isSupportConvert(obj: any): boolean {
    return true;
  }
}
