/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:24 AM
 */

import { DashboardSettingConvertor } from '@core/services/VersionResolver/DashboardSetting/DashboardSettingConvertor';
import { DashboardSettingVersionResolver } from '@core/services/VersionResolver/DashboardSetting/DashboardSettingVersionResolver';

export class DashboardSettingVersionBuilder {
  private readonly convertors: DashboardSettingConvertor[] = [];

  add(convertor: DashboardSettingConvertor): DashboardSettingVersionBuilder {
    this.convertors.push(convertor);
    return this;
  }

  build() {
    return new DashboardSettingVersionResolver(this.convertors);
  }
}
