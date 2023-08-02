/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:41 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { HeatMapQuerySetting, Id, QuerySetting, TableColumn } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class HeatMapQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const xAxis: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.xAxis);
    const yAxis: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.yAxis);
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new HeatMapQuerySetting(xAxis, yAxis, value, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return (
      ListUtils.isNotEmpty(configsAsMap.get(ConfigType.xAxis)) &&
      ListUtils.isNotEmpty(configsAsMap.get(ConfigType.yAxis)) &&
      ListUtils.isNotEmpty(configsAsMap.get(ConfigType.value))
    );
  }
}
