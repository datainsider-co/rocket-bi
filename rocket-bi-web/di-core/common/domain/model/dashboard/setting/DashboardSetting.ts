/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:20 AM
 */

import { Version } from '@core/common/domain/model/dashboard/Version';
import { DashboardSettingVersionResolver } from '@core/common/services/version-resolver/dashboard-setting/DashboardSettingVersionResolver';
import { Di } from '@core/common/modules';
import { DashboardSettingData } from '@core/common/domain/model/dashboard/setting/DashboardSettingData';
import { DashboardThemeType } from '@core/common/domain/model/dashboard/setting/DashboardThemeType';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ThemeUtils } from '@/utils/ThemeUtils';

export class DashboardSetting implements Version {
  version: string;
  enableOverlap: boolean;
  themeName: DashboardThemeType;

  constructor(data: DashboardSettingData) {
    this.version = data.version ?? DashboardSettingVersionResolver.CURRENT_VERSION;
    this.enableOverlap = data.enableOverlap ?? false;
    this.themeName = data.themeName ?? ThemeUtils.getDefaultThemeName();
  }

  static default(): DashboardSetting {
    return new DashboardSetting({});
  }

  static fromObject(obj: any & Version): DashboardSetting {
    const versionResolver = Di.get<DashboardSettingVersionResolver>(DashboardSettingVersionResolver);
    if (versionResolver.isCompatible(obj)) {
      return new DashboardSetting(obj);
    } else {
      return versionResolver.convert(obj) ?? DashboardSetting.default();
    }
  }
}
