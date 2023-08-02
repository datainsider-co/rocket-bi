/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:21 AM
 */

import { DashboardSetting, Version } from '@core/common/domain';

export abstract class DashboardSettingConvertor {
  abstract isSupportConvert(obj: any & Version): boolean;

  abstract convert(obj: any): DashboardSetting;
}
