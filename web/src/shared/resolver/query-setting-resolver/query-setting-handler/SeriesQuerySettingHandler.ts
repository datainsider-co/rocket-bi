/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:40 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { Id, QuerySetting, SeriesQuerySetting, TableColumn } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class SeriesQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const xAxis: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.xAxis);
    const yAxis: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.yAxis);
    const legend: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.legendOptional, false);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new SeriesQuerySetting(xAxis, yAxis, legend, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.xAxis)) && ListUtils.isNotEmpty(configsAsMap.get(ConfigType.yAxis));
  }
}
