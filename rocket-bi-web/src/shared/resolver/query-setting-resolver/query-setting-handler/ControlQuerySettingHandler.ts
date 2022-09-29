/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:41 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { BellCurve2QuerySetting, GroupMeasurementQuerySetting, Id, QuerySetting, TableColumn } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class ControlQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    return new GroupMeasurementQuerySetting([]);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return true;
  }
}
