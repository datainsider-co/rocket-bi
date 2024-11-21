/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:32 AM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 11/29/20, 5:48 PM
 */

import { QuerySettingHandler } from '@/shared/resolver/query-setting-resolver/query-setting-handler/QuerySettingHandler';
import { ConditionData, ConfigType, FunctionData, ChartType } from '@/shared';
import { Id } from '@core/common/domain/model';
import { DIException } from '@core/common/domain/exception';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';

export class QuerySettingResolver {
  constructor(private mapCreator: Map<string, QuerySettingHandler>) {}

  toQuerySetting(chartType: ChartType, configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const creator = this.mapCreator.get(chartType);
    if (creator) {
      return creator.toQuerySetting(configsAsMap, filterAsMap);
    } else {
      throw new DIException(`Handler for ${chartType} not found!`);
    }
  }

  canBuildQuerySetting(chartType: ChartType, configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    const creator = this.mapCreator.get(chartType);
    if (creator) {
      return creator.canBuildQuerySetting(configsAsMap, filterAsMap);
    } else {
      throw new DIException(`Handler for ${chartType} not found!`);
    }
  }
}
