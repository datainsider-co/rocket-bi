/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:42 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { HistogramQuerySetting, Id, QuerySetting, TableColumn } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class HistogramQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new HistogramQuerySetting(value, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.value));
  }
}
