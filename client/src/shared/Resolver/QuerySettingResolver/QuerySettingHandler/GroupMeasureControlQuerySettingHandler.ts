/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:43 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { GroupMeasurementQuerySetting, Id, QuerySetting, TabFilterQuerySetting, TableColumn } from '@core/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/Resolver';

export class GroupMeasureControlQuerySettingHandler implements QuerySettingHandler {
  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.values));
  }

  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const values: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.values);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new GroupMeasurementQuerySetting(values, conditions, sortings);
  }
}
