/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:43 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { GeoArea, Id, MapQuerySetting, QuerySetting, TableColumn } from '@core/common/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { Log } from '@core/utils';

export class MapQuerySettingHandler implements QuerySettingHandler {
  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.value));
  }

  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const location: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.location);
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value);
    Log.debug('toQuerySetting::', GeolocationModule.areaSelected);
    const geoArea: GeoArea | undefined = GeolocationModule.areaAsMap.get(GeolocationModule.areaSelected ?? '');
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    Log.debug('toQuerySetting::geoArea', new MapQuerySetting(location, value, '{}', geoArea, conditions, sortings));
    return new MapQuerySetting(location, value, '{}', geoArea, conditions, sortings);
  }
}
