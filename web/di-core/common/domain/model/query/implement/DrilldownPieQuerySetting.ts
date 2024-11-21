/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '../QuerySetting';
import { Condition, Function, getFiltersAndSorts, InlineSqlView, OrderBy, QuerySettingClassName, TableColumn, WidgetId } from '@core/common/domain/model';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

/**
 * @deprecated unused from v1.0.0
 */
export class DrilldownPieQueryChartSetting extends QuerySetting {
  readonly className = QuerySettingClassName.Drilldown;

  constructor(
    public legends: TableColumn[],
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: DrilldownPieQueryChartSetting): DrilldownPieQueryChartSetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const legends = obj.legends?.map(legend => TableColumn.fromObject(legend)) ?? [];
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map(view => InlineSqlView.fromObject(view));

    return new DrilldownPieQueryChartSetting(legends, value, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [...this.legends.map(legend => legend.function), this.value.function];
  }

  getAllTableColumns(): TableColumn[] {
    return [...this.legends, this.value];
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.legends = ConfigDataUtils.replaceDynamicFunctions(this.legends, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
