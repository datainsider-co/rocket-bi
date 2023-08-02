/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:42 AM
 */

import { ConditionData, ConfigType, DateFunctionTypes, FunctionData } from '@/shared';
import {
  DateTimeToMillis,
  DIException,
  GroupedTableQuerySetting,
  Id,
  InputControlQuerySetting,
  Max,
  Min,
  QuerySetting,
  ScalarFunction,
  Select,
  TableColumn
} from '@core/common/domain';
import { ChartUtils, ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';
import { Log } from '@core/utils';
import { clone } from 'lodash';

export class SlicerFilterQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    const value: TableColumn = QuerySettingUtils.buildTableColumn(configsAsMap, ConfigType.value, false);
    if (value) {
      const scalarFunction: ScalarFunction | undefined = this.buildScalarFunction(value);
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

  private buildScalarFunction(value: TableColumn): ScalarFunction | undefined {
    const isDateType = ChartUtils.isDateType(value.function.field.fieldType);
    if (isDateType) {
      return new DateTimeToMillis(); ///Date column will hard code function (from datetime to time stamp) for ui render
    } else {
      return value.function.scalarFunction;
    }
  }
}
