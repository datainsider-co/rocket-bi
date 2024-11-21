/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:42 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { Id, InputControlQuerySetting, QuerySetting, TableColumn } from '@core/common/domain';
import { QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class InputFilterQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value, false);
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new InputControlQuerySetting(value ? [value] : [], conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return true;
  }
}
