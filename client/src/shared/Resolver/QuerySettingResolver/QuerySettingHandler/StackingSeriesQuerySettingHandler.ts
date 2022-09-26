/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:42 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { Id, QuerySetting, StackedQuerySetting, TableColumn } from '@core/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/Resolver';

export class StackingSeriesQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const xAxis: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.xAxis);
    const yAxis: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.yAxis);
    const legend: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.legendOptional, false);
    const breakdown: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.breakdownOptional, false);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new StackedQuerySetting(xAxis, yAxis, legend, breakdown, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.xAxis)) && ListUtils.isNotEmpty(configsAsMap.get(ConfigType.yAxis));
  }
}
