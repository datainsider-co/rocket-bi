/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:40 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { FunnelQuerySetting, Id, QuerySetting, TableColumn } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class FunnelQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const legend: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.legend);
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new FunnelQuerySetting(legend, value, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.legend)) && ListUtils.isNotEmpty(configsAsMap.get(ConfigType.value));
  }
}
