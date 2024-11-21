/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:41 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { GaugeQuerySetting, Id, QuerySetting, TableColumn } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class BulletQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new GaugeQuerySetting(value, void 0, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.value));
  }
}
