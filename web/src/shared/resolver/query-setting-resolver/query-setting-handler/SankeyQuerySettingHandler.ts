import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { Id, QuerySetting, TableColumn, SankeyQuerySetting } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';
import { Log } from '@core/utils';

export class SankeyQuerySettingHandler implements QuerySettingHandler {
  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    const containSource: boolean = ListUtils.isNotEmpty(configsAsMap.get(ConfigType.source));
    const containDestination: boolean = ListUtils.isNotEmpty(configsAsMap.get(ConfigType.destination));
    const containWeight: boolean = ListUtils.isNotEmpty(configsAsMap.get(ConfigType.weight));
    return containSource && containDestination && containWeight;
  }

  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const source: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.source);
    const destination: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.destination);
    const breakdowns: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.breakdowns, false);
    const weight: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.weight);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);

    return new SankeyQuerySetting(source, destination, breakdowns, weight, conditions, sortings);
  }
}
