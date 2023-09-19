/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:20 AM
 */

import { Version } from '@core/common/domain/model/dashboard/Version';
import { DashboardSettingVersionResolver } from '@core/common/services/version-resolver/dashboard-setting/DashboardSettingVersionResolver';
import { Di } from '@core/common/modules';
import { DashboardThemeType } from '@core/common/domain/model/dashboard/setting/DashboardThemeType';
import { ThemeUtils } from '@/utils/ThemeUtils';
import { MainDateFilter2 } from '../../widget/filter/MainDateFilter2';
import { BorderInfo } from './Border';
import { SizeInfo } from './SizeInfo';
import { BackgroundImageInfo } from './BackgroundImageInfo';
import { BackgroundInfo } from './BackgroundInfo';
import { WidgetSetting } from './WidgetSetting';

export class DashboardSetting implements Version {
  version: string;
  enableOverlap: boolean;
  themeName: DashboardThemeType;
  mainDateFilter?: MainDateFilter2;

  border: BorderInfo;
  size: SizeInfo;
  backgroundImage: BackgroundImageInfo;
  background: BackgroundInfo;
  widgetSetting: WidgetSetting;

  constructor(data: {
    version?: string;
    enableOverlap?: boolean;
    themeName?: DashboardThemeType;
    mainDateFilter?: MainDateFilter2;
    border?: BorderInfo;
    size?: SizeInfo;
    backgroundImage?: BackgroundImageInfo;
    background?: BackgroundInfo;
    widgetSetting?: WidgetSetting;
  }) {
    this.version = data.version ?? DashboardSettingVersionResolver.CURRENT_VERSION;
    this.enableOverlap = data.enableOverlap ?? false;
    this.themeName = data.themeName ?? ThemeUtils.getDefaultThemeName();
    this.mainDateFilter = data.mainDateFilter ? MainDateFilter2.fromObject(data.mainDateFilter) : void 0;
    this.border = data.border ? BorderInfo.fromObject(data.border) : BorderInfo.default();
    this.size = data.size ? SizeInfo.fromObject(data.size) : SizeInfo.default();
    this.backgroundImage = data.backgroundImage ? BackgroundImageInfo.fromObject(data.backgroundImage) : BackgroundImageInfo.default();
    this.background = data.background ? BackgroundInfo.fromObject(data.background) : BackgroundInfo.default();
    this.widgetSetting = data.widgetSetting ? WidgetSetting.fromObject(data.widgetSetting) : WidgetSetting.default();
  }

  static default(): DashboardSetting {
    return new DashboardSetting({
      mainDateFilter: MainDateFilter2.default(),
      border: BorderInfo.default(),
      size: SizeInfo.default(),
      backgroundImage: BackgroundImageInfo.default(),
      background: BackgroundInfo.default(),
      widgetSetting: WidgetSetting.default()
    });
  }

  static fromObject(obj: any & Version): DashboardSetting {
    const versionResolver = Di.get<DashboardSettingVersionResolver>(DashboardSettingVersionResolver);
    if (versionResolver.isCompatible(obj)) {
      return new DashboardSetting(obj);
    } else {
      return versionResolver.convert(obj) ?? DashboardSetting.default();
    }
  }

  withMainDateFilter(mainDateFilter?: MainDateFilter2 | null): DashboardSetting {
    return new DashboardSetting({
      ...this,
      version: this.version,
      enableOverlap: this.enableOverlap,
      themeName: this.themeName,
      mainDateFilter: mainDateFilter ?? void 0
    });
  }
}
