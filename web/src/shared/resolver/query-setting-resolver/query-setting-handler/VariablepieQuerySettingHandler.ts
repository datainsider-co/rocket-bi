import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { Id, QuerySetting, TableColumn, VariablepieQuerySetting } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';
import { compact } from 'lodash';

export class VariablepieQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const legend: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.legend);
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value);
    const weight: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.weight, false);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new VariablepieQuerySetting(compact([legend, value, weight]), conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.legend)) && ListUtils.isNotEmpty(configsAsMap.get(ConfigType.value));
  }
}
