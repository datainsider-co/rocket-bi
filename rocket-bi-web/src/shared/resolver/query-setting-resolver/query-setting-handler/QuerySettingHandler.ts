/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:40 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { Condition, Id, OrderBy } from '@core/common/domain/model';
import { QuerySettingUtils } from '@/utils';
import { Di } from '@core/common/modules';
import { ConditionResolver } from '@core/common/services/condition-builder/ConditionResolver';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { Log } from '@core/utils';

export const getConditionBuilder = (): ConditionResolver => {
  return Di.get(ConditionResolver);
};

/**
 * @return [conditions, sortList, tooltips]
 */
export const getExtraData = (configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): [Condition[], OrderBy[], any[]] => {
  const conditions: Condition[] = getConditionBuilder().buildConditions(filterAsMap);
  const sortList: OrderBy[] = QuerySettingUtils.buildListOrderBy(configsAsMap);
  return [conditions, sortList, []];
};

export abstract class QuerySettingHandler {
  abstract toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting;

  abstract canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean;
}
