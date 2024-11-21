/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 11:21 AM
 */
import { DashboardSettingConvertor } from '@core/common/services/version-resolver/dashboard-setting/DashboardSettingConvertor';
import { DashboardSetting, Version } from '@core/common/domain';

export class DashboardSettingVersionResolver {
  static readonly CURRENT_VERSION = '1';

  constructor(private readonly convertors: DashboardSettingConvertor[]) {}

  isCompatible(obj: any & Version): boolean {
    return obj.version == DashboardSettingVersionResolver.CURRENT_VERSION;
  }

  convert(obj: any & Version): DashboardSetting | undefined {
    const convertor: DashboardSettingConvertor | undefined = this.convertors.find(convert => convert.isSupportConvert(obj));
    if (convertor) {
      return convertor.convert(obj);
    }
  }
}
