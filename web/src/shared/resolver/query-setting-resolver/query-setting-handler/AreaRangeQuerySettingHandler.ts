/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:40 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { GenericChartQuerySetting, Id, QuerySetting, SeriesQuerySetting, TableColumn, TableQueryChartSetting } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';
import FlattenTableSetting from '@/shared/settings/table/FlattenTableSetting.vue';

export class AreaRangeQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const xAxis: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.xAxis);
    const min: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.min);
    const max: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.max);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    // return new SeriesQuerySetting(xAxis, [min, max], void 0, conditions, sortings);
    return new GenericChartQuerySetting([xAxis, min, max], conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return (
      ListUtils.isNotEmpty(configsAsMap.get(ConfigType.xAxis)) &&
      ListUtils.isNotEmpty(configsAsMap.get(ConfigType.min)) &&
      ListUtils.isNotEmpty(configsAsMap.get(ConfigType.max))
    );
  }
}
