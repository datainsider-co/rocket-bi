/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:42 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { GroupedTableQuerySetting, Id, QuerySetting, TableColumn } from '@core/common/domain';
import { ChartUtils, ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/resolver';

export class TableQuerySettingHandler implements QuerySettingHandler {
  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const columns: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.columns).map(table => this.forceTurnOnCalcMinMax(table));
    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    // Excel table => JsonTableResponse, VizTableSetting return VizTableResponse
    return new GroupedTableQuerySetting(columns, conditions, sortings);
  }

  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    return ListUtils.isNotEmpty(configsAsMap.get(ConfigType.columns));
  }

  private forceTurnOnCalcMinMax(tableColumn: TableColumn): TableColumn {
    if (ChartUtils.isAggregationFunction(tableColumn.function) || ChartUtils.isNumberType(tableColumn.function.field.fieldType)) {
      return tableColumn.copyWith({ isCalcMinMax: true });
    } else {
      return tableColumn;
    }
  }
}
