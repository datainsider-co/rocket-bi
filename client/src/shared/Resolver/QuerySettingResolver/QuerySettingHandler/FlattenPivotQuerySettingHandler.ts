/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:43 AM
 */

import { ConditionData, ConfigType, FunctionData } from '@/shared';
import { FlattenPivotTableQuerySetting, Id, PivotTableQuerySetting, QuerySetting, TableColumn } from '@core/domain';
import { ListUtils, QuerySettingUtils } from '@/utils';
import { getExtraData, QuerySettingHandler } from '@/shared/Resolver';

export class FlattenPivotQuerySettingHandler implements QuerySettingHandler {
  canBuildQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): boolean {
    const isExistedColumn = ListUtils.isNotEmpty(configsAsMap.get(ConfigType.columns));
    const isExistedRow = ListUtils.isNotEmpty(configsAsMap.get(ConfigType.rows));
    const isExistedValue = ListUtils.isNotEmpty(configsAsMap.get(ConfigType.values));
    return isExistedColumn || isExistedRow || isExistedValue;
  }

  toQuerySetting(configsAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<Id, ConditionData[]>): QuerySetting {
    const columns: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.columns, false);
    const rows: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.rows, false).map(this.forceTurnOffCalcTotal);
    const values: TableColumn[] = QuerySettingUtils.buildListTableColumn(configsAsMap, ConfigType.values, false).map(this.forceTurnOnCalcMinMax);

    const [conditions, sortings, tooltips] = getExtraData(configsAsMap, filterAsMap);
    return new FlattenPivotTableQuerySetting(columns, rows, values, conditions, sortings, {});
  }

  private forceTurnOffCalcTotal(tableColumn: TableColumn): TableColumn {
    return tableColumn.copyWith({ isCalcGroupTotal: false });
  }

  private forceTurnOnCalcMinMax(tableColumn: TableColumn): TableColumn {
    return tableColumn.copyWith({ isCalcMinMax: true });
  }
}
