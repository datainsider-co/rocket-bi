/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:42 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { DateTimeToMillis, DIException, GroupedTableQuerySetting, Id, InputControlQuerySetting, Max, Min, QuerySetting, TableColumn } from '@core/domain';
import { ChartUtils, ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/Resolver';

export class DateSelectFilterQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value, false);
    if (value) {
      const scalarFunction = ChartUtils.isDateType(value.function.field.fieldType)
        ? new DateTimeToMillis(value.function.scalarFunction)
        : value.function.scalarFunction;
      const minColumn = value.copyWith({
        fieldRelatedFunction: new Min(value.function.field, scalarFunction)
      });
      const maxColumn = value.copyWith({
        fieldRelatedFunction: new Max(value.function.field, scalarFunction)
      });
      return new InputControlQuerySetting([minColumn, maxColumn], conditions, sortings);
    } else {
      return new InputControlQuerySetting([], conditions, sortings);
    }
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return true;
  }
}
