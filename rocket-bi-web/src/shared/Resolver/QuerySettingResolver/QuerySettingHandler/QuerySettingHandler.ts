/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:40 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { Condition, Id, OrderBy } from '@core/domain/Model';
import { QuerySettingUtils } from '@/utils';
import { DI } from '@core/modules';
import { ConditionResolver } from '@core/services/condition_builder/condition_resolver';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import { Log } from '@core/utils';

export const getConditionBuilder = (): ConditionResolver => {
  return DI.get(ConditionResolver);
};

export const getExtraData = (configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): [Condition[], OrderBy[], any[]] => {
  const conditions: Condition[] = getConditionBuilder().buildConditions(filterAsMap);
  Log.debug('getExtraData::conditions::', filterAsMap, conditions);
  const sortings: OrderBy[] = QuerySettingUtils.buildListOrderBy(configsAsMap);
  return [conditions, sortings, []];
};

export abstract class QuerySettingHandler {
  abstract toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting;

  abstract canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean;
}
