import { Id, QuerySetting, SpiderWebQuerySetting, TableColumn } from '@core/domain';
import { getExtraData, QuerySettingHandler } from '@/shared/Resolver';
import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { ListUtils, QuerySettingUtils } from '@/utils';

export class SpyderWebQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const legend: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.legend);
    const values: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.values);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new SpiderWebQuerySetting(legend, values, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.legend)) && ListUtils.isNotEmpty(configsAsMap.get(ConfigType.values));
  }
}
