/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:20 AM
 */

import { Version } from '@core/domain/Model/Dashboard/Version';
import { DashboardSettingVersionResolver } from '@core/services/VersionResolver/DashboardSetting/DashboardSettingVersionResolver';
import { DI } from '@core/modules';
import { DashboardSettingData } from '@core/domain/Model/Dashboard/Setting/DashboardSettingData';
import { DashboardThemeType } from '@core/domain/Model/Dashboard/Setting/DashboardThemeType';
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
    const versionResolver = DI.get<DashboardSettingVersionResolver>(DashboardSettingVersionResolver);
    if (versionResolver.isCompatible(obj)) {
      return new DashboardSetting(obj);
    } else {
      return versionResolver.convert(obj) ?? DashboardSetting.default();
    }
  }
}
